package com.biblequiz.modules.coverage.service;

import com.biblequiz.infrastructure.bible.BibleStructure;
import com.biblequiz.modules.coverage.entity.WeeklyPairing;
import com.biblequiz.modules.coverage.entity.WeeklyPairing.Phase;
import com.biblequiz.modules.coverage.repository.WeeklyPairingRepository;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Deterministic weekly pairing compute for the Liturgical Coverage System (§7.3).
 *
 * <p>Algorithm v1 (§7.3.2):
 * <ol>
 *   <li>Reserve weeks 9-11 (Climax, 18 books) starting with Season.focusBooks,
 *       expanded with same-testament neighbors by chapter-count proxy.</li>
 *   <li>Remaining 48 books distributed across weeks 1-8: 1 large + 5 small per week.</li>
 *   <li>Weeks 1-4 = Foundation (more OT anchors), 5-8 = Acceleration.</li>
 *   <li>Weeks 12-13 = Mastery (empty book_codes, runtime-computed per user).</li>
 * </ol>
 *
 * <p>Invariants enforced via assertion-style checks (logged + exception on violation):
 * <ul>
 *   <li>All 66 books appear exactly once across weeks 1-11.</li>
 *   <li>No duplicate within a week.</li>
 *   <li>Exactly 18 climax + 48 non-climax books.</li>
 * </ul>
 */
@Service
public class WeeklyPairingService {

    private static final Logger log = LoggerFactory.getLogger(WeeklyPairingService.class);

    private final SeasonRepository seasonRepository;
    private final WeeklyPairingRepository pairingRepository;

    public WeeklyPairingService(SeasonRepository seasonRepository,
                                WeeklyPairingRepository pairingRepository) {
        this.seasonRepository = seasonRepository;
        this.pairingRepository = pairingRepository;
    }

    /**
     * Auto-compute pairings for all seasons missing them. Idempotent — skips
     * seasons already at full 13-pairing count. Runs after Spring Boot ready
     * so SeasonSeeder (also @EventListener) has populated focus_books first.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        try {
            int seeded = computeMissingPairings();
            if (seeded > 0) {
                log.info("WeeklyPairingService: computed pairings for {} seasons", seeded);
            }
        } catch (Exception e) {
            log.error("WeeklyPairingService auto-compute failed — continuing without pairings", e);
        }
    }

    @Transactional
    public int computeMissingPairings() {
        List<Season> seasons = seasonRepository.findAll();
        int seeded = 0;
        for (Season season : seasons) {
            long existing = pairingRepository.countBySeasonId(season.getId());
            if (existing >= 13) continue;
            if (season.getFocusBooks() == null || season.getFocusBooks().isEmpty()) {
                log.warn("Season {} has no focus_books — skipping pairing compute", season.getId());
                continue;
            }
            List<WeeklyPairing> pairings = computeForSeason(season);
            pairingRepository.saveAll(pairings);
            seeded++;
        }
        return seeded;
    }

    /**
     * Computes 13 weekly pairings for a single season. Deterministic.
     * Does NOT persist — caller decides.
     */
    public List<WeeklyPairing> computeForSeason(Season season) {
        List<String> focusBooks = season.getFocusBooks();
        if (focusBooks == null || focusBooks.isEmpty()) {
            throw new IllegalStateException("Season " + season.getId() + " has no focus_books");
        }
        if (focusBooks.size() > 18) {
            throw new IllegalStateException("Season " + season.getId() + " focus_books > 18 (got "
                    + focusBooks.size() + ")");
        }

        List<String> allBooks = BibleStructure.getCanonicalBooks();
        if (allBooks.size() != 66) {
            throw new IllegalStateException("Expected 66 canonical books, got " + allBooks.size());
        }

        // Step 1: Build 18-book climax pool, starting from focus + same-testament neighbors
        List<String> climaxBooks = buildClimaxPool(focusBooks, allBooks);

        // Step 2: Remaining 48 books for weeks 1-8
        List<String> remaining = new ArrayList<>(allBooks);
        remaining.removeAll(climaxBooks);
        if (remaining.size() != 48) {
            throw new IllegalStateException("Expected 48 remaining books, got " + remaining.size());
        }

        // Step 3: Sort by chapter count desc — top 8 are anchors, rest are satellites
        remaining.sort((a, b) -> Integer.compare(
                BibleStructure.getMaxChapter(b), BibleStructure.getMaxChapter(a)));
        List<String> largeBooks = remaining.subList(0, 8);
        List<String> smallBooks = remaining.subList(8, 48);

        // Step 4: Distribute 1 large + 5 small per week (weeks 1-8)
        List<List<String>> weeks1to8 = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            List<String> week = new ArrayList<>();
            week.add(largeBooks.get(i));
            week.addAll(smallBooks.subList(i * 5, (i + 1) * 5));
            weeks1to8.add(week);
        }

        // Step 5: Chunk climax 18 books into 3 weeks of 6
        List<List<String>> climaxWeeks = List.of(
                climaxBooks.subList(0, 6),
                climaxBooks.subList(6, 12),
                climaxBooks.subList(12, 18)
        );

        // Step 6: Assemble pairings + verify invariants
        List<WeeklyPairing> pairings = new ArrayList<>(13);
        Set<String> seen = new LinkedHashSet<>();
        for (int week = 1; week <= 11; week++) {
            List<String> books;
            Phase phase;
            if (week <= 4) {
                books = weeks1to8.get(week - 1);
                phase = Phase.FOUNDATION;
            } else if (week <= 8) {
                books = weeks1to8.get(week - 1);
                phase = Phase.ACCELERATION;
            } else {
                books = climaxWeeks.get(week - 9);
                phase = Phase.CLIMAX;
            }
            for (String b : books) {
                if (!seen.add(b)) {
                    throw new IllegalStateException("Book " + b + " duplicated in season "
                            + season.getId() + " week " + week);
                }
            }
            pairings.add(new WeeklyPairing(
                    UUID.randomUUID().toString(),
                    season.getId(),
                    week,
                    phase,
                    new ArrayList<>(books)
            ));
        }
        if (seen.size() != 66) {
            throw new IllegalStateException("Season " + season.getId()
                    + " pairings cover " + seen.size() + " books, expected 66");
        }

        // Mastery weeks 12-13: empty book_codes (runtime-computed per user)
        for (int week : new int[]{12, 13}) {
            pairings.add(new WeeklyPairing(
                    UUID.randomUUID().toString(),
                    season.getId(),
                    week,
                    Phase.MASTERY,
                    new ArrayList<>()
            ));
        }

        return pairings;
    }

    /**
     * Build 18-book climax pool from focus + neighbors. Strategy: start with
     * focus books (in given order), expand with remaining books from the same
     * testament majority as focus, sorted by chapter count desc.
     *
     * <p>This is intentionally simple for v1. Admin override (§7.3.4) handles
     * cases where semantic curation matters.</p>
     */
    private List<String> buildClimaxPool(List<String> focusBooks, List<String> allBooks) {
        List<String> climax = new ArrayList<>();
        for (String b : focusBooks) {
            if (BibleStructure.isKnown(b) && !climax.contains(b)) {
                climax.add(b);
            }
        }
        if (climax.size() >= 18) {
            return climax.subList(0, 18);
        }

        // Determine majority testament from focus to bias neighbor selection
        int ntCount = 0;
        for (String b : climax) if (BibleStructure.isNewTestament(b)) ntCount++;
        boolean preferNT = ntCount * 2 >= climax.size();

        // Candidates: all canonical books not in climax, sorted by chapter count desc.
        // Preferred testament first, then the other.
        List<String> preferred = new ArrayList<>();
        List<String> other = new ArrayList<>();
        for (String b : allBooks) {
            if (climax.contains(b)) continue;
            if (BibleStructure.isNewTestament(b) == preferNT) preferred.add(b);
            else other.add(b);
        }
        preferred.sort((a, b) -> Integer.compare(
                BibleStructure.getMaxChapter(b), BibleStructure.getMaxChapter(a)));
        other.sort((a, b) -> Integer.compare(
                BibleStructure.getMaxChapter(b), BibleStructure.getMaxChapter(a)));

        for (String b : preferred) {
            if (climax.size() >= 18) break;
            climax.add(b);
        }
        for (String b : other) {
            if (climax.size() >= 18) break;
            climax.add(b);
        }
        return climax;
    }

    /**
     * Admin override per §7.3.4. Sets {@code is_admin_override = true} so
     * future re-compute calls skip the row. Validates the request: 6 books,
     * all canonical, no duplicates, week in range.
     */
    @Transactional
    public WeeklyPairing overridePairing(String seasonId, int weekNumber, List<String> bookCodes) {
        if (weekNumber < 1 || weekNumber > 13) {
            throw new IllegalArgumentException("week_number must be 1..13");
        }
        if (weekNumber >= 12) {
            if (bookCodes != null && !bookCodes.isEmpty()) {
                throw new IllegalArgumentException("Mastery weeks (12-13) must have empty book_codes");
            }
            bookCodes = new ArrayList<>();
        } else {
            if (bookCodes == null || bookCodes.size() != 6) {
                throw new IllegalArgumentException("Regular weeks (1-11) require exactly 6 books");
            }
            Set<String> uniq = new LinkedHashSet<>(bookCodes);
            if (uniq.size() != 6) {
                throw new IllegalArgumentException("book_codes must be unique within a week");
            }
            for (String b : bookCodes) {
                if (!BibleStructure.isKnown(b)) {
                    throw new IllegalArgumentException("Unknown book: " + b);
                }
            }
        }

        WeeklyPairing pairing = pairingRepository
                .findBySeasonIdAndWeekNumber(seasonId, weekNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No pairing for season " + seasonId + " week " + weekNumber));
        pairing.setBookCodes(bookCodes);
        pairing.setIsAdminOverride(true);
        return pairingRepository.save(pairing);
    }
}
