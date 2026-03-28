package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.QuestionReview;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.QuestionReviewRepository;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QuestionReviewController.class)
class QuestionReviewControllerTest extends BaseControllerTest {

    @MockBean
    private QuestionRepository questionRepository;

    @MockBean
    private QuestionReviewRepository reviewRepository;

    @MockBean
    private UserRepository userRepository;

    private Question pendingQuestion;

    @BeforeEach
    void setUp() {
        pendingQuestion = new Question();
        pendingQuestion.setId("q-1");
        pendingQuestion.setBook("Genesis");
        pendingQuestion.setContent("Test pending question?");
        pendingQuestion.setReviewStatus(Question.ReviewStatus.PENDING);
        pendingQuestion.setApprovalsCount(0);
        pendingQuestion.setIsActive(false);
    }

    // ── GET /api/admin/review/pending ────────────────────────────────────────

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void listPending_shouldReturn200() throws Exception {
        when(questionRepository.findByReviewStatus(eq(Question.ReviewStatus.PENDING), any()))
                .thenReturn(new PageImpl<>(List.of(pendingQuestion)));
        when(reviewRepository.findByQuestionId("q-1")).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/review/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions").isArray())
                .andExpect(jsonPath("$.questions[0].content").value("Test pending question?"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    void listPending_asUser_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/admin/review/pending"))
                .andExpect(status().isForbidden());
    }

    // ── POST /api/admin/review/{questionId}/approve ──────────────────────────

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void approve_shouldIncrementCount() throws Exception {
        when(questionRepository.findById("q-1")).thenReturn(Optional.of(pendingQuestion));
        when(reviewRepository.existsByQuestionIdAndAdminId("q-1", "admin@example.com")).thenReturn(false);
        when(reviewRepository.save(any(QuestionReview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(questionRepository.save(any(Question.class))).thenReturn(pendingQuestion);

        mockMvc.perform(post("/api/admin/review/q-1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Looks good\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalsCount").value(1))
                .andExpect(jsonPath("$.activated").value(false));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void approve_secondApproval_shouldActivateQuestion() throws Exception {
        pendingQuestion.setApprovalsCount(1); // Already has 1 approval

        when(questionRepository.findById("q-1")).thenReturn(Optional.of(pendingQuestion));
        when(reviewRepository.existsByQuestionIdAndAdminId("q-1", "admin@example.com")).thenReturn(false);
        when(reviewRepository.save(any(QuestionReview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(questionRepository.save(any(Question.class))).thenReturn(pendingQuestion);

        mockMvc.perform(post("/api/admin/review/q-1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalsCount").value(2))
                .andExpect(jsonPath("$.activated").value(true));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void approve_alreadyReviewed_shouldReturn400() throws Exception {
        when(questionRepository.findById("q-1")).thenReturn(Optional.of(pendingQuestion));
        when(reviewRepository.existsByQuestionIdAndAdminId("q-1", "admin@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/admin/review/q-1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void approve_notFound_shouldReturn404() throws Exception {
        when(questionRepository.findById("non-existent")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/admin/review/non-existent/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/admin/review/{questionId}/reject ───────────────────────────

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void reject_shouldSetStatusRejected() throws Exception {
        when(questionRepository.findById("q-1")).thenReturn(Optional.of(pendingQuestion));
        when(reviewRepository.findByQuestionIdAndAdminId("q-1", "admin@example.com"))
                .thenReturn(Optional.empty());
        when(reviewRepository.save(any(QuestionReview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(questionRepository.save(any(Question.class))).thenReturn(pendingQuestion);

        mockMvc.perform(post("/api/admin/review/q-1/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Incorrect\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void reject_activeQuestion_shouldReturn400() throws Exception {
        pendingQuestion.setReviewStatus(Question.ReviewStatus.ACTIVE);

        when(questionRepository.findById("q-1")).thenReturn(Optional.of(pendingQuestion));

        mockMvc.perform(post("/api/admin/review/q-1/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ── GET /api/admin/review/stats ──────────────────────────────────────────

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void stats_shouldReturn200() throws Exception {
        when(questionRepository.countByReviewStatus(Question.ReviewStatus.PENDING)).thenReturn(5L);
        when(questionRepository.countByReviewStatus(Question.ReviewStatus.ACTIVE)).thenReturn(100L);
        when(questionRepository.countByReviewStatus(Question.ReviewStatus.REJECTED)).thenReturn(3L);

        mockMvc.perform(get("/api/admin/review/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pending").value(5))
                .andExpect(jsonPath("$.active").value(100))
                .andExpect(jsonPath("$.rejected").value(3))
                .andExpect(jsonPath("$.approvalsRequired").value(2));
    }
}
