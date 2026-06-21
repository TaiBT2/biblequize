package com.biblequiz.api;

import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.service.GroupJourneyService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GroupJourneyController.class)
class GroupJourneyControllerTest extends BaseControllerTest {

    @MockBean private GroupJourneyService journeyService;
    @MockBean private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test");
        testUser.setEmail("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
    }

    private void asMember(GroupMember.GroupRole role) {
        GroupMember m = new GroupMember();
        m.setRole(role);
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(m));
    }

    // ── POST /journeys ────────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void create_asLeader_returns201() throws Exception {
        when(journeyService.createJourney(eq("group-1"), eq("user-1"), eq("Hành trình"), any()))
                .thenReturn(Map.of("id", "journey-1", "status", "DRAFT"));

        mockMvc.perform(post("/api/groups/group-1/journeys")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Hành trình\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.journey.id").value("journey-1"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void create_asMember_returns403() throws Exception {
        when(journeyService.createJourney(any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("Chi leader hoac mod"));

        mockMvc.perform(post("/api/groups/group-1/journeys")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── GET /journeys (member read) ──────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void list_asMember_returns200() throws Exception {
        asMember(GroupMember.GroupRole.MEMBER);
        when(journeyService.listJourneys("group-1")).thenReturn(List.of(Map.of("id", "journey-1")));

        mockMvc.perform(get("/api/groups/group-1/journeys"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.journeys[0].id").value("journey-1"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void getDetail_nonMember_returns400() throws Exception {
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/groups/group-1/journeys/journey-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        verify(journeyService, never()).getJourneyWithProgress(any(), any());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void getDetail_asMember_returns200() throws Exception {
        asMember(GroupMember.GroupRole.MEMBER);
        when(journeyService.getJourneyWithProgress("journey-1", "user-1"))
                .thenReturn(Map.of("id", "journey-1", "weeksOpened", 2, "weeksTotal", 5));

        mockMvc.perform(get("/api/groups/group-1/journeys/journey-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.journey.weeksOpened").value(2))
                .andExpect(jsonPath("$.journey.weeksTotal").value(5));
    }

    // ── POST /open-next ───────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void openNext_missingDeadline_returns400() throws Exception {
        mockMvc.perform(post("/api/groups/group-1/journeys/journey-1/open-next")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        verify(journeyService, never()).openNextWeek(any(), any(), any());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void openNext_asLeader_returns200() throws Exception {
        when(journeyService.openNextWeek(eq("journey-1"), eq("user-1"), any()))
                .thenReturn(Map.of("id", "week-1", "status", "OPEN", "scheduledQuizId", "sq-1"));

        mockMvc.perform(post("/api/groups/group-1/journeys/journey-1/open-next")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"deadline\":\"2026-06-30T00:00:00\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.week.scheduledQuizId").value("sq-1"));
    }

    // ── POST /start ───────────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void start_asLeader_returns200() throws Exception {
        when(journeyService.startJourney("journey-1", "user-1"))
                .thenReturn(Map.of("id", "journey-1", "status", "ACTIVE"));

        mockMvc.perform(post("/api/groups/group-1/journeys/journey-1/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.journey.status").value("ACTIVE"));
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    @Test
    void list_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/groups/group-1/journeys"))
                .andExpect(status().isUnauthorized());
    }
}
