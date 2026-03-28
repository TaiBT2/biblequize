package com.biblequiz.api;

import com.biblequiz.modules.achievement.service.AchievementService;
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

@WebMvcTest(AchievementController.class)
class AchievementControllerTest extends BaseControllerTest {

    @MockBean
    private AchievementService achievementService;

    @MockBean
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void myAchievements_shouldReturnList() throws Exception {
        List<Map<String, Object>> achievements = List.of(
                Map.of("id", "ach-1", "name", "First Quiz", "unlocked", true),
                Map.of("id", "ach-2", "name", "10 Streak", "unlocked", false));

        when(achievementService.getAllWithStatus("user-1")).thenReturn(achievements);

        mockMvc.perform(get("/api/achievements/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("First Quiz"))
                .andExpect(jsonPath("$[0].unlocked").value(true));
    }

    @Test
    @WithMockUser(username = "unknown@example.com")
    void myAchievements_whenUserNotFound_shouldReturnEmptyList() throws Exception {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/achievements/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void myAchievements_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/achievements/me"))
                .andExpect(status().isUnauthorized());
    }
}
