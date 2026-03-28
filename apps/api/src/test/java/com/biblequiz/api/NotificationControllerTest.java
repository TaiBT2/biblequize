package com.biblequiz.api;

import com.biblequiz.modules.notification.service.NotificationService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest extends BaseControllerTest {

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void getNotifications_shouldReturn200() throws Exception {
        List<Map<String, Object>> notifications = List.of(
                Map.of("id", "n-1", "title", "Chúc mừng!", "body", "Bạn đã lên tier Gold", "isRead", false),
                Map.of("id", "n-2", "title", "Streak!", "body", "Streak sắp gãy", "isRead", false));

        when(notificationService.getNotifications("user-1", true, 20)).thenReturn(notifications);
        when(notificationService.getUnreadCount("user-1")).thenReturn(2L);

        mockMvc.perform(get("/api/notifications").param("unread", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications", hasSize(2)))
                .andExpect(jsonPath("$.notifications[0].title").value("Chúc mừng!"))
                .andExpect(jsonPath("$.unreadCount").value(2));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void markAsRead_shouldReturn200() throws Exception {
        when(notificationService.markAsRead("n-1", "user-1")).thenReturn(true);

        mockMvc.perform(patch("/api/notifications/n-1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(notificationService).markAsRead("n-1", "user-1");
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void markAllAsRead_shouldReturn200() throws Exception {
        when(notificationService.markAllAsRead("user-1")).thenReturn(5);

        mockMvc.perform(patch("/api/notifications/read-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.markedCount").value(5));

        verify(notificationService).markAllAsRead("user-1");
    }

    @Test
    void getNotifications_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());
    }
}
