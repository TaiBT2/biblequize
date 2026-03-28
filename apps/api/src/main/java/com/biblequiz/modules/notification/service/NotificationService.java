package com.biblequiz.modules.notification.service;

import com.biblequiz.modules.notification.entity.Notification;
import com.biblequiz.modules.notification.repository.NotificationRepository;
import com.biblequiz.modules.user.entity.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification createNotification(User user, String type, String title, String body, String metadata) {
        Notification notification = new Notification(
                UUID.randomUUID().toString(), user, type, title, body);
        if (metadata != null) {
            notification.setMetadata(metadata);
        }
        notificationRepository.save(notification);
        log.info("Notification created: type={}, user={}, title={}", type, user.getEmail(), title);
        return notification;
    }

    public void createTierUpNotification(User user, String tierName, String tierKey) {
        String title = "Chúc mừng lên tier!";
        String body = "Bạn đã đạt tier " + tierName + " 📖";
        String metadata = "{\"tierKey\":\"" + tierKey + "\",\"tierName\":\"" + tierName + "\"}";
        createNotification(user, "tier_up", title, body, metadata);
    }

    public void createStreakWarning(User user, int currentStreak) {
        String title = "Streak sắp gãy!";
        String body = "Streak " + currentStreak + " ngày của bạn sắp gãy — hãy chơi hôm nay để giữ streak! 🔥";
        createNotification(user, "streak_warning", title, body, null);
    }

    public void createDailyReminder(User user) {
        String title = "Câu hỏi mới mỗi ngày";
        String body = "Daily Challenge hôm nay đã sẵn sàng — 5 câu hỏi đang chờ bạn! 📝";
        createNotification(user, "daily_reminder", title, body, null);
    }

    public List<Map<String, Object>> getNotifications(String userId, boolean unreadOnly, int limit) {
        List<Notification> notifications;
        if (unreadOnly) {
            notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        } else {
            notifications = notificationRepository.findByUserIdPaginated(userId, PageRequest.of(0, limit));
        }
        return notifications.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public boolean markAsRead(String notificationId, String userId) {
        Optional<Notification> opt = notificationRepository.findById(notificationId);
        if (opt.isEmpty()) return false;

        Notification notification = opt.get();
        if (!notification.getUser().getId().equals(userId)) return false;

        notification.setIsRead(true);
        notificationRepository.save(notification);
        return true;
    }

    @Transactional
    public int markAllAsRead(String userId) {
        return notificationRepository.markAllAsRead(userId);
    }

    private Map<String, Object> toDTO(Notification n) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", n.getId());
        dto.put("type", n.getType());
        dto.put("title", n.getTitle());
        dto.put("body", n.getBody());
        dto.put("isRead", n.getIsRead());
        dto.put("metadata", n.getMetadata());
        dto.put("createdAt", n.getCreatedAt());
        return dto;
    }
}
