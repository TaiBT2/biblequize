package com.biblequiz.modules.coverage.service;

import com.biblequiz.modules.coverage.entity.UserSeasonCoverage;
import com.biblequiz.modules.coverage.entity.WeeklyPairing;
import com.biblequiz.modules.coverage.repository.UserSeasonCoverageRepository;
import com.biblequiz.modules.coverage.repository.WeeklyPairingRepository;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Core service for the Liturgical Coverage System (§7.1). Handles
 * per-user coverage state transitions: lazy-create, tick book counter,
 * detect week completion, build active pool, build Mastery Week pool,
 * unlock next week.
 *
 * <p>Coverage threshold = 4 answered questions per book (§7.1.4). A week
 * completes when all 6 of its books reach the threshold. Forgiveness
 * applies at week-level (no debt) but book-level coverage persists
 * across weeks → uncovered books pool into Mastery Week (§7.1.6/§7.1.7).</p>
 *
 * <p>Returns {@link UserSeasonCoverage} but never exposes mutable
 * methods that bypass the transition rules — callers go through this
 * service.</p>
 */
@Service
public class LiturgicalCoverageService {

    public static final int COVERAGE_THRESHOLD = 4;
    public static final int BOOKS_PER_WEEK = 6;
    public static final int TOTAL_BOOKS = 66;
    public static final int LAST_REGULAR_WEEK = 11;
    public static final int LAST_WEEK = 13;
    public static final int AHEAD_LIMIT = 1;

    private static final Logger log = LoggerFactory.getLogger(LiturgicalCoverageService.class);

    private final UserSeasonCoverageRepository coverageRepository;
    private final WeeklyPairingRepository pairingRepository;
    private final SeasonRepository seasonRepository;
    private final CoverageAnalytics analytics;

    public LiturgicalCoverageService(UserSeasonCoverageRepository coverageRepository,
                                     WeeklyPairingRepository pairingRepository,
                                     SeasonRepository seasonRepository,
                                     CoverageAnalytics analytics) {
        this.coverageRepository = coverageRepository;
        this.pairingRepository = pairingRepository;
        this.seasonRepository = seasonRepository;
        this.analytics = analytics;
    }

    /**
     * Returns the user's coverage record for the season, lazy-creating
     * one if missing (§7.11.1). currentWeek defaults to the calendar week
     * of the season at first creation — supports late joiners (§7.11.6).
     */
    @Transactional
    public UserSeasonCoverage getOrCreateCoverage(String userId, String seasonId, int userTier) {
        Optional<UserSeasonCoverage> existing = coverageRepository.findByUserIdAndSeasonId(userId, seasonId);
        if (existing.isPresent()) return existing.get();

        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new IllegalArgumentException("Season not found: " + seasonId));

        int calendarWeek = calendarWeekOf(season, LocalDate.now(ZoneOffset.UTC));
        int initialWeek = Math.max(1, Math.min(calendarWeek, LAST_WEEK));

        UserSeasonCoverage c = new UserSeasonCoverage();
        c.setId(UUID.randomUUID().toString());
        c.setUserId(userId);
        c.setSeasonId(seasonId);
        c.setCurrentWeek(initialWeek);
        c.setWeeksCompleted(new ArrayList<>());
        c.setBookCoverage(new HashMap<>());
        coverageRepository.save(c);

        if (initialWeek > 1) {
            analytics.lateJoinerDetected(userId, initialWeek, userTier);
        }
        return c;
    }

    /**
     * Outcome of a book tick: whether the user's current week just transitioned
     * to fully covered (6/6 books ≥ threshold) and, if so, next week's book list
     * for the FE WeekCompleteModal preview.
     */
    public record WeekCompletionResult(
            boolean justCompleted,
            int completedWeek,
            List<String> nextWeekBooks
    ) {}

    /**
     * Increments the book counter and detects 3→4 transition for telemetry.
     * Also detects week completion (transition from incomplete to all-6-covered)
     * and fires week_completed event idempotently.
     *
     * @return {@link WeekCompletionResult} — {@code justCompleted=true} only on
     *         the first answer that completes the week.
     */
    @Transactional
    public WeekCompletionResult tickBookCoverage(String userId, String seasonId,
                                                 String book, int userTier) {
        UserSeasonCoverage c = coverageRepository.findByUserIdAndSeasonId(userId, seasonId)
                .orElseThrow(() -> new IllegalStateException(
                        "No coverage record for user " + userId + " season " + seasonId));

        Map<String, Integer> bc = c.getBookCoverage();
        int before = bc.getOrDefault(book, 0);
        int after = before + 1;
        bc.put(book, after);
        c.setBookCoverage(bc);

        WeekCompletionResult result = new WeekCompletionResult(false, c.getCurrentWeek(), List.of());

        // 3→4 transition: book just crossed coverage threshold
        if (before == COVERAGE_THRESHOLD - 1 && after == COVERAGE_THRESHOLD) {
            int week = c.getCurrentWeek();
            String phase = getWeekPhase(seasonId, week);
            analytics.coverageBookTicked(userId, book, after, userTier, week, phase);

            // Check if current week just completed
            result = checkAndMarkWeekComplete(c, seasonId);
        }

        coverageRepository.save(c);
        return result;
    }

    /** True if the week's 6 books are all covered (≥4 each). Mastery weeks (12-13) never complete this way. */
    public boolean isWeekCompleted(UserSeasonCoverage coverage, String seasonId, int weekNumber) {
        if (weekNumber > LAST_REGULAR_WEEK) return false;
        List<String> weekBooks = getWeekBooks(seasonId, weekNumber);
        if (weekBooks.isEmpty()) return false;
        for (String book : weekBooks) {
            if (coverage.getBookCoverage().getOrDefault(book, 0) < COVERAGE_THRESHOLD) return false;
        }
        return true;
    }

    /**
     * Active pool for the user's current week (§7.1.5). Returns the week's
     * books minus already-covered ones, so user focuses on remaining work.
     * If all 6 covered, returns full list (caller usually triggers unlock).
     * Mastery weeks (12-13) → see {@link #getMasteryWeekPool}.
     */
    public List<String> getActivePool(UserSeasonCoverage coverage, String seasonId) {
        int week = coverage.getCurrentWeek();
        if (week >= 12) {
            return getMasteryWeekPool(coverage);
        }
        List<String> weekBooks = getWeekBooks(seasonId, week);
        List<String> active = new ArrayList<>();
        for (String book : weekBooks) {
            if (coverage.getBookCoverage().getOrDefault(book, 0) < COVERAGE_THRESHOLD) {
                active.add(book);
            }
        }
        // If all covered, return all 6 anyway (caller decides whether to unlock next week)
        return active.isEmpty() ? new ArrayList<>(weekBooks) : active;
    }

    /**
     * Mastery Week pool (§7.1.7): all books still under coverage threshold
     * across the entire season. If user has full coverage, returns all 66
     * (bonus mode — caller may award badge).
     */
    public List<String> getMasteryWeekPool(UserSeasonCoverage coverage) {
        List<String> uncovered = new ArrayList<>();
        Set<String> allBooks = new LinkedHashSet<>(
                com.biblequiz.infrastructure.bible.BibleStructure.getCanonicalBooks());
        for (String book : allBooks) {
            if (coverage.getBookCoverage().getOrDefault(book, 0) < COVERAGE_THRESHOLD) {
                uncovered.add(book);
            }
        }
        if (uncovered.isEmpty()) {
            return new ArrayList<>(allBooks);
        }
        return uncovered;
    }

    /**
     * User-triggered next-week unlock (§7.1.5, §7.8.3). Validates:
     * - current week completed
     * - not already at LAST_WEEK
     * - not exceeding {@link #AHEAD_LIMIT} weeks ahead of calendar
     */
    @Transactional
    public UserSeasonCoverage unlockNextWeek(String userId, String seasonId) {
        UserSeasonCoverage c = coverageRepository.findByUserIdAndSeasonId(userId, seasonId)
                .orElseThrow(() -> new IllegalStateException("No coverage record"));
        int week = c.getCurrentWeek();
        if (week >= LAST_WEEK) {
            throw new UnlockException("NO_NEXT_WEEK");
        }
        if (!isWeekCompleted(c, seasonId, week)) {
            throw new UnlockException("WEEK_NOT_COMPLETED");
        }
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new IllegalStateException("Season not found"));
        int calendarWeek = calendarWeekOf(season, LocalDate.now(ZoneOffset.UTC));
        int next = week + 1;
        if (next - calendarWeek > AHEAD_LIMIT) {
            throw new UnlockException("ALREADY_AHEAD_LIMIT");
        }

        c.setCurrentWeek(next);
        coverageRepository.save(c);
        analytics.unlockNextWeekTriggered(userId, week, next, Math.max(0, next - calendarWeek));
        if (next >= 12) {
            int uncovered = getMasteryWeekPool(c).size();
            analytics.masteryWeekEntered(userId, uncovered, season.getId());
        }
        return c;
    }

    /**
     * Count of books covered (≥ threshold) in the season — drives end-of-season
     * badge tier (§7.1.8). 66/66 = Toàn Thư, 51-65 = Tận Tâm, 21-50 = Hành Hương.
     */
    public int countCovered(UserSeasonCoverage coverage) {
        int count = 0;
        for (Integer answered : coverage.getBookCoverage().values()) {
            if (answered != null && answered >= COVERAGE_THRESHOLD) count++;
        }
        return count;
    }

    // ------------------- helpers -------------------

    /**
     * Marks the current week complete if all 6 books crossed threshold.
     * Idempotent — only the first call per (user, season, week) returns
     * {@code justCompleted=true} and fires telemetry.
     */
    private WeekCompletionResult checkAndMarkWeekComplete(UserSeasonCoverage c, String seasonId) {
        int week = c.getCurrentWeek();
        if (c.getWeeksCompleted().contains(week)) {
            return new WeekCompletionResult(false, week, List.of());
        }
        if (!isWeekCompleted(c, seasonId, week)) {
            return new WeekCompletionResult(false, week, List.of());
        }

        c.getWeeksCompleted().add(week);
        Season season = seasonRepository.findById(seasonId).orElse(null);
        long daysTaken = season != null
                ? ChronoUnit.DAYS.between(season.getStartDate(), LocalDate.now(ZoneOffset.UTC))
                : 0;
        analytics.weekCompleted(
                c.getUserId(),
                week,
                season != null ? season.getId() : seasonId,
                daysTaken,
                getWeekBooks(seasonId, week)
        );
        // Next week's books for FE preview (empty for week 11 → no week 12 books,
        // and Mastery weeks 12-13 have empty book_codes by design).
        return new WeekCompletionResult(true, week, getWeekBooks(seasonId, week + 1));
    }

    private List<String> getWeekBooks(String seasonId, int weekNumber) {
        return pairingRepository.findBySeasonIdAndWeekNumber(seasonId, weekNumber)
                .map(WeeklyPairing::getBookCodes)
                .orElse(List.of());
    }

    private String getWeekPhase(String seasonId, int weekNumber) {
        return pairingRepository.findBySeasonIdAndWeekNumber(seasonId, weekNumber)
                .map(p -> p.getPhase().name())
                .orElse("UNKNOWN");
    }

    /** Calendar week (1-13) of the season on the given date. Clamps to [1, LAST_WEEK]. */
    private int calendarWeekOf(Season season, LocalDate date) {
        long days = ChronoUnit.DAYS.between(season.getStartDate(), date);
        if (days < 0) return 1;
        int week = (int) (days / 7) + 1;
        return Math.max(1, Math.min(week, LAST_WEEK));
    }

    /** Thrown when {@link #unlockNextWeek} preconditions fail. */
    public static class UnlockException extends RuntimeException {
        private final String code;
        public UnlockException(String code) {
            super(code);
            this.code = code;
        }
        public String getCode() { return code; }
    }
}
