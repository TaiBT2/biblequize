package com.biblequiz.modules.coverage.service;

import com.biblequiz.modules.coverage.entity.UserSeasonBadge;
import com.biblequiz.modules.coverage.entity.UserSeasonCoverage;
import com.biblequiz.modules.coverage.repository.UserSeasonBadgeRepository;
import com.biblequiz.modules.coverage.repository.UserSeasonCoverageRepository;
import com.biblequiz.modules.coverage.service.BadgeTierCalculator.BadgeTier;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.quiz.repository.UserQuestionHistoryRepository;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Awards end-of-season Liturgical Coverage badges (SPEC_USER_v3.2 §7.1.8).
 *
 * <p>Idempotent — the {@code (user, season)} unique constraint on
 * {@code user_season_badges} plus an existence pre-check guarantee one badge
 * per user per season even if {@code awardIfEligible} runs multiple times
 * (e.g. scheduler + reconciliation).</p>
 *
 * <p>Triggered by {@code BadgeAwardScheduler} at a season's calendar end —
 * NOT by week-13 completion, so casual users (21-50 books = Hành Hương) are
 * not skipped.</p>
 */
@Service
public class BadgeAwardService {

    private static final Logger log = LoggerFactory.getLogger(BadgeAwardService.class);

    private final UserSeasonBadgeRepository badgeRepo;
    private final BadgeTierCalculator tierCalc;
    private final UserSeasonCoverageRepository coverageRepo;
    private final SeasonRepository seasonRepo;
    private final UserQuestionHistoryRepository historyRepo;
    private final UserDailyProgressRepository dailyProgressRepo;
    private final CoverageAnalytics analytics;

    public BadgeAwardService(UserSeasonBadgeRepository badgeRepo,
                             BadgeTierCalculator tierCalc,
                             UserSeasonCoverageRepository coverageRepo,
                             SeasonRepository seasonRepo,
                             UserQuestionHistoryRepository historyRepo,
                             UserDailyProgressRepository dailyProgressRepo,
                             CoverageAnalytics analytics) {
        this.badgeRepo = badgeRepo;
        this.tierCalc = tierCalc;
        this.coverageRepo = coverageRepo;
        this.seasonRepo = seasonRepo;
        this.historyRepo = historyRepo;
        this.dailyProgressRepo = dailyProgressRepo;
        this.analytics = analytics;
    }

    /**
     * Awards a badge for the user at season end if eligible (≥ 21 books covered).
     * Idempotent — returns empty if a badge already exists or the user did not
     * reach a badge tier.
     */
    @Transactional
    public Optional<UserSeasonBadge> awardIfEligible(String userId, String seasonId) {
        if (badgeRepo.existsByUserIdAndSeasonId(userId, seasonId)) {
            return Optional.empty();
        }
        UserSeasonCoverage coverage = coverageRepo.findByUserIdAndSeasonId(userId, seasonId)
                .orElse(null);
        if (coverage == null) return Optional.empty();

        int booksCovered = tierCalc.countCoveredBooks(coverage.getBookCoverage());
        BadgeTier tier = tierCalc.calculateTier(booksCovered);
        if (tier == BadgeTier.NONE) {
            return Optional.empty();
        }

        Season season = seasonRepo.findById(seasonId).orElse(null);
        if (season == null) return Optional.empty();

        int totalQuestions = coverage.getBookCoverage().values().stream()
                .filter(v -> v != null).mapToInt(Integer::intValue).sum();
        int accuracy = computeAccuracy(userId);
        int daysActive = dailyProgressRepo
                .findByUserIdAndDateBetween(userId, season.getStartDate(), season.getEndDate())
                .size();

        UserSeasonBadge badge = new UserSeasonBadge();
        badge.setId(UUID.randomUUID().toString());
        badge.setUserId(userId);
        badge.setSeasonId(seasonId);
        badge.setBadgeTier(tier.name());
        badge.setBooksCovered(booksCovered);
        badge.setTotalQuestions(totalQuestions);
        badge.setAccuracy(accuracy);
        badge.setDaysActive(daysActive);
        badge = badgeRepo.save(badge);

        analytics.seasonBadgeAwarded(userId, tier.name(), booksCovered, season.getId());
        log.info("Badge awarded: user={} season={} tier={} books={}",
                userId, seasonId, tier, booksCovered);
        return Optional.of(badge);
    }

    /** Most recent badge the user has not yet seen — for BadgeAwardModal trigger. */
    public Optional<UserSeasonBadge> findUnshownBadge(String userId) {
        return badgeRepo.findFirstByUserIdAndShownToUserAtIsNullOrderByAwardedAtDesc(userId);
    }

    /**
     * Marks a badge as shown after the FE displays the modal. Ownership-checked:
     * only the badge's owner can mark it.
     */
    @Transactional
    public void markAsShown(String badgeId, String userId) {
        badgeRepo.findById(badgeId).ifPresent(badge -> {
            if (!badge.getUserId().equals(userId)) {
                throw new IllegalArgumentException("Badge does not belong to user");
            }
            badge.setShownToUserAt(java.time.LocalDateTime.now());
            badgeRepo.save(badge);
        });
    }

    /**
     * Lifetime accuracy from UserQuestionHistory aggregate.
     *
     * <p>Note: this is all-time, not season-scoped — coverage history is not
     * partitioned per season. Acceptable approximation for the badge stat
     * display; precise per-season accuracy would need a new counter column.</p>
     */
    private int computeAccuracy(String userId) {
        Object[] stats = historyRepo.sumOverallAccuracy(userId);
        if (stats == null || stats.length < 3) return 0;
        long correct = toLong(stats[1]);
        long wrong = toLong(stats[2]);
        long attempts = correct + wrong;
        if (attempts == 0) return 0;
        return (int) Math.round((double) correct / attempts * 100);
    }

    private static long toLong(Object o) {
        return o instanceof Number n ? n.longValue() : 0L;
    }
}
