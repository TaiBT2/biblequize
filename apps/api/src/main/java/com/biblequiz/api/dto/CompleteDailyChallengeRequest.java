package com.biblequiz.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for {@code POST /api/daily-challenge/complete}.
 *
 * <p>Called by the client after the user finishes all 5 daily challenge
 * questions. Server records completion via
 * {@link com.biblequiz.modules.daily.service.DailyChallengeService#markCompleted}
 * so subsequent GET /api/daily-challenge calls return {@code alreadyCompleted: true}.
 *
 * <p>Server does not re-validate answers here — the client has already scored
 * locally against the sanitized question payload. This endpoint is purely for
 * completion tracking. Correctness is enforced by the 5-fixed-questions
 * design: everyone sees the same questions, so score/correctCount are
 * bounded by the question set.
 */
@JsonIgnoreProperties(ignoreUnknown = false)
public class CompleteDailyChallengeRequest {

    @NotNull
    @Min(0)
    @Max(10_000)
    private Integer score;

    /** Number of correct answers — max is {@code DAILY_QUESTION_COUNT=5}. */
    @NotNull
    @Min(0)
    @Max(5)
    private Integer correctCount;

    public CompleteDailyChallengeRequest() {}

    public CompleteDailyChallengeRequest(Integer score, Integer correctCount) {
        this.score = score;
        this.correctCount = correctCount;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(Integer correctCount) {
        this.correctCount = correctCount;
    }
}
