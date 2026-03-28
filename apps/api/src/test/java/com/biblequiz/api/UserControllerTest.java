package com.biblequiz.api;

import com.biblequiz.infrastructure.audit.AuditService;
import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.repository.QuizSessionRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest extends BaseControllerTest {

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private AuditService auditService;

    @MockBean
    private QuizSessionRepository quizSessionRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole("USER");
        testUser.setAvatarUrl("https://avatar.url/test.png");
    }

    // ── GET /api/me ──────────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void getCurrentUser_whenAuthenticated_shouldReturn200() throws Exception {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        mockMvc.perform(get("/api/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void getCurrentUser_whenUnauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "unknown@example.com")
    void getCurrentUser_whenUserNotInDb_shouldReturn404() throws Exception {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/me"))
                .andExpect(status().isNotFound());
    }

    // ── PATCH /api/me ────────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void updateCurrentUser_shouldUpdateName() throws Exception {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        mockMvc.perform(patch("/api/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated Name\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-1"));

        verify(userRepository).save(any(User.class));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updateCurrentUser_shouldUpdateAvatar() throws Exception {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        mockMvc.perform(patch("/api/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarUrl\":\"https://new-avatar.url/pic.png\"}"))
                .andExpect(status().isOk());

        verify(userRepository).save(any(User.class));
    }

    // ── POST /api/me/promote-admin ───────────────────────────────────────────

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void promoteAdmin_asAdmin_shouldPromoteUser() throws Exception {
        User targetUser = new User();
        targetUser.setId("user-2");
        targetUser.setName("Target User");
        targetUser.setEmail("target@example.com");
        targetUser.setRole("USER");

        when(userRepository.findByEmail("target@example.com")).thenReturn(Optional.of(targetUser));
        when(userRepository.save(any(User.class))).thenReturn(targetUser);

        mockMvc.perform(post("/api/me/promote-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"target@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    void promoteAdmin_asUser_shouldReturn403() throws Exception {
        mockMvc.perform(post("/api/me/promote-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"target@example.com\"}"))
                .andExpect(status().isForbidden());
    }

    // ── POST /api/me/bootstrap-admin ─────────────────────────────────────────

    @Test
    void bootstrapAdmin_whenNoAdminExists_shouldCreateAdmin() throws Exception {
        when(userRepository.findAll()).thenReturn(List.of(testUser));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        mockMvc.perform(post("/api/me/bootstrap-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"));
    }

    @Test
    void bootstrapAdmin_whenAdminExists_shouldReturn409() throws Exception {
        User admin = new User();
        admin.setId("admin-1");
        admin.setRole("ADMIN");

        when(userRepository.findAll()).thenReturn(List.of(admin));

        mockMvc.perform(post("/api/me/bootstrap-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @Test
    void bootstrapAdmin_withMissingEmail_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/me/bootstrap-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    // ── GET /api/me/history ───────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void getHistory_shouldReturn200WithPaginatedSessions() throws Exception {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        QuizSession session = new QuizSession();
        session.setId("sess-1");
        session.setMode(QuizSession.Mode.practice);
        session.setStatus(QuizSession.Status.completed);
        session.setScore(100);
        session.setTotalQuestions(10);
        session.setCorrectAnswers(8);

        when(quizSessionRepository.findByOwnerIdOrderByCreatedAtDesc(eq("user-1"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(session)));

        mockMvc.perform(get("/api/me/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].id").value("sess-1"))
                .andExpect(jsonPath("$.items[0].score").value(100))
                .andExpect(jsonPath("$.totalItems").value(1));
    }

    @Test
    void getHistory_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/me/history"))
                .andExpect(status().isUnauthorized());
    }
}
