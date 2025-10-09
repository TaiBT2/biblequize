package com.biblequiz.controller;

import com.biblequiz.entity.Question;
import com.biblequiz.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Questions", description = "Question management endpoints")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @GetMapping("/questions")
    @Operation(summary = "Get random questions", description = "Retrieve random questions with optional filters")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Questions retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Question.class))),
            @ApiResponse(responseCode = "400", description = "Invalid parameters"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public List<Question> getQuestions(
            @Parameter(description = "Filter by book name (e.g., Genesis, Exodus)") 
            @RequestParam(required = false) String book,
            @Parameter(description = "Filter by difficulty level (easy, medium, hard)") 
            @RequestParam(required = false) String difficulty,
            @Parameter(description = "Number of questions to return (default: 10, max: 50)") 
            @RequestParam(required = false, defaultValue = "10") int limit,
            @Parameter(description = "List of question IDs to exclude from results") 
            @RequestParam(required = false, name = "excludeIds") List<String> excludeIds) {
        return questionService.getRandomQuestions(book, difficulty, limit, excludeIds);
    }

    @GetMapping("/questions/qotd")
    @Operation(summary = "Get question of the day", description = "Retrieve the daily question based on current date")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Question of the day retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "No question available for today"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<?> questionOfTheDay(
            @Parameter(description = "Language code (default: vi)") 
            @RequestParam(value = "language", defaultValue = "vi") String language) {
        return ResponseEntity.ok(Map.of(
                "date", LocalDate.now().toString(),
                "question", questionService.getQuestionOfTheDay(language)
        ));
    }
}