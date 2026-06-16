package com.biblequiz.modules.quiz.service;

import java.util.List;

/**
 * QQA-2: lightweight content-quality heuristics for MCQ questions.
 *
 * <p>Currently detects the classic "length tell" — a correct option that is both
 * the longest AND substantially longer than the average distractor, which lets a
 * test-wise player score high by always picking the longest answer. A 2026-06-16
 * seed audit found 80% of MCQ questions exhibited this. Used as a non-blocking
 * warning at import time.
 */
public final class QuestionQualityChecker {

    private QuestionQualityChecker() {}

    /** Correct-vs-average-distractor length ratio at/above which we flag. */
    public static final double LENGTH_BIAS_RATIO = 1.5;

    /** @param ratio correctLen / avgDistractorLen (0 when not computable). */
    public record LengthBias(boolean biased, boolean correctIsLongest, double ratio) {}

    /**
     * Flags the giveaway where the correct option is the longest AND ≥
     * {@link #LENGTH_BIAS_RATIO}× the average distractor length. Non-MCQ or
     * degenerate inputs (no options, missing/out-of-range correct index, no
     * distractors) return not-biased.
     */
    public static LengthBias lengthBias(List<String> options, List<Integer> correctAnswer) {
        if (options == null || options.size() < 2 || correctAnswer == null || correctAnswer.isEmpty()) {
            return new LengthBias(false, false, 0);
        }
        Integer first = correctAnswer.get(0);
        int correctIdx = first != null ? first : -1;
        if (correctIdx < 0 || correctIdx >= options.size()) {
            return new LengthBias(false, false, 0);
        }

        int correctLen = len(options.get(correctIdx));
        int maxLen = 0;
        long distractorSum = 0;
        int distractorCount = 0;
        for (int i = 0; i < options.size(); i++) {
            int l = len(options.get(i));
            if (l > maxLen) maxLen = l;
            if (i != correctIdx) {
                distractorSum += l;
                distractorCount++;
            }
        }

        boolean correctIsLongest = correctLen > 0 && correctLen >= maxLen;
        double avgDistractor = distractorCount > 0 ? (double) distractorSum / distractorCount : 0;
        double ratio = avgDistractor > 0 ? correctLen / avgDistractor : 0;
        boolean biased = correctIsLongest && ratio >= LENGTH_BIAS_RATIO;
        return new LengthBias(biased, correctIsLongest, Math.round(ratio * 100) / 100.0);
    }

    private static int len(String s) {
        return s == null ? 0 : s.trim().length();
    }
}
