package com.biblequiz.api;

import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.entity.SeasonRanking;
import com.biblequiz.modules.season.repository.SeasonRankingRepository;
import com.biblequiz.modules.season.repository.SeasonRepository;
import com.biblequiz.modules.season.service.SeasonService;
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

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SeasonController.class)
class SeasonControllerTest extends BaseControllerTest {

    @MockBean
    private SeasonRepository seasonRepository;

    @MockBean
    private SeasonRankingRepository seasonRankingRepository;

    @MockBean
    private SeasonService seasonService;

    @MockBean
    private UserRepository userRepository;

    private User testUser;
    private Season testSeason;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");

        testSeason = new Season();
        testSeason.setId("season-1");
        testSeason.setName("Season 1");
        testSeason.setStartDate(LocalDate.of(2026, 1, 1));
        testSeason.setEndDate(LocalDate.of(2026, 3, 31));
        testSeason.setIsActive(true);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
    }

    // ── GET /api/seasons/active ──────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void getActiveSeason_whenExists_shouldReturn200() throws Exception {
        when(seasonService.getActiveSeason()).thenReturn(Optional.of(testSeason));

        mockMvc.perform(get("/api/seasons/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.name").value("Season 1"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void getActiveSeason_whenNone_shouldReturnInactive() throws Exception {
        when(seasonService.getActiveSeason()).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/seasons/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    // ── GET /api/seasons/{seasonId}/leaderboard ──────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    @SuppressWarnings("unchecked")
    void seasonLeaderboard_shouldReturn200() throws Exception {
        Object[] row = new Object[]{"sr-1", "user-1", "Test User", "avatar.png", 500, 30};
        List<Object[]> rows = new java.util.ArrayList<>();
        rows.add(row);
        when(seasonRankingRepository.findSeasonLeaderboard("season-1", 20, 0))
                .thenReturn(rows);

        mockMvc.perform(get("/api/seasons/season-1/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].points").value(500));
    }

    // ── GET /api/seasons/{seasonId}/my-rank ──────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void mySeasonRank_shouldReturn200() throws Exception {
        SeasonRanking ranking = new SeasonRanking();
        ranking.setTotalPoints(300);
        ranking.setTotalQuestions(20);

        when(seasonRankingRepository.findBySeasonIdAndUserId("season-1", "user-1"))
                .thenReturn(Optional.of(ranking));
        when(seasonRankingRepository.countUsersAheadInSeason("season-1", 300)).thenReturn(2L);

        mockMvc.perform(get("/api/seasons/season-1/my-rank"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rank").value(3))
                .andExpect(jsonPath("$.points").value(300));
    }

    // ── GET /api/seasons ─────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void listSeasons_shouldReturn200() throws Exception {
        when(seasonRepository.findAllByOrderByStartDateDesc()).thenReturn(List.of(testSeason));

        mockMvc.perform(get("/api/seasons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Season 1"))
                .andExpect(jsonPath("$[0].isActive").value(true));
    }
}
