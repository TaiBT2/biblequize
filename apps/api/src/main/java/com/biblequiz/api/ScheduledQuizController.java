package com.biblequiz.api;

import com.biblequiz.modules.group.service.ScheduledQuizService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Feature B — REST endpoints for scheduled (async) group quizzes.
 */
@RestController
@RequestMapping("/api/groups/{groupId}/scheduled-quizzes")
public class ScheduledQuizController {

    @Autowired private ScheduledQuizService service;
    @Autowired private UserRepository userRepository;

    /** Create a new scheduled quiz. LEADER/MOD only. */
    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> create(@PathVariable String groupId,
                                    @RequestBody Map<String, Object> body,
                                    Principal principal) {
        try {
            User user = getUser(principal);
            String quizSetId = (String) body.get("quizSetId");
            String name = (String) body.get("name");
            String description = (String) body.get("description");
            String deadlineStr = (String) body.get("deadline");
            Integer maxAttempts = body.get("maxAttempts") instanceof Number n ? n.intValue() : null;
            Boolean isPublic = body.get("isLeaderboardPublic") instanceof Boolean b ? b : null;
            Boolean sendNoti = body.get("sendNotifications") instanceof Boolean b ? b : null;

            if (deadlineStr == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Thieu deadline"));
            }
            LocalDateTime deadline = LocalDateTime.parse(deadlineStr);

            Map<String, Object> result = service.create(groupId, user.getId(),
                    quizSetId, name, description, deadline, maxAttempts, isPublic, sendNoti);
            return ResponseEntity.ok(Map.of("success", true, "scheduledQuiz", result));
        } catch (IllegalStateException e) {
            // PN-3 safety net + deadline-passed
            String code = ScheduledQuizService.ERR_MAX_ACTIVE.equals(e.getMessage())
                    ? ScheduledQuizService.ERR_MAX_ACTIVE : "INVALID_STATE";
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage(), "code", code));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** List scheduled quizzes for a group. Optional ?status=ACTIVE|ENDED filter. */
    @GetMapping
    public ResponseEntity<?> list(@PathVariable String groupId,
                                   @RequestParam(required = false) String status) {
        try {
            List<Map<String, Object>> quizzes = service.list(groupId, status);
            return ResponseEntity.ok(Map.of("success", true, "scheduledQuizzes", quizzes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Detail with the viewer's own attempt summary. */
    @GetMapping("/{quizId}")
    public ResponseEntity<?> getDetail(@PathVariable String groupId, @PathVariable String quizId,
                                        Principal principal) {
        try {
            User user = getUser(principal);
            Map<String, Object> result = service.getDetail(quizId, user.getId());
            return ResponseEntity.ok(Map.of("success", true, "scheduledQuiz", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Start a new attempt — returns ordered questions for the FE to render. */
    @PostMapping("/{quizId}/start")
    public ResponseEntity<?> startAttempt(@PathVariable String groupId, @PathVariable String quizId,
                                          Principal principal) {
        try {
            User user = getUser(principal);
            Map<String, Object> result = service.startAttempt(quizId, user.getId());
            return ResponseEntity.ok(Map.of("success", true, "attempt", result));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Submit completed attempt. Body: {answers: [{questionId, answerIndex}], timeSeconds}. */
    @PostMapping("/{quizId}/submit")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> submitAttempt(@PathVariable String groupId, @PathVariable String quizId,
                                           @RequestBody Map<String, Object> body,
                                           Principal principal) {
        try {
            User user = getUser(principal);
            List<Map<String, Object>> answers = (List<Map<String, Object>>) body.get("answers");
            Integer timeSeconds = body.get("timeSeconds") instanceof Number n ? n.intValue() : null;
            Map<String, Object> result = service.submitAttempt(quizId, user.getId(), answers, timeSeconds);
            return ResponseEntity.ok(Map.of("success", true, "result", result));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Live (or frozen, after end) leaderboard for this quiz. */
    @GetMapping("/{quizId}/leaderboard")
    public ResponseEntity<?> getLeaderboard(@PathVariable String groupId, @PathVariable String quizId,
                                             Principal principal) {
        try {
            User user = getUser(principal);
            List<Map<String, Object>> lb = service.getLeaderboard(quizId, user.getId());
            return ResponseEntity.ok(Map.of("success", true, "leaderboard", lb));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Cancel an active scheduled quiz. LEADER/MOD only. */
    @DeleteMapping("/{quizId}")
    public ResponseEntity<?> cancel(@PathVariable String groupId, @PathVariable String quizId,
                                     Principal principal) {
        try {
            User user = getUser(principal);
            service.cancel(quizId, user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private User getUser(Principal principal) {
        if (principal == null) throw new RuntimeException("Chua dang nhap");
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof OAuth2User oauth2User) {
            String email = oauth2User.getAttribute("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Nguoi dung khong ton tai"));
            }
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Nguoi dung khong ton tai"));
    }
}
