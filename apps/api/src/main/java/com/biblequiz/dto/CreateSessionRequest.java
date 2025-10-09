package com.biblequiz.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class CreateSessionRequest {
    
    @NotNull(message = "Mode is required")
    private String mode;
    
    @Min(value = 1, message = "Question count must be at least 1")
    @Max(value = 50, message = "Question count cannot exceed 50")
    private Integer questionCount = 10;
    
    @Size(max = 100, message = "Book name cannot exceed 100 characters")
    private String book;
    
    @Pattern(regexp = "^(easy|medium|hard|all)$", message = "Difficulty must be easy, medium, hard, or all")
    private String difficulty = "all";
    
    @Pattern(regexp = "^(single|practice|ranked)$", message = "Mode must be single, practice, or ranked")
    private String sessionMode;
    
    @Min(value = 30, message = "Time per question must be at least 30 seconds")
    @Max(value = 300, message = "Time per question cannot exceed 300 seconds")
    private Integer timePerQuestion = 30;
    
    private List<String> excludeQuestionIds;
    
    private Boolean shuffleQuestions = true;
    
    private Boolean showExplanation = true;
}
