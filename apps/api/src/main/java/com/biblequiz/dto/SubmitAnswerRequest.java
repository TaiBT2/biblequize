package com.biblequiz.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class SubmitAnswerRequest {
    
    @NotBlank(message = "Session ID is required")
    @Size(max = 36, message = "Session ID cannot exceed 36 characters")
    private String sessionId;
    
    @NotBlank(message = "Question ID is required")
    @Size(max = 36, message = "Question ID cannot exceed 36 characters")
    private String questionId;
    
    @NotNull(message = "Answer is required")
    private Object answer;
    
    @Min(value = 0, message = "Elapsed time cannot be negative")
    @Max(value = 300000, message = "Elapsed time cannot exceed 5 minutes")
    private Integer elapsedMs;
    
    private List<String> selectedOptions;
    
    private Boolean isCorrect;
    
    private String explanation;
}
