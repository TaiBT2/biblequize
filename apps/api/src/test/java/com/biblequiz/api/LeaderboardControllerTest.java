package com.biblequiz.api;

import com.biblequiz.infrastructure.service.CacheService;
import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaderboardController.class)
class LeaderboardControllerTest extends BaseControllerTest {

    @MockBean
    private UserDailyProgressRepository udpRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private CacheService cacheService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        // Default: no cache hits
        when(cacheService.get(anyString(), any())).thenReturn(Optional.empty());
    }

    // ── GET /api/leaderboard/daily ───────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void daily_shouldReturn200() throws Exception {
        Object[] row = new Object[]{"user-1", "Test User", "avatar.png", 150, 10};
        when(udpRepository.findDailyLeaderboard(any(LocalDate.class), eq(20), eq(0)))
                .thenReturn(java.util.Collections.singletonList(row));

        mockMvc.perform(get("/api/leaderboard/daily"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId").value("user-1"))
                .andExpect(jsonPath("$[0].points").value(150));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void daily_withPagination_shouldPassParams() throws Exception {
        when(udpRepository.findDailyLeaderboard(any(LocalDate.class), eq(10), eq(20)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/leaderboard/daily")
                        .param("page", "2")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(udpRepository).findDailyLeaderboard(any(LocalDate.class), eq(10), eq(20));
    }

    // ── GET /api/leaderboard/weekly ──────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void weekly_shouldReturn200() throws Exception {
        when(udpRepository.findWeeklyLeaderboard(any(LocalDate.class), any(LocalDate.class), eq(20), eq(0)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/leaderboard/weekly"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ── GET /api/leaderboard/monthly ─────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void monthly_shouldReturn200() throws Exception {
        when(udpRepository.findWeeklyLeaderboard(any(LocalDate.class), any(LocalDate.class), eq(20), eq(0)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/leaderboard/monthly"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ── GET /api/leaderboard/all-time ────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void allTime_shouldReturn200() throws Exception {
        when(udpRepository.findAllTimeLeaderboard(eq(20), eq(0)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/leaderboard/all-time"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ── GET /api/leaderboard/daily/my-rank ───────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void getMyDailyRank_shouldReturn200() throws Exception {
        UserDailyProgress udp = new UserDailyProgress();
        udp.setPointsCounted(200);
        udp.setQuestionsCounted(15);

        when(udpRepository.findByUserIdAndDate(eq("user-1"), any(LocalDate.class)))
                .thenReturn(Optional.of(udp));
        when(udpRepository.countUsersAheadOnDate(any(LocalDate.class), eq(200))).thenReturn(2L);

        mockMvc.perform(get("/api/leaderboard/daily/my-rank"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("user-1"))
                .andExpect(jsonPath("$.points").value(200))
                .andExpect(jsonPath("$.rank").value(3));
    }

    // ── GET /api/leaderboard/weekly/my-rank ──────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void getMyWeeklyRank_withPoints_shouldReturn200() throws Exception {
        UserDailyProgress udp = new UserDailyProgress();
        udp.setPointsCounted(100);

        when(udpRepository.findByUserIdAndDateBetween(eq("user-1"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(udp));
        when(udpRepository.countUsersAheadInDateRange(any(), any(), eq(100))).thenReturn(0L);

        mockMvc.perform(get("/api/leaderboard/weekly/my-rank"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rank").value(1));
    }

    // ── GET /api/leaderboard/all-time/my-rank ────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void getMyAllTimeRank_shouldReturn200() throws Exception {
        UserDailyProgress udp = new UserDailyProgress();
        udp.setPointsCounted(500);

        when(udpRepository.findByUserIdOrderByDateDesc("user-1")).thenReturn(List.of(udp));
        when(udpRepository.countUsersAheadAllTime(500)).thenReturn(5L);

        mockMvc.perform(get("/api/leaderboard/all-time/my-rank"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rank").value(6));
    }
}
