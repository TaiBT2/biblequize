package com.biblequiz.api;

import com.biblequiz.modules.coverage.entity.UserSeasonCoverage;
import com.biblequiz.modules.coverage.service.BadgeAwardService;
import com.biblequiz.modules.coverage.service.LiturgicalCoverageService;
import com.biblequiz.modules.coverage.service.LiturgicalCoverageService.UnlockException;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.coverage.entity.WeeklyPairing;
import com.biblequiz.modules.coverage.repository.WeeklyPairingRepository;
import com.biblequiz.modules.season.service.LiturgicalSeasonService;
import com.biblequiz.modules.ranked.service.UserTierService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.biblequiz.infrastructure.feature.FeatureFlagService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * LCT-4 — POST /api/ranked/coverage/unlock-next-week.
 *
 * The endpoint maps LiturgicalCoverageService.UnlockException codes to HTTP
 * status + error body (FE consumes via coverage.unlockError.* i18n keys).
 * Pin the contract per error code + the happy-path response shape.
 */
@WebMvcTest(CoverageController.class)
class CoverageControllerTest extends BaseControllerTest {

    @MockBean private LiturgicalCoverageService coverageService;
    @MockBean private LiturgicalSeasonService seasonService;
    @MockBean private WeeklyPairingRepository pairingRepository;
    @MockBean private UserRepository userRepository;
    @MockBean private UserTierService userTierService;
    @MockBean private FeatureFlagService featureFlags;
    @MockBean private BadgeAwardService badgeAwardService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setEmail("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(featureFlags.isLiturgicalCoverageEnabled("user-1")).thenReturn(true);

        Season s = new Season();
        s.setId("season-1");
        when(seasonService.getCurrentSeason()).thenReturn(Optional.of(s));
    }

    /** OAuth principal — the controller pulls `email` from the OAuth2User claims. */
    private Authentication oauthAuth() {
        return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                new DefaultOAuth2User(
                        List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")),
                        Map.of("email", "test@example.com"),
                        "email"),
                "n/a",
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")));
    }

    @Test
    void unlockNextWeek_happyPath_returns200WithNewWeek() throws Exception {
        UserSeasonCoverage updated = new UserSeasonCoverage();
        updated.setCurrentWeek(5);
        when(coverageService.unlockNextWeek("user-1", "season-1")).thenReturn(updated);
        WeeklyPairing pairing = new WeeklyPairing();
        pairing.setBookCodes(List.of("Genesis", "Matthew"));
        when(pairingRepository.findBySeasonIdAndWeekNumber("season-1", 5)).thenReturn(Optional.of(pairing));

        mockMvc.perform(post("/api/ranked/coverage/unlock-next-week").with(authentication(oauthAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.newWeek").value(5))
                .andExpect(jsonPath("$.newBooks[0]").value("Genesis"));
    }

    @Test
    void unlockNextWeek_alreadyAtLastWeek_returns404_NO_NEXT_WEEK() throws Exception {
        when(coverageService.unlockNextWeek(anyString(), anyString()))
                .thenThrow(new UnlockException("NO_NEXT_WEEK"));

        mockMvc.perform(post("/api/ranked/coverage/unlock-next-week").with(authentication(oauthAuth())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NO_NEXT_WEEK"));
    }

    @Test
    void unlockNextWeek_currentWeekIncomplete_returns400_WEEK_NOT_COMPLETED() throws Exception {
        when(coverageService.unlockNextWeek(anyString(), anyString()))
                .thenThrow(new UnlockException("WEEK_NOT_COMPLETED"));

        mockMvc.perform(post("/api/ranked/coverage/unlock-next-week").with(authentication(oauthAuth())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("WEEK_NOT_COMPLETED"));
    }

    @Test
    void unlockNextWeek_alreadyAheadOfCalendar_returns400_ALREADY_AHEAD_LIMIT() throws Exception {
        when(coverageService.unlockNextWeek(anyString(), anyString()))
                .thenThrow(new UnlockException("ALREADY_AHEAD_LIMIT"));

        mockMvc.perform(post("/api/ranked/coverage/unlock-next-week").with(authentication(oauthAuth())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("ALREADY_AHEAD_LIMIT"));
    }

    @Test
    void unlockNextWeek_featureFlagOff_returns404_FEATURE_NOT_ENABLED() throws Exception {
        when(featureFlags.isLiturgicalCoverageEnabled("user-1")).thenReturn(false);

        mockMvc.perform(post("/api/ranked/coverage/unlock-next-week").with(authentication(oauthAuth())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("FEATURE_NOT_ENABLED"));
    }

    @Test
    @WithMockUser
    void unlockNextWeek_unauthenticated_returns401() throws Exception {
        // @WithMockUser uses a plain UsernamePasswordAuthentication, not an OAuth2User,
        // so resolveUserId() returns null → 401.
        mockMvc.perform(post("/api/ranked/coverage/unlock-next-week"))
                .andExpect(status().isUnauthorized());
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor authentication(Authentication a) {
        return org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication(a);
    }
}
