package com.biblequiz.api;

import com.biblequiz.infrastructure.service.CacheService;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.service.SeasonService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Public leaderboard is reachable WITHOUT auth (lives under /api/public/**).
 * These tests run with no @WithMockUser to prove the guest contract.
 */
@WebMvcTest(PublicLeaderboardController.class)
class PublicLeaderboardControllerTest extends BaseControllerTest {

    @MockBean
    private UserDailyProgressRepository udpRepository;

    @MockBean
    private SeasonService seasonService;

    @MockBean
    private CacheService cacheService;

    @BeforeEach
    void setUp() {
        when(cacheService.get(anyString(), any())).thenReturn(Optional.empty());
    }

    @Test
    void allTime_withoutAuth_shouldReturn200() throws Exception {
        Object[] row = new Object[]{"user-1", "Test User", "avatar.png", 24500, 1200};
        when(udpRepository.findAllTimeLeaderboard(eq(20), eq(0)))
                .thenReturn(java.util.Collections.singletonList(row));

        mockMvc.perform(get("/api/public/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId").value("user-1"))
                .andExpect(jsonPath("$[0].points").value(24500));
    }

    @Test
    void defaultsToAllTime_andClampsSize() throws Exception {
        when(udpRepository.findAllTimeLeaderboard(eq(20), eq(0))).thenReturn(List.of());

        // size out of range (0) falls back to 20
        mockMvc.perform(get("/api/public/leaderboard").param("size", "0"))
                .andExpect(status().isOk());

        verify(udpRepository).findAllTimeLeaderboard(eq(20), eq(0));
    }

    @Test
    void weekly_withoutAuth_shouldReturn200() throws Exception {
        when(udpRepository.findWeeklyLeaderboard(any(LocalDate.class), any(LocalDate.class), eq(10), eq(0)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/public/leaderboard").param("period", "weekly").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(udpRepository).findWeeklyLeaderboard(any(LocalDate.class), any(LocalDate.class), eq(10), eq(0));
    }

    @Test
    void season_withNoActiveSeason_shouldReturnEmptyList() throws Exception {
        when(seasonService.getActiveSeason()).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/public/leaderboard").param("period", "season"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(udpRepository, never()).findWeeklyLeaderboard(any(), any(), anyInt(), anyInt());
    }

    @Test
    void season_withActiveSeason_shouldReturnLeaderboard() throws Exception {
        Season activeSeason = new Season("season-1", "Mùa Xuân 2026",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));
        when(seasonService.getActiveSeason()).thenReturn(Optional.of(activeSeason));

        Object[] row = new Object[]{"user-1", "Test User", "avatar.png", 5000, 200};
        when(udpRepository.findWeeklyLeaderboard(any(LocalDate.class), any(LocalDate.class), eq(20), eq(0)))
                .thenReturn(java.util.Collections.singletonList(row));

        mockMvc.perform(get("/api/public/leaderboard").param("period", "season"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].points").value(5000));
    }
}
