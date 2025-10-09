package com.biblequiz.controller;

import com.biblequiz.dto.CreateSessionRequest;
import com.biblequiz.dto.SubmitAnswerRequest;
import com.biblequiz.entity.QuizSession;
import com.biblequiz.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/sessions")
@Tag(name = "Sessions", description = "Quiz session management endpoints")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    @Operation(summary = "Create a new quiz session", description = "Create a new quiz session with specified configuration")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Session created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<?> create(@Valid @RequestBody CreateSessionRequest request, Principal principal) {
        String userId = principal != null ? principal.getName() : null;
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        QuizSession.Mode mode = QuizSession.Mode.valueOf(request.getMode().toUpperCase());
        Map<String, Object> config = Map.of(
                "questionCount", request.getQuestionCount(),
                "book", request.getBook() != null ? request.getBook() : "",
                "difficulty", request.getDifficulty(),
                "timePerQuestion", request.getTimePerQuestion(),
                "excludeQuestionIds", request.getExcludeQuestionIds() != null ? request.getExcludeQuestionIds() : "",
                "shuffleQuestions", request.getShuffleQuestions(),
                "showExplanation", request.getShowExplanation()
        );
        
        return ResponseEntity.ok(sessionService.createSession(userId, mode, config));
    }

    @PostMapping("/{id}/answer")
    @Operation(summary = "Submit an answer", description = "Submit an answer for a specific question in a session")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Answer submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid answer data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Session or question not found")
    })
    public ResponseEntity<?> answer(@Parameter(description = "Session ID") @PathVariable("id") String sessionId,
                                    @Valid @RequestBody SubmitAnswerRequest request,
                                    Principal principal) {
        String userId = principal != null ? principal.getName() : null;
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        return ResponseEntity.ok(sessionService.submitAnswer(
                sessionId, 
                userId, 
                request.getQuestionId(), 
                request.getAnswer(), 
                request.getElapsedMs()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") String sessionId) {
        return ResponseEntity.ok(sessionService.getSession(sessionId));
    }

    @GetMapping("/{id}/review")
    public ResponseEntity<?> review(@PathVariable("id") String sessionId) {
        return ResponseEntity.ok(sessionService.getReview(sessionId));
    }
}


