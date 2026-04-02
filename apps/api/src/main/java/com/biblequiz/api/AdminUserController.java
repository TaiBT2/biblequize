package com.biblequiz.api;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean banned) {

        Page<User> users = userRepository.findAll(
                PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt")));

        var items = users.getContent().stream()
                .filter(u -> role == null || role.isEmpty() || u.getRole().equalsIgnoreCase(role))
                .filter(u -> search == null || search.isEmpty() ||
                        u.getName().toLowerCase().contains(search.toLowerCase()) ||
                        u.getEmail().toLowerCase().contains(search.toLowerCase()))
                .filter(u -> banned == null || Boolean.TRUE.equals(u.getIsBanned()) == banned)
                .map(this::toUserDTO)
                .toList();

        return ResponseEntity.ok(Map.of(
                "items", items,
                "total", users.getTotalElements(),
                "page", page,
                "totalPages", users.getTotalPages()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toUserDTO(opt.get()));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable String id, @RequestBody Map<String, String> body,
            Authentication auth) {
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User user = opt.get();

        // Cannot change own role
        String adminEmail = auth.getName();
        if (user.getEmail().equals(adminEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot change your own role"));
        }

        try {
            user.setRole(newRole.toUpperCase());
            userRepository.save(user);
            log.info("[ADMIN] Role changed: user={} newRole={} by={}", id, newRole, adminEmail);
            return ResponseEntity.ok(Map.of("id", id, "role", user.getRole()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + newRole));
        }
    }

    @PatchMapping("/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable String id, @RequestBody Map<String, Object> body,
            Authentication auth) {
        boolean banned = Boolean.TRUE.equals(body.get("banned"));
        String reason = (String) body.get("reason");

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User user = opt.get();

        // Cannot ban self
        String adminEmail = auth.getName();
        if (user.getEmail().equals(adminEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot ban yourself"));
        }

        if (banned && (reason == null || reason.trim().length() < 10)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ban reason must be at least 10 characters"));
        }

        user.setIsBanned(banned);
        user.setBanReason(banned ? reason.trim() : null);
        user.setBannedAt(banned ? LocalDateTime.now() : null);
        userRepository.save(user);

        log.info("[ADMIN] User {} {} by={} reason={}", id, banned ? "BANNED" : "UNBANNED", adminEmail, reason);
        return ResponseEntity.ok(Map.of("id", id, "banned", banned));
    }

    private Map<String, Object> toUserDTO(User u) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", u.getId());
        dto.put("name", u.getName());
        dto.put("email", u.getEmail());
        dto.put("avatarUrl", u.getAvatarUrl());
        dto.put("role", u.getRole());
        dto.put("currentStreak", u.getCurrentStreak());
        dto.put("longestStreak", u.getLongestStreak());
        dto.put("lastPlayedAt", u.getLastPlayedAt());
        dto.put("createdAt", u.getCreatedAt());
        dto.put("isBanned", Boolean.TRUE.equals(u.getIsBanned()));
        dto.put("banReason", u.getBanReason());
        dto.put("bannedAt", u.getBannedAt());
        return dto;
    }
}
