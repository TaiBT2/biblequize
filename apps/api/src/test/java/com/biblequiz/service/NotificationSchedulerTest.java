package com.biblequiz.service;

import com.biblequiz.modules.notification.service.NotificationScheduler;
import com.biblequiz.modules.notification.service.NotificationService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationSchedulerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationScheduler notificationScheduler;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId("user-1");
        user1.setName("User 1");
        user1.setEmail("user1@test.com");
        user1.setCurrentStreak(5);
        user1.setLastPlayedAt(LocalDateTime.now().minusDays(1));

        user2 = new User();
        user2.setId("user-2");
        user2.setName("User 2");
        user2.setEmail("user2@test.com");
        user2.setCurrentStreak(10);
        user2.setLastPlayedAt(LocalDateTime.now().minusDays(1));
    }

    @Test
    void checkStreakWarnings_shouldNotifyAtRiskUsers() {
        when(userRepository.findUsersWithStreakAtRisk(any(LocalDateTime.class)))
                .thenReturn(List.of(user1, user2));

        notificationScheduler.checkStreakWarnings();

        verify(notificationService).createStreakWarning(user1, 5);
        verify(notificationService).createStreakWarning(user2, 10);
        verify(notificationService, times(2)).createStreakWarning(any(), anyInt());
    }

    @Test
    void checkStreakWarnings_noUsersAtRisk_shouldNotNotify() {
        when(userRepository.findUsersWithStreakAtRisk(any(LocalDateTime.class)))
                .thenReturn(List.of());

        notificationScheduler.checkStreakWarnings();

        verify(notificationService, never()).createStreakWarning(any(), anyInt());
    }

    @Test
    void sendDailyReminders_shouldNotifyAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(user1, user2));

        notificationScheduler.sendDailyReminders();

        verify(notificationService).createDailyReminder(user1);
        verify(notificationService).createDailyReminder(user2);
        verify(notificationService, times(2)).createDailyReminder(any());
    }
}
