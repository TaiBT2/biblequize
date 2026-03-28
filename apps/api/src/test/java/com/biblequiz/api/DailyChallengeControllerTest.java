package com.biblequiz.api;

import com.biblequiz.modules.daily.service.DailyChallengeService;
import com.biblequiz.modules.quiz.entity.Question;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DailyChallengeController.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DailyChallengeControllerTest extends BaseControllerTest {

    @MockBean
    private DailyChallengeService dailyChallengeService;

    private List<Question> sampleQuestions;

    @BeforeEach
    void setUp() {
        Question q1 = new Question();
        q1.setId("q-1");
        q1.setBook("Genesis");
        q1.setContent("Question 1?");
        q1.setOptions(Arrays.asList("A", "B", "C", "D"));
        q1.setCorrectAnswer(Arrays.asList(0));
        q1.setDifficulty(Question.Difficulty.easy);
        q1.setType(Question.Type.multiple_choice_single);

        Question q2 = new Question();
        q2.setId("q-2");
        q2.setBook("Exodus");
        q2.setContent("Question 2?");
        q2.setOptions(Arrays.asList("A", "B", "C", "D"));
        q2.setCorrectAnswer(Arrays.asList(1));
        q2.setDifficulty(Question.Difficulty.medium);
        q2.setType(Question.Type.multiple_choice_single);

        sampleQuestions = List.of(q1, q2);
    }

    // ── GET /api/daily-challenge ─────────────────────────────────────────────

    @Test
    @Order(1)
    void getDailyChallenge_public_shouldReturn200() throws Exception {
        when(dailyChallengeService.getTodayQuestions()).thenReturn(sampleQuestions);
        when(dailyChallengeService.getDailyQuestionCount()).thenReturn(5);

        mockMvc.perform(get("/api/daily-challenge"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").isNotEmpty())
                .andExpect(jsonPath("$.questions", hasSize(2)))
                .andExpect(jsonPath("$.questions[0].content").value("Question 1?"))
                .andExpect(jsonPath("$.questions[0].correctAnswer").doesNotExist()) // stripped
                .andExpect(jsonPath("$.totalQuestions").value(5))
                .andExpect(jsonPath("$.alreadyCompleted").value(false));
    }

    @Test
    @Order(2)
    @WithMockUser(username = "test@example.com")
    void getDailyChallenge_authenticated_shouldCheckCompletion() throws Exception {
        when(dailyChallengeService.getTodayQuestions()).thenReturn(sampleQuestions);
        when(dailyChallengeService.getDailyQuestionCount()).thenReturn(5);
        when(dailyChallengeService.hasCompletedToday("test@example.com")).thenReturn(true);

        mockMvc.perform(get("/api/daily-challenge"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyCompleted").value(true));
    }

    @Test
    @Order(3)
    void getDailyChallenge_noQuestions_shouldReturnEmptyList() throws Exception {
        when(dailyChallengeService.getTodayQuestions()).thenReturn(List.of());
        when(dailyChallengeService.getDailyQuestionCount()).thenReturn(5);

        mockMvc.perform(get("/api/daily-challenge"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions", hasSize(0)));
    }

    // ── POST /api/daily-challenge/start ──────────────────────────────────────

    @Test
    @Order(4)
    @WithMockUser(username = "test@example.com")
    void startChallenge_shouldReturnSessionId() throws Exception {
        when(dailyChallengeService.getDailyQuestionCount()).thenReturn(5);

        mockMvc.perform(post("/api/daily-challenge/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.totalQuestions").value(5));
    }

    // ── GET /api/daily-challenge/result ───────────────────────────────────────

    @Test
    @Order(5)
    @WithMockUser(username = "test@example.com")
    void getResult_completed_shouldReturnResult() throws Exception {
        when(dailyChallengeService.hasCompletedToday("test@example.com")).thenReturn(true);

        mockMvc.perform(get("/api/daily-challenge/result"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    @Order(6)
    @WithMockUser(username = "test@example.com")
    void getResult_notCompleted_shouldReturnFalse() throws Exception {
        when(dailyChallengeService.hasCompletedToday("test@example.com")).thenReturn(false);

        mockMvc.perform(get("/api/daily-challenge/result"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(false));
    }

    @Test
    @Order(7)
    void getResult_unauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/daily-challenge/result"))
                .andExpect(status().isUnauthorized());
    }

    // ── TC-DAILY-002: GET /api/daily-challenge without auth (guest access) ───

    @Test
    @Order(8)
    void TC_DAILY_002_getDailyChallenge_guestAccess_shouldReturn200WithQuestions() throws Exception {
        when(dailyChallengeService.getTodayQuestions()).thenReturn(sampleQuestions);
        when(dailyChallengeService.getDailyQuestionCount()).thenReturn(5);

        mockMvc.perform(get("/api/daily-challenge"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions", hasSize(2)))
                .andExpect(jsonPath("$.questions[0].id").value("q-1"))
                .andExpect(jsonPath("$.questions[1].id").value("q-2"))
                .andExpect(jsonPath("$.alreadyCompleted").value(false))
                .andExpect(jsonPath("$.totalQuestions").value(5));
    }

    // ── TC-DAILY-004: POST /api/daily-challenge/start ────────────────────────

    @Test
    @Order(9)
    @WithMockUser(username = "test@example.com")
    void TC_DAILY_004_startChallenge_shouldReturnSessionWithDatePrefix() throws Exception {
        when(dailyChallengeService.getDailyQuestionCount()).thenReturn(5);

        mockMvc.perform(post("/api/daily-challenge/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.date").isNotEmpty())
                .andExpect(jsonPath("$.totalQuestions").value(5));
    }
}
