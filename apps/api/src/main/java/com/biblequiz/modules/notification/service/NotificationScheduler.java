package com.biblequiz.modules.notification.service;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Scheduled(cron = "0 0 * * * *")
    public void checkStreakWarnings() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        List<User> atRiskUsers = userRepository.findUsersWithStreakAtRisk(todayStart);

        log.info("Streak warning check: {} users at risk", atRiskUsers.size());
        for (User user : atRiskUsers) {
            notificationService.createStreakWarning(user, user.getCurrentStreak());
        }
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyReminders() {
        List<User> allUsers = userRepository.findAll();

        log.info("Daily reminder: sending to {} users", allUsers.size());
        for (User user : allUsers) {
            notificationService.createDailyReminder(user);
        }
    }
}
