package com.biblequiz.modules.quiz.service;

/**
 * Threshold policy for the "early Ranked unlock" path.
 *
 * <p>A Tier-1 user who demonstrates {@value #MIN_ACCURACY_PCT}% accuracy
 * or better over {@value #MIN_QUESTIONS}+ Practice answers bypasses the
 * 1,000 XP Ranked gate. The flag is permanent once set.
 *
 * <p>Extracted as a pure policy class for two reasons:
 * <ul>
 *   <li>Testability — the rule has edge cases (floor vs ceil of
 *       percentage, integer division traps) that deserve unit tests
 *       without having to stand up the full SessionService.</li>
 *   <li>Tunability — product may want to adjust these thresholds later;
 *       single source of truth avoids drift between the gate check and
 *       the progress check.</li>
 * </ul>
 *
 * @see com.biblequiz.modules.quiz.service.SessionService#submitAnswer
 */
public final class EarlyRankedUnlockPolicy {

    /** Minimum total Practice answers required before the unlock can fire. */
    public static final int MIN_QUESTIONS = 10;

    /** Minimum accuracy percentage (0–100). Uses integer comparison to avoid
     *  floating-point quirks; see {@link #shouldUnlock}. */
    public static final int MIN_ACCURACY_PCT = 80;

    private EarlyRankedUnlockPolicy() {}

    /**
     * Decide whether the user qualifies for early Ranked unlock given
     * their cumulative Practice counts.
     *
     * @param correct number of correct Practice answers (≥ 0)
     * @param total   total Practice answers (≥ correct)
     * @return {@code true} iff both thresholds met
     */
    public static boolean shouldUnlock(int correct, int total) {
        if (total < MIN_QUESTIONS) return false;
        if (correct < 0 || correct > total) return false;
        // Avoid double arithmetic: (correct / total) >= 0.80
        // ⇔ correct * 100 >= total * MIN_ACCURACY_PCT (both sides integer).
        return (long) correct * 100 >= (long) total * MIN_ACCURACY_PCT;
    }
}
