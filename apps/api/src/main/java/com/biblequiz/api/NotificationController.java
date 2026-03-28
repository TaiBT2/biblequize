package com.biblequiz.api;

import com.biblequiz.modules.notification.service.NotificationService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            Principal principal,
            @RequestParam(defaultValue = "false") boolean unread,
            @RequestParam(defaultValue = "20") int limit) {
        User user = getUser(principal);
        List<Map<String, Object>> notifications = notificationService.getNotifications(user.getId(), unread, limit);
        long unreadCount = notificationService.getUnreadCount(user.getId());

        return ResponseEntity.ok(Map.of(
                "notifications", notifications,
                "unreadCount", unreadCount
        ));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, Principal principal) {
        User user = getUser(principal);
        boolean success = notificationService.markAsRead(id, user.getId());
        if (!success) {
            return ResponseEntity.status(404).body(Map.of("error", "Notification not found"));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Principal principal) {
        User user = getUser(principal);
        int count = notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of("success", true, "markedCount", count));
    }

    private User getUser(Principal principal) {
        if (principal == null) throw new RuntimeException("Chưa đăng nhập");
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof OAuth2User oauth2User) {
            String email = oauth2User.getAttribute("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
            }
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
    }
}
