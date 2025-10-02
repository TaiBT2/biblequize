package com.biblequiz.controller;

import com.biblequiz.entity.QuizSession;
import com.biblequiz.service.SessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Principal principal) {
        String userId = principal != null ? principal.getName() : (String) body.get("userId");
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String modeStr = (String) body.getOrDefault("mode", "practice");
        QuizSession.Mode mode = QuizSession.Mode.valueOf(modeStr);
        Object cfg = body.get("config");
        Map<String, Object> config = cfg instanceof Map ? (Map<String, Object>) cfg : Map.of();
        return ResponseEntity.ok(sessionService.createSession(userId, mode, config));
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<?> answer(@PathVariable("id") String sessionId,
                                    @RequestBody Map<String, Object> body,
                                    Principal principal) {
        String userId = principal != null ? principal.getName() : (String) body.get("userId");
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String questionId = (String) body.get("questionId");
        Object answer = body.get("answer");
        int elapsed = ((Number) body.getOrDefault("clientElapsedMs", 0)).intValue();
        return ResponseEntity.ok(sessionService.submitAnswer(sessionId, userId, questionId, answer, elapsed));
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


