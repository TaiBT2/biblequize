package com.biblequiz.api;

import com.biblequiz.infrastructure.service.CacheService;
import com.biblequiz.modules.achievement.service.AchievementService;
import com.biblequiz.modules.daily.service.DailyChallengeService;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.UserBookProgressRepository;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.quiz.service.BookProgressionService;
import com.biblequiz.modules.quiz.service.SessionService;
import com.biblequiz.modules.ranked.service.RankedSessionService;
import com.biblequiz.modules.ranked.service.ScoringService;
import com.biblequiz.modules.season.service.SeasonService;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.List;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({SessionController.class, RankedController.class, DailyChallengeController.class, BookController.class})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SecurityTest extends BaseControllerTest {

    // SessionController dependencies
    @MockBean
    private SessionService sessionService;

    // RankedController dependencies
    @MockBean
    private RankedSessionService rankedSessionService;

    @MockBean
    private UserDailyProgressRepository udpRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private BookProgressionService bookProgressionService;

    @MockBean
    private UserBookProgressRepository userBookProgressRepository;

    @MockBean
    private QuestionRepository questionRepository;

    @MockBean
    private CacheService cacheService;

    @MockBean
    private SeasonService seasonService;

    @MockBean
    private AchievementService achievementService;

    @MockBean
    private ScoringService scoringService;

    @MockBean
    private com.biblequiz.modules.notification.service.NotificationService notificationService;

    // DailyChallengeController dependencies
    @MockBean
    private DailyChallengeService dailyChallengeService;

    // BookController dependencies
    @MockBean
    private com.biblequiz.modules.quiz.repository.BookRepository bookRepository;

    // ── TC-AUTH-008: Public endpoints accessible without auth ─────────────────

    @Test
    @Order(1)
    void TC_AUTH_008_getDailyChallenge_withoutAuth_shouldReturn200() throws Exception {
        when(dailyChallengeService.getTodayQuestions()).thenReturn(List.of());
        when(dailyChallengeService.getDailyQuestionCount()).thenReturn(5);

        mockMvc.perform(get("/api/daily-challenge"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(2)
    void TC_AUTH_008_getBooks_withoutAuth_shouldReturn200() throws Exception {
        when(bookRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk());
    }

    // ── TC-AUTH-009: Protected endpoints require auth ────────────────────────

    @Test
    @Order(3)
    void TC_AUTH_009_getMe_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(4)
    void TC_AUTH_009_postSessions_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType("application/json")
                        .content("{\"mode\":\"ranked\",\"questionCount\":10}"))
                .andExpect(status().isUnauthorized());
    }

    // ── TC-SEC-008: Error responses must not contain stack traces ─────────────

    @Test
    @Order(5)
    void TC_SEC_008_errorResponse_shouldNotContainStackTrace() throws Exception {
        when(dailyChallengeService.getTodayQuestions())
                .thenThrow(new RuntimeException("Simulated internal error"));

        mockMvc.perform(get("/api/daily-challenge"))
                .andExpect(status().is5xxServerError())
                .andExpect(content().string(not(containsString("at com.biblequiz"))))
                .andExpect(content().string(not(containsString(".java:"))));
    }
}
