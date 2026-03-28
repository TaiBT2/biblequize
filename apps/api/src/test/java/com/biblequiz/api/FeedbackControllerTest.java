package com.biblequiz.api;

import com.biblequiz.modules.feedback.entity.Feedback;
import com.biblequiz.modules.feedback.repository.FeedbackRepository;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FeedbackController.class)
class FeedbackControllerTest extends BaseControllerTest {

    @MockBean
    private FeedbackRepository feedbackRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private QuestionRepository questionRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole("USER");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
    }

    // ── POST /api/feedback ───────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    void submitFeedback_withValidData_shouldReturn200() throws Exception {
        when(feedbackRepository.save(any(Feedback.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"general\",\"content\":\"Great app!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("pending"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void submitFeedback_withMissingContent_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"general\",\"content\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void submitFeedback_withInvalidType_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"INVALID\",\"content\":\"test\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitFeedback_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"general\",\"content\":\"test\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/admin/feedback ──────────────────────────────────────────────

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void listFeedback_asAdmin_shouldReturn200() throws Exception {
        Feedback feedback = new Feedback();
        feedback.setId("fb-1");
        feedback.setType(Feedback.Type.general);
        feedback.setStatus(Feedback.Status.pending);
        feedback.setContent("Test feedback");
        feedback.setUser(testUser);

        when(feedbackRepository.findAll(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(feedback)));
        when(feedbackRepository.countByStatus(any())).thenReturn(1L);

        mockMvc.perform(get("/api/admin/feedback"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    void listFeedback_asUser_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/admin/feedback"))
                .andExpect(status().isForbidden());
    }

    // ── PATCH /api/admin/feedback/{id} ───────────────────────────────────────

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void updateFeedback_asAdmin_shouldReturn200() throws Exception {
        Feedback feedback = new Feedback();
        feedback.setId("fb-1");
        feedback.setType(Feedback.Type.general);
        feedback.setStatus(Feedback.Status.pending);
        feedback.setContent("Test feedback");
        feedback.setUser(testUser);

        when(feedbackRepository.findById("fb-1")).thenReturn(Optional.of(feedback));
        when(feedbackRepository.save(any(Feedback.class))).thenReturn(feedback);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(testUser));

        mockMvc.perform(patch("/api/admin/feedback/fb-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"resolved\",\"note\":\"Fixed it\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("fb-1"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void updateFeedback_notFound_shouldReturn404() throws Exception {
        when(feedbackRepository.findById("non-existent")).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/admin/feedback/non-existent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"resolved\"}"))
                .andExpect(status().isNotFound());
    }
}
