package com.biblequiz.service;

import com.biblequiz.infrastructure.service.CacheService;
import com.biblequiz.modules.daily.service.DailyChallengeService;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DailyChallengeServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private CacheService cacheService;

    @InjectMocks
    private DailyChallengeService dailyChallengeService;

    private Question makeQuestion(String id) {
        Question q = new Question();
        q.setId(id);
        q.setContent("Question " + id);
        return q;
    }

    @BeforeEach
    void setUp() {
        // Default: no cache hit
        lenient().when(cacheService.get(anyString(), eq(List.class))).thenReturn(Optional.empty());
        lenient().when(cacheService.exists(anyString())).thenReturn(false);
    }

    // ── TC-DAILY-001: getTodayQuestions returns 5 questions ──────────────────

    @Order(1)
    @Test
    void TC_DAILY_001_getDailyQuestions_shouldReturn5Questions() {
        // 20 active questions available
        when(questionRepository.countByLanguageAndIsActiveTrue("vi")).thenReturn(20L);
        when(questionRepository.findByLanguageAndIsActiveTrue(eq("vi"), any(Pageable.class)))
                .thenAnswer(inv -> {
                    int pageNumber = ((Pageable) inv.getArgument(1)).getPageNumber();
                    Question q = makeQuestion("q-" + pageNumber);
                    return new PageImpl<>(List.of(q));
                });

        LocalDate date = LocalDate.of(2025, 1, 15);
        List<Question> questions = dailyChallengeService.getDailyQuestions(date);

        assertEquals(5, questions.size());
    }

    // ── TC-DAILY-004: hasCompletedToday returns true after markCompleted ─────

    @Order(2)
    @Test
    void TC_DAILY_004_hasCompletedToday_shouldReturnTrueAfterMarkCompleted() {
        String userId = "user-123";

        // Before marking: not completed
        when(cacheService.exists(anyString())).thenReturn(false);
        assertFalse(dailyChallengeService.hasCompletedToday(userId));

        // Mark completed
        dailyChallengeService.markCompleted(userId, 100, 4);
        verify(cacheService).put(argThat(key -> key.contains("completed:" + userId)), any(), any());

        // After marking: simulate cache returning true
        when(cacheService.exists(argThat(key -> key.contains("completed:" + userId)))).thenReturn(true);
        assertTrue(dailyChallengeService.hasCompletedToday(userId));
    }

    // ── TC-DAILY-005: Different dates produce different question selections ──

    @Order(3)
    @Test
    void TC_DAILY_005_getDailyQuestions_differentDates_shouldProduceDifferentResults() {
        when(questionRepository.countByLanguageAndIsActiveTrue("vi")).thenReturn(100L);
        when(questionRepository.findByLanguageAndIsActiveTrue(eq("vi"), any(Pageable.class)))
                .thenAnswer(inv -> {
                    int pageNumber = ((Pageable) inv.getArgument(1)).getPageNumber();
                    Question q = makeQuestion("q-" + pageNumber);
                    return new PageImpl<>(List.of(q));
                });

        LocalDate date1 = LocalDate.of(2025, 6, 1);
        LocalDate date2 = LocalDate.of(2025, 6, 2);

        List<Question> questions1 = dailyChallengeService.getDailyQuestions(date1);
        List<Question> questions2 = dailyChallengeService.getDailyQuestions(date2);

        // Both return 5 questions
        assertEquals(5, questions1.size());
        assertEquals(5, questions2.size());

        // Extract IDs and verify they differ (date-based seed produces different indices)
        List<String> ids1 = questions1.stream().map(Question::getId).toList();
        List<String> ids2 = questions2.stream().map(Question::getId).toList();
        assertNotEquals(ids1, ids2, "Different dates should produce different question selections");
    }

    // ── getDailyQuestionCount returns 5 ──────────────────────────────────────

    @Order(4)
    @Test
    void getDailyQuestionCount_shouldReturn5() {
        assertEquals(5, dailyChallengeService.getDailyQuestionCount());
    }
}
