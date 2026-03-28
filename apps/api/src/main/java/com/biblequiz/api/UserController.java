package com.biblequiz.api;

import com.biblequiz.api.dto.PromoteAdminRequest;
import com.biblequiz.api.dto.UserResponse;
import com.biblequiz.infrastructure.audit.AuditEventStatus;
import com.biblequiz.infrastructure.audit.AuditService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.repository.QuizSessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/me", "/api/me"})
@CrossOrigin(origins = "*")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuditService auditService;

    @Autowired
    private QuizSessionRepository quizSessionRepository;

    @GetMapping
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.warn("Unauthenticated request to /api/me");
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = null;
        if (authentication.getPrincipal() instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            userEmail = userDetails.getUsername();
            logger.info("GET /api/me called by JWT user: {}", userEmail);
        } else if (authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            userEmail = oauth2User.getAttribute("email");
            logger.info("GET /api/me called by OAuth2 user: {}", userEmail);
        } else {
            logger.warn("Unknown authentication principal type: {}", authentication.getPrincipal().getClass().getName());
            return ResponseEntity.status(401).build();
        }

        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            logger.warn("User not found in database: {}", userEmail);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        logger.info("User profile retrieved: {} ({})", user.getName(), user.getRole());
        return ResponseEntity.ok(new UserResponse(user));
    }

    @PatchMapping
    public ResponseEntity<Map<String, Object>> updateCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> updates) {
        
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of(
                "code", "UNAUTHORIZED",
                "message", "User not authenticated"
            ));
        }

        Optional<User> userOpt = userRepository.findByEmail(userDetails.getUsername());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        
        // Update allowed fields
        if (updates.containsKey("name")) {
            user.setName(updates.get("name"));
        }
        if (updates.containsKey("avatarUrl")) {
            user.setAvatarUrl(updates.get("avatarUrl"));
        }

        user = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("avatarUrl", user.getAvatarUrl());
        response.put("role", user.getRole());
        response.put("updatedAt", user.getUpdatedAt());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/promote-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> promoteToAdmin(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PromoteAdminRequest request,
            HttpServletRequest httpRequest) {

        logger.info("Admin promotion request by {} for user: {}", userDetails.getUsername(), request.getEmail());
        
        try {
            Optional<User> targetUserOpt = userRepository.findByEmail(request.getEmail());
            if (targetUserOpt.isEmpty()) {
                logger.warn("User not found for promotion: {}", request.getEmail());
                auditService.logAdminAction(
                    "PROMOTE_ADMIN_FAILED", 
                    "USER", 
                    "User not found: " + request.getEmail(),
                    httpRequest, 
                    AuditEventStatus.FAILURE
                );
                return ResponseEntity.notFound().build();
            }

            User targetUser = targetUserOpt.get();
            if ("ADMIN".equals(targetUser.getRole())) {
                logger.info("User {} is already admin", request.getEmail());
                auditService.logAdminAction(
                    "PROMOTE_ADMIN_ALREADY_ADMIN", 
                    "USER", 
                    "User already admin: " + request.getEmail(),
                    httpRequest, 
                    AuditEventStatus.SUCCESS
                );
                return ResponseEntity.ok(Map.of(
                    "code", "SUCCESS",
                    "message", "User is already admin",
                    "user", new UserResponse(targetUser)
                ));
            }
            
            String oldRole = targetUser.getRole();
            targetUser.setRole("ADMIN");
            userRepository.save(targetUser);
            
            auditService.logAdminAction(
                "PROMOTE_ADMIN_SUCCESS", 
                "USER", 
                String.format("Promoted user %s from %s to ADMIN", request.getEmail(), oldRole),
                httpRequest, 
                AuditEventStatus.SUCCESS
            );
            
            logger.info("User {} promoted to admin by {}", request.getEmail(), userDetails.getUsername());

            return ResponseEntity.ok(Map.of(
                "code", "SUCCESS",
                "message", "User promoted to admin successfully",
                "user", new UserResponse(targetUser)
            ));
            
        } catch (Exception e) {
            logger.error("Error promoting user to admin: {}", e.getMessage(), e);
            auditService.logAdminAction(
                "PROMOTE_ADMIN_ERROR", 
                "USER", 
                "Error promoting user: " + e.getMessage(),
                httpRequest, 
                AuditEventStatus.FAILURE
            );
            return ResponseEntity.status(500).body(Map.of(
                "code", "ERROR",
                "message", "Internal server error"
            ));
        }
    }

    @PostMapping("/bootstrap-admin")
    public ResponseEntity<Map<String, Object>> bootstrapAdmin(
            @RequestBody Map<String, String> request) {
        
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "code", "BAD_REQUEST",
                "message", "Email is required"
            ));
        }

        // Check if any admin already exists
        List<User> existingAdmins = userRepository.findAll().stream()
            .filter(user -> "ADMIN".equals(user.getRole()))
            .toList();
        
        if (!existingAdmins.isEmpty()) {
            return ResponseEntity.status(409).body(Map.of(
                "code", "CONFLICT",
                "message", "Admin users already exist. Use /promote-admin endpoint instead."
            ));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "code", "NOT_FOUND",
                "message", "User not found with email: " + email
            ));
        }

        User user = userOpt.get();
        user.setRole("ADMIN");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "code", "SUCCESS",
            "message", "First admin user created successfully",
            "user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
            )
        ));
    }

    /**
     * GET /api/me/history — Session history (newest first, paginated)
     */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication authentication,
                                        @RequestParam(defaultValue = "20") int limit,
                                        @RequestParam(defaultValue = "0") int page) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = null;
        if (authentication.getPrincipal() instanceof UserDetails ud) {
            email = ud.getUsername();
        } else if (authentication.getPrincipal() instanceof OAuth2User oauth2) {
            email = oauth2.getAttribute("email");
        }

        Optional<User> userOpt = email != null ? userRepository.findByEmail(email) : Optional.empty();
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        Page<QuizSession> sessions = quizSessionRepository.findByOwnerIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(page, limit));

        List<Map<String, Object>> items = sessions.getContent().stream().map(s -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("mode", s.getMode().name());
            item.put("status", s.getStatus().name());
            item.put("score", s.getScore());
            item.put("totalQuestions", s.getTotalQuestions());
            item.put("correctAnswers", s.getCorrectAnswers());
            item.put("createdAt", s.getCreatedAt());
            return item;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "items", items,
                "totalPages", sessions.getTotalPages(),
                "totalItems", sessions.getTotalElements(),
                "currentPage", page,
                "hasMore", sessions.hasNext()
        ));
    }
}
