package com.biblequiz.api;

import com.biblequiz.modules.daily.service.DailyChallengeService;
import com.biblequiz.modules.quiz.entity.Question;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SPEC-v2: Daily Challenge — 5 fixed questions per day.
 * Guests can play (no auth required for GET).
 */
@RestController
@RequestMapping("/api/daily-challenge")
public class DailyChallengeController {

    @Autowired
    private DailyChallengeService dailyChallengeService;

    /**
     * GET /api/daily-challenge — get today's 5 questions.
     * Public endpoint (guests allowed).
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDailyChallenge(
            Authentication authentication,
            @RequestParam(defaultValue = "vi") String language) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Question> questions = dailyChallengeService.getTodayQuestions(language);

        boolean alreadyCompleted = false;
        if (authentication != null) {
            String userId = authentication.getName();
            alreadyCompleted = dailyChallengeService.hasCompletedToday(userId);
        }

        // Strip correct answers from response (client shouldn't see them)
        List<Map<String, Object>> sanitized = questions.stream().map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("book", q.getBook());
            m.put("chapter", q.getChapter());
            m.put("difficulty", q.getDifficulty());
            m.put("type", q.getType());
            m.put("content", q.getContent());
            m.put("options", q.getOptions());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("date", today.toString());
        response.put("questions", sanitized);
        response.put("alreadyCompleted", alreadyCompleted);
        response.put("totalQuestions", dailyChallengeService.getDailyQuestionCount());

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/daily-challenge/start — start a daily challenge session.
     * Returns session ID for tracking answers.
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startChallenge(Authentication authentication) {
        String sessionId = "daily-" + LocalDate.now(ZoneOffset.UTC) + "-" + System.currentTimeMillis();

        Map<String, Object> response = Map.of(
                "sessionId", sessionId,
                "date", LocalDate.now(ZoneOffset.UTC).toString(),
                "totalQuestions", dailyChallengeService.getDailyQuestionCount());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/daily-challenge/result — get results after completion.
     */
    @GetMapping("/result")
    public ResponseEntity<Map<String, Object>> getResult(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Login required to view results"));
        }

        String userId = authentication.getName();
        boolean completed = dailyChallengeService.hasCompletedToday(userId);

        if (!completed) {
            return ResponseEntity.ok(Map.of("completed", false));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("completed", true);
        response.put("date", LocalDate.now(ZoneOffset.UTC).toString());

        return ResponseEntity.ok(response);
    }
}
