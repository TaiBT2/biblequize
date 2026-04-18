package com.biblequiz.api;

import com.biblequiz.api.dto.CreateSessionRequest;
import com.biblequiz.api.dto.SubmitAnswerRequest;
import com.biblequiz.modules.quiz.entity.Answer;
import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.service.SessionService;

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
@RequestMapping("/api/sessions")
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

        QuizSession.Mode mode;
        try {
            mode = QuizSession.Mode.valueOf(request.getMode().toLowerCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid mode: " + request.getMode()));
        }

        Map<String, Object> config = new java.util.HashMap<>();
        config.put("questionCount", request.getQuestionCount() != null ? request.getQuestionCount() : 10);
        config.put("book", request.getBook() != null ? request.getBook() : "");
        config.put("difficulty", request.getDifficulty() != null ? request.getDifficulty() : "all");
        config.put("timePerQuestion", request.getTimePerQuestion() != null ? request.getTimePerQuestion() : 30);
        config.put("excludeQuestionIds",
                request.getExcludeQuestionIds() != null ? request.getExcludeQuestionIds() : java.util.List.of());
        config.put("shuffleQuestions", request.getShuffleQuestions() != null ? request.getShuffleQuestions() : true);
        config.put("showExplanation", request.getShowExplanation() != null ? request.getShowExplanation() : true);
        config.put("language", request.getLanguage() != null ? request.getLanguage() : "vi");

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
                request.getElapsedMs()));
    }

    @PostMapping("/{id}/retry")
    @Operation(summary = "Retry session", description = "Create a new session with the same config as the original")
    public ResponseEntity<?> retry(@PathVariable("id") String sessionId, Principal principal) {
        String userId = principal != null ? principal.getName() : null;
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            return ResponseEntity.status(201).body(sessionService.retrySession(sessionId, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
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
