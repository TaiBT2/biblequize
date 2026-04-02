package com.biblequiz.infrastructure.seed;

import com.biblequiz.modules.notification.entity.Notification;
import com.biblequiz.modules.notification.repository.NotificationRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Profile("!prod")
public class NotificationSeeder {

    private static final Logger log = LoggerFactory.getLogger(NotificationSeeder.class);
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;

    private static final String[][] TEMPLATES = {
            {"tier_up", "Chúc mừng!", "Bạn đã đạt danh hiệu Môn Đồ!"},
            {"streak_warning", "Streak sắp gãy!", "Còn 2 giờ để duy trì streak"},
            {"daily_reminder", "Thử thách hàng ngày", "Daily Challenge hôm nay chờ bạn"},
            {"group_invite", "Lời mời nhóm", "Nhóm Thanh Niên mời bạn tham gia"},
            {"achievement", "Huy hiệu mới!", "Bạn đã mở khóa Học Giả"},
    };

    public int seed() {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().endsWith("@biblequiz.test"))
                .filter(u -> "USER".equalsIgnoreCase(u.getRole()))
                .limit(10)
                .toList();
        if (users.isEmpty()) return 0;

        // Check if already seeded (simple heuristic)
        if (notificationRepository.count() > 20) {
            log.info("NotificationSeeder: notifications exist, skipping");
            return 0;
        }

        int count = 0;
        for (User user : users) {
            int numNotifs = ThreadLocalRandom.current().nextInt(3, 8);
            for (int i = 0; i < numNotifs; i++) {
                String[] tpl = TEMPLATES[ThreadLocalRandom.current().nextInt(TEMPLATES.length)];
                Notification n = new Notification();
                n.setId(UUID.randomUUID().toString());
                n.setUser(user);
                n.setType(tpl[0]);
                n.setTitle(tpl[1]);
                n.setBody(tpl[2]);
                n.setIsRead(ThreadLocalRandom.current().nextBoolean());
                n.setCreatedAt(UserSeeder.randomRecent(14));
                notificationRepository.save(n);
                count++;
            }
        }

        log.info("NotificationSeeder: created {} notifications", count);
        return count;
    }

    public void clear() {
        notificationRepository.deleteAll();
        log.info("NotificationSeeder: cleared");
    }
}
