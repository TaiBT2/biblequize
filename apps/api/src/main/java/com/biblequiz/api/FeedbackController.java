package com.biblequiz.api;

import com.biblequiz.modules.feedback.entity.Feedback;
import com.biblequiz.modules.feedback.repository.FeedbackRepository;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
public class FeedbackController {

    private static final Logger log = LoggerFactory.getLogger(FeedbackController.class);

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    private String resolveEmail(Authentication authentication) {
        if (authentication == null) return null;
        try {
            Object principal = authentication.getPrincipal();
            if (principal instanceof OAuth2User oAuth2User) {
                Object emailAttr = oAuth2User.getAttributes().get("email");
                if (emailAttr != null) return emailAttr.toString();
            }
        } catch (Exception ignore) {
        }
        return authentication.getName();
    }

    // ── User: submit feedback ────────────────────────────────────────────────

    @PostMapping("/api/feedback")
    public ResponseEntity<?> submitFeedback(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        String email = resolveEmail(authentication);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        String typeStr = body.get("type");
        String content = body.get("content");
        String questionId = body.get("questionId");

        if (typeStr == null || content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "type and content are required"));
        }

        Feedback.Type type;
        try {
            type = Feedback.Type.valueOf(typeStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid type. Valid: report | question | general"));
        }

        Feedback feedback = new Feedback();
        feedback.setId(UUID.randomUUID().toString());
        feedback.setUser(user);
        feedback.setType(type);
        feedback.setContent(content);
        feedback.setStatus(Feedback.Status.pending);

        if (questionId != null && !questionId.isBlank()) {
            questionRepository.findById(questionId).ifPresent(feedback::setQuestion);
        }

        feedbackRepository.save(feedback);
        log.info("[FEEDBACK] User {} submitted type={}", email, type);
        return ResponseEntity.ok(Map.of("id", feedback.getId(), "status", "pending"));
    }

    // ── Admin: list feedback ─────────────────────────────────────────────────

    @GetMapping("/api/admin/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(value = "status", required = false) String statusStr,
            @RequestParam(value = "type", required = false) String typeStr,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Feedback> result;

        try {
            Feedback.Status status = statusStr != null ? Feedback.Status.valueOf(statusStr) : null;
            Feedback.Type type = typeStr != null ? Feedback.Type.valueOf(typeStr) : null;

            if (status != null && type != null) {
                result = feedbackRepository.findByStatusAndTypeOrderByCreatedAtDesc(status, type, pageable);
            } else if (status != null) {
                result = feedbackRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
            } else if (type != null) {
                result = feedbackRepository.findByTypeOrderByCreatedAtDesc(type, pageable);
            } else {
                result = feedbackRepository.findAll(pageable);
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        List<Map<String, Object>> items = result.getContent().stream()
                .map(this::toMap)
                .collect(Collectors.toList());

        Map<String, Long> stats = new HashMap<>();
        for (Feedback.Status s : Feedback.Status.values()) {
            stats.put(s.name(), feedbackRepository.countByStatus(s));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("total", result.getTotalElements());
        response.put("page", page);
        response.put("totalPages", result.getTotalPages());
        response.put("stats", stats);
        return ResponseEntity.ok(response);
    }

    // ── Admin: update feedback status ────────────────────────────────────────

    @PatchMapping("/api/admin/feedback/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        Feedback feedback = feedbackRepository.findById(id).orElse(null);
        if (feedback == null) return ResponseEntity.notFound().build();

        String statusStr = body.get("status");
        if (statusStr != null) {
            try {
                feedback.setStatus(Feedback.Status.valueOf(statusStr));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status"));
            }
        }

        String note = body.get("note");
        if (note != null && !note.isBlank()) {
            feedback.setContent(feedback.getContent() + "\n\n[Admin note]: " + note);
        }

        if (authentication != null) {
            String email = resolveEmail(authentication);
            userRepository.findByEmail(email).ifPresent(feedback::setHandledBy);
        }

        feedbackRepository.save(feedback);
        log.info("[FEEDBACK] Admin updated id={} status={}", id, feedback.getStatus());
        return ResponseEntity.ok(toMap(feedback));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(Feedback f) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", f.getId());
        m.put("type", f.getType() != null ? f.getType().name() : null);
        m.put("status", f.getStatus() != null ? f.getStatus().name() : null);
        m.put("content", f.getContent());
        m.put("createdAt", f.getCreatedAt() != null ? f.getCreatedAt().toString() : null);
        m.put("updatedAt", f.getUpdatedAt() != null ? f.getUpdatedAt().toString() : null);

        if (f.getUser() != null) {
            m.put("userId", f.getUser().getId());
            m.put("userName", f.getUser().getName());
            m.put("userEmail", f.getUser().getEmail());
        }
        if (f.getQuestion() != null) {
            Map<String, Object> q = new HashMap<>();
            q.put("id", f.getQuestion().getId());
            q.put("content", f.getQuestion().getContent());
            q.put("book", f.getQuestion().getBook());
            m.put("question", q);
        }
        if (f.getHandledBy() != null) {
            m.put("handledBy", f.getHandledBy().getName());
        }
        return m;
    }
}
