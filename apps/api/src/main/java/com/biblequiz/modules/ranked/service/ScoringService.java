package com.biblequiz.modules.ranked.service;

import com.biblequiz.modules.quiz.entity.Question;
import org.springframework.stereotype.Service;

@Service
public class ScoringService {

    private static final int TIME_LIMIT_SEC = 30;
    private static final int PERFECT_BONUS_THRESHOLD = 15; // seconds remaining
    private static final int PERFECT_BONUS_POINTS = 5;
    private static final int STREAK_START = 3;
    private static final int STREAK_BONUS_PER_LEVEL = 10;

    public static class ScoreResult {
        public final int earned;
        public final int baseScore;
        public final int timeBonus;
        public final int streakBonus;
        public final int perfectBonus;

        public ScoreResult(int earned, int baseScore, int timeBonus, int streakBonus, int perfectBonus) {
            this.earned = earned;
            this.baseScore = baseScore;
            this.timeBonus = timeBonus;
            this.streakBonus = streakBonus;
            this.perfectBonus = perfectBonus;
        }
    }

    /**
     * Calculates score for a correct answer.
     *
     * @param difficulty     question difficulty (may be null for default/easy)
     * @param clientElapsedMs time the user spent answering in milliseconds
     * @param currentStreak  streak AFTER incrementing (i.e., already includes this answer)
     * @return ScoreResult with breakdown
     */
    public ScoreResult calculate(Question.Difficulty difficulty, int clientElapsedMs, int currentStreak) {
        int timeLeft = Math.max(0, TIME_LIMIT_SEC - (clientElapsedMs / 1000));

        // Base score includes difficulty — no separate multiplier
        int baseScore = 10; // easy
        if (difficulty == Question.Difficulty.medium) {
            baseScore = 25;
        } else if (difficulty == Question.Difficulty.hard) {
            baseScore = 50;
        }

        int timeBonus = timeLeft / 2;
        int perfectBonus = (timeLeft >= PERFECT_BONUS_THRESHOLD) ? PERFECT_BONUS_POINTS : 0;

        // Linear streak bonus: +10 per streak starting from streak 3
        int streakBonus = 0;
        if (currentStreak >= STREAK_START) {
            streakBonus = (currentStreak - (STREAK_START - 1)) * STREAK_BONUS_PER_LEVEL;
        }

        int earned = baseScore + timeBonus + perfectBonus + streakBonus;
        return new ScoreResult(earned, baseScore, timeBonus, streakBonus, perfectBonus);
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
