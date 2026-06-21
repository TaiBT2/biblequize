package com.biblequiz.modules.ranked.service;

import com.biblequiz.modules.quiz.entity.Question;
import org.springframework.stereotype.Service;

/**
 * SPEC-v2 scoring engine.
 *
 * Base points: Easy 8, Medium 12, Hard 18
 * Speed bonus (quadratic): floor(basePoints * 0.5 * speedRatio²)
 *   where speedRatio = (timeLimitMs - elapsedMs) / timeLimitMs
 * Combo multiplier: 5-streak → x1.2, 10-streak → x1.5
 * Daily first-question bonus: x2
 */
@Service
public class ScoringService {

    private static final int TIME_LIMIT_MS = 30_000;
    private final TierRewardsConfig tierRewardsConfig;

    public ScoringService(TierRewardsConfig tierRewardsConfig) {
        this.tierRewardsConfig = tierRewardsConfig;
    }

    public static class ScoreResult {
        public final int earned;
        public final int baseScore;
        public final int speedBonus;
        public final int comboMultiplierPercent; // 100 = x1.0, 120 = x1.2, 150 = x1.5
        public final boolean isDailyFirst;

        public ScoreResult(int earned, int baseScore, int speedBonus, int comboMultiplierPercent, boolean isDailyFirst) {
            this.earned = earned;
            this.baseScore = baseScore;
            this.speedBonus = speedBonus;
            this.comboMultiplierPercent = comboMultiplierPercent;
            this.isDailyFirst = isDailyFirst;
        }
    }

    /**
     * Calculates score for a correct answer per SPEC-v2.
     *
     * @param difficulty       question difficulty (null defaults to easy)
     * @param clientElapsedMs  time the user spent answering in milliseconds
     * @param currentStreak    streak of consecutive correct answers in this session
     * @param isDailyFirst     true if this is the user's first ranked answer today
     */
    public ScoreResult calculate(Question.Difficulty difficulty, int clientElapsedMs,
                                  int currentStreak, boolean isDailyFirst) {
        int baseScore = getBaseScore(difficulty);

        // F-api-5: clientElapsedMs is client-supplied — clamp to [0, TIME_LIMIT_MS]
        // before it feeds the speed bonus. Without the upper clamp a forged
        // negative value (e.g. -100000) pushed speedRatio above 1 and the
        // quadratic bonus to ~18× the legitimate max, inflating ranked score
        // (and thus tier + leaderboard). The lower clamp also folds in the old
        // Math.max(0,...) for over-time answers.
        int clampedElapsedMs = Math.max(0, Math.min(clientElapsedMs, TIME_LIMIT_MS));

        // Quadratic speed bonus: floor(basePoints * 0.5 * speedRatio²)
        double speedRatio = (double) (TIME_LIMIT_MS - clampedElapsedMs) / TIME_LIMIT_MS;
        int speedBonus = (int) Math.floor(baseScore * 0.5 * speedRatio * speedRatio);

        int subtotal = baseScore + speedBonus;

        // Combo multiplier
        int comboPercent = 100;
        if (currentStreak >= 10) {
            comboPercent = 150;
        } else if (currentStreak >= 5) {
            comboPercent = 120;
        }
        subtotal = subtotal * comboPercent / 100;

        // Daily first-question bonus
        if (isDailyFirst) {
            subtotal = subtotal * 2;
        }

        return new ScoreResult(subtotal, baseScore, speedBonus, comboPercent, isDailyFirst);
    }

    /**
     * Backwards-compatible overload (no daily-first flag).
     */
    public ScoreResult calculate(Question.Difficulty difficulty, int clientElapsedMs, int currentStreak) {
        return calculate(difficulty, clientElapsedMs, currentStreak, false);
    }

    /**
     * Calculate with tier XP multiplier applied.
     */
    public ScoreResult calculateWithTier(Question.Difficulty difficulty, int clientElapsedMs,
                                          int currentStreak, boolean isDailyFirst, int tierLevel) {
        return calculateWithTier(difficulty, clientElapsedMs, currentStreak, isDailyFirst, tierLevel, false, false);
    }

    /**
     * Backward-compat overload (no liturgical season bonus). Delegates with isInSeasonBook=false.
     */
    public ScoreResult calculateWithTier(Question.Difficulty difficulty, int clientElapsedMs,
                                          int currentStreak, boolean isDailyFirst, int tierLevel,
                                          boolean xpSurgeActive) {
        return calculateWithTier(difficulty, clientElapsedMs, currentStreak, isDailyFirst,
                tierLevel, xpSurgeActive, false);
    }

    /**
     * Calculate with tier XP multiplier + optional XP surge + optional liturgical season bonus.
     *
     * <p>Canonical formula per SPEC_USER_v3.2 §4.6 + §7.10.3:
     * {@code final = base × tier.xpMultiplier × (surge ? 1.5 : 1) × (seasonFocus ? 1.5 : 1)}.</p>
     *
     * <p>Wired:
     * <ul>
     *   <li>tier — BL-3 2026-05-13</li>
     *   <li>xpSurge — BL-3 2026-05-13</li>
     *   <li>isInSeasonBook — Liturgical Coverage sprint commit 7, 2026-05-21
     *       (caller computes via {@code LiturgicalSeasonService.isInSeasonFocus})</li>
     * </ul></p>
     */
    public ScoreResult calculateWithTier(Question.Difficulty difficulty, int clientElapsedMs,
                                          int currentStreak, boolean isDailyFirst, int tierLevel,
                                          boolean xpSurgeActive, boolean isInSeasonBook) {
        ScoreResult base = calculate(difficulty, clientElapsedMs, currentStreak, isDailyFirst);
        double multiplier = tierRewardsConfig.getRewards(tierLevel).xpMultiplier();
        if (xpSurgeActive) {
            multiplier *= 1.5;
        }
        if (isInSeasonBook) {
            multiplier *= 1.5;
        }
        int boosted = (int) Math.round(base.earned * multiplier);
        return new ScoreResult(boosted, base.baseScore, base.speedBonus,
                base.comboMultiplierPercent, base.isDailyFirst);
    }

    /**
     * BL-26 (LOCKED 2026-06-22) — new Ranked scoring formula. Replaces the
     * multiplicative {@link #calculateWithTier} chain for the Ranked path.
     *
     * <p>{@code earned = round(core × situational × tierMult × (dailyFirst?2:1))} where:
     * <ul>
     *   <li>{@code core = base + speedBonus}, speedBonus over the REAL question
     *       timer ({@code timeLimitMs}, 90s for Ranked) — fixes the old 30s
     *       window that zeroed the bonus for answers in 30–90s (BL-26 P1).</li>
     *   <li>{@code situational = min(2.0, 1 + comboBonus + surge + season + comeback)}
     *       — additive, capped, so timing (surge/season) no longer overwhelms
     *       skill (BL-26 P4). combo +0.2 (streak≥5) / +0.35 (≥10); surge +0.5;
     *       season +0.3; comeback +0.2 (LD2/LD3).</li>
     *   <li>tier multiplier stays a separate factor (1.0–2.0), the progression
     *       reward (LD2).</li>
     *   <li>dailyFirst ×2 applied last (LD: SPEC §4.4, wired for Ranked — P2).</li>
     * </ul>
     * The session-accuracy bonus (B / LD1) is awarded separately at match end,
     * not here.
     *
     * @param timeLimitMs the actual per-question timer in ms (Ranked passes 90_000)
     */
    public ScoreResult calculateRanked(Question.Difficulty difficulty, int clientElapsedMs,
                                       int timeLimitMs, int currentStreak, boolean isDailyFirst,
                                       int tierLevel, boolean xpSurgeActive, boolean isInSeasonBook,
                                       boolean comebackActive) {
        int base = getBaseScore(difficulty);

        // Speed bonus over the real timer. Clamp elapsed to [0, timeLimitMs] so a
        // forged negative value can't push the ratio above 1 (F-api-5 carry-over).
        int safeLimit = timeLimitMs > 0 ? timeLimitMs : TIME_LIMIT_MS;
        int clampedElapsedMs = Math.max(0, Math.min(clientElapsedMs, safeLimit));
        double speedRatio = (double) (safeLimit - clampedElapsedMs) / safeLimit;
        int speedBonus = (int) Math.floor(base * 0.5 * speedRatio * speedRatio);
        int core = base + speedBonus;

        // Additive situational, capped at 2.0.
        double comboBonus = currentStreak >= 10 ? 0.35 : currentStreak >= 5 ? 0.20 : 0.0;
        double situational = 1.0 + comboBonus
                + (xpSurgeActive ? 0.5 : 0.0)
                + (isInSeasonBook ? 0.3 : 0.0)
                + (comebackActive ? 0.2 : 0.0);
        situational = Math.min(2.0, situational);

        double tierMult = tierRewardsConfig.getRewards(tierLevel).xpMultiplier();

        double earned = core * situational * tierMult;
        if (isDailyFirst) {
            earned *= 2;
        }

        int comboPercent = (int) Math.round((1.0 + comboBonus) * 100);
        return new ScoreResult((int) Math.round(earned), base, speedBonus, comboPercent, isDailyFirst);
    }

    private int getBaseScore(Question.Difficulty difficulty) {
        if (difficulty == null) return 8;
        return switch (difficulty) {
            case easy -> 8;
            case medium -> 12;
            case hard -> 18;
        };
    }

    /**
     * Server-side answer validation for multiple choice single.
     */
    public boolean validateMultipleChoiceSingle(Question question, Object answerObj) {
        if (question == null || question.getCorrectAnswer() == null || question.getCorrectAnswer().isEmpty()) {
            return false;
        }
        int clientAnswer = -1;
        try {
            clientAnswer = Integer.parseInt(answerObj.toString());
        } catch (Exception ignore) {}
        return clientAnswer == question.getCorrectAnswer().get(0);
    }

    /**
     * Server-side answer validation for fill in blank.
     */
    public boolean validateFillInBlank(Question question, Object answerObj) {
        if (question == null) return false;
        String expected = question.getCorrectAnswerText();
        String provided = answerObj != null ? answerObj.toString().trim().toLowerCase() : "";
        return expected != null && provided.equals(expected.trim().toLowerCase());
    }
}
