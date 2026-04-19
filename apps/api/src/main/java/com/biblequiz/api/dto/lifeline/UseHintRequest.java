package com.biblequiz.api.dto.lifeline;

import jakarta.validation.constraints.NotBlank;

/** Request body for {@code POST /api/sessions/{sessionId}/lifeline/hint}. */
public class UseHintRequest {

    @NotBlank
    private String questionId;

    public UseHintRequest() {}

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
}
