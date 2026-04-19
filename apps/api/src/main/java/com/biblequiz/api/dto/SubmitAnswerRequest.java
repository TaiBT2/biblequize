package com.biblequiz.api.dto;

import com.biblequiz.modules.quiz.entity.Answer;
import com.biblequiz.modules.quiz.entity.Question;
import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class SubmitAnswerRequest {

    // sessionId comes from the URL path (@PathVariable in SessionController.answer),
    // not from the request body. Keep the field optional for clients that
    // duplicate it, but drop @NotBlank — the FE (Quiz.tsx) does NOT send it
    // in the body, so requiring it here produced 400 "Session ID is required"
    // on every Practice answer submission.
    @Size(max = 36, message = "Session ID cannot exceed 36 characters")
    private String sessionId;

    @NotBlank(message = "Question ID is required")
    @Size(max = 36, message = "Question ID cannot exceed 36 characters")
    private String questionId;

    @NotNull(message = "Answer is required")
    private Object answer;

    // FE and RankedController both send this field as "clientElapsedMs" to
    // signal "untrusted client time" — SessionService already caps it to
    // 35000ms before scoring. The @JsonAlias lets Jackson accept either the
    // legacy "elapsedMs" or the current "clientElapsedMs" on the wire so
    // non-Ranked /api/sessions/{id}/answer submissions stop 400'ing with
    // UnrecognizedPropertyException (which silently killed Practice XP
    // persistence before anyone saw a service-level log).
    @JsonAlias("clientElapsedMs")
    @Min(value = 0, message = "Elapsed time cannot be negative")
    @Max(value = 300000, message = "Elapsed time cannot exceed 5 minutes")
    private Integer elapsedMs;
    
    private List<String> selectedOptions;
    
    private Boolean isCorrect;
    
    private String explanation;
}
