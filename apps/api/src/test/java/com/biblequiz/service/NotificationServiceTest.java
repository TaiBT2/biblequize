package com.biblequiz.service;

import com.biblequiz.modules.notification.entity.Notification;
import com.biblequiz.modules.notification.repository.NotificationRepository;
import com.biblequiz.modules.notification.service.NotificationService;
import com.biblequiz.modules.user.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
    }

    @Test
    void createNotification_shouldSaveAndReturn() {
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Notification result = notificationService.createNotification(
                testUser, "tier_up", "Title", "Body", "{\"key\":\"value\"}");

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(testUser, result.getUser());
        assertEquals("tier_up", result.getType());
        assertEquals("Title", result.getTitle());
        assertEquals("Body", result.getBody());
        assertEquals("{\"key\":\"value\"}", result.getMetadata());
        assertFalse(result.getIsRead());

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createTierUpNotification_shouldSetCorrectTypeAndBody() {
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        notificationService.createTierUpNotification(testUser, "Gold", "gold");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertEquals("tier_up", saved.getType());
        assertEquals("Chúc mừng lên tier!", saved.getTitle());
        assertTrue(saved.getBody().contains("Gold"));
        assertNotNull(saved.getMetadata());
        assertTrue(saved.getMetadata().contains("gold"));
    }

    @Test
    void getNotifications_unreadOnly_shouldFilterCorrectly() {
        Notification n1 = new Notification("n-1", testUser, "tier_up", "Title 1", "Body 1");
        n1.setIsRead(false);
        n1.setCreatedAt(LocalDateTime.now());

        Notification n2 = new Notification("n-2", testUser, "streak_warning", "Title 2", "Body 2");
        n2.setIsRead(false);
        n2.setCreatedAt(LocalDateTime.now());

        when(notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc("user-1"))
                .thenReturn(List.of(n1, n2));

        List<Map<String, Object>> result = notificationService.getNotifications("user-1", true, 20);

        assertEquals(2, result.size());
        assertEquals("n-1", result.get(0).get("id"));
        assertEquals("Title 1", result.get(0).get("title"));
        assertEquals(false, result.get(0).get("isRead"));

        verify(notificationRepository).findByUserIdAndIsReadFalseOrderByCreatedAtDesc("user-1");
        verify(notificationRepository, never()).findByUserIdPaginated(anyString(), any());
    }

    @Test
    void getUnreadCount_shouldReturnCount() {
        when(notificationRepository.countByUserIdAndIsReadFalse("user-1")).thenReturn(5L);

        long count = notificationService.getUnreadCount("user-1");

        assertEquals(5L, count);
        verify(notificationRepository).countByUserIdAndIsReadFalse("user-1");
    }

    @Test
    void markAsRead_shouldSetIsReadTrue() {
        Notification notification = new Notification("n-1", testUser, "tier_up", "Title", "Body");
        notification.setIsRead(false);

        when(notificationRepository.findById("n-1")).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        boolean result = notificationService.markAsRead("n-1", "user-1");

        assertTrue(result);
        assertTrue(notification.getIsRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_wrongUser_shouldReturnFalse() {
        Notification notification = new Notification("n-1", testUser, "tier_up", "Title", "Body");
        notification.setIsRead(false);

        when(notificationRepository.findById("n-1")).thenReturn(Optional.of(notification));

        boolean result = notificationService.markAsRead("n-1", "other-user");

        assertFalse(result);
        assertFalse(notification.getIsRead());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAllAsRead_shouldUpdateAllUnread() {
        when(notificationRepository.markAllAsRead("user-1")).thenReturn(3);

        int count = notificationService.markAllAsRead("user-1");

        assertEquals(3, count);
        verify(notificationRepository).markAllAsRead("user-1");
    }
}
