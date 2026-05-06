package com.biblequiz.api.dto.basicquiz;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response from POST /api/basic-quiz/submit. Carries the per-question review
 * data the FE renders on both pass and fail screens.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BasicQuizResultResponse {

    private boolean passed;

    private int correctCount;

    private int totalQuestions;

    private int threshold;

    /** Total attempt count after this submission (includes the current attempt). */
    private int attemptCount;

    /** Seconds until the user may retry, populated only when {@code passed=false}. */
    private int cooldownSeconds;

    /** Per-question review entries for ALL submitted questions, in submission order. */
    private List<Review> reviews;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Review {
        private String questionId;
        private String content;
        private List<String> options;
        private List<Integer> selectedOptions;
        private List<Integer> correctOptions;
        private String explanation;
        private boolean correct;
    }
}
