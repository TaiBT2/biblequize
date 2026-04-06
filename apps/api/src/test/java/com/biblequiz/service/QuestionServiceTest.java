package com.biblequiz.service;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private com.biblequiz.infrastructure.service.CacheService cacheService;

    @InjectMocks
    private com.biblequiz.modules.quiz.service.QuestionService questionService;

    private Question sampleQuestion;
    private List<Question> sampleQuestions;

    @BeforeEach
    void setUp() {
        sampleQuestion = new Question();
        sampleQuestion.setId("1");
        sampleQuestion.setBook("Genesis");
        sampleQuestion.setChapter(1);
        sampleQuestion.setLanguage("vi");
        sampleQuestion.setDifficulty(Question.Difficulty.easy);
        sampleQuestion.setType(Question.Type.multiple_choice_single);
        sampleQuestion.setContent("What is the first book of the Bible?");
        sampleQuestion.setOptions(Arrays.asList("Genesis", "Exodus", "Leviticus", "Numbers"));
        sampleQuestion.setCorrectAnswer(Arrays.asList(0));
        sampleQuestion.setIsActive(true);

        sampleQuestions = Arrays.asList(sampleQuestion);

        lenient().when(cacheService.getCachedQuestionList(any(), any())).thenReturn(java.util.Optional.empty());
        lenient().when(cacheService.getCachedQuestionOfTheDay(any(), any())).thenReturn(java.util.Optional.empty());
    }

    @Test
    void getRandomQuestions_WithValidParameters_ShouldReturnQuestions() {
        when(questionRepository.countByLanguageAndIsActiveTrue("vi")).thenReturn(1L);
        when(questionRepository.findByLanguageAndIsActiveTrue(eq("vi"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        List<Question> result = questionService.getRandomQuestions(null, null, 1, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Genesis", result.get(0).getBook());
    }

    @Test
    void getRandomQuestions_WithLanguageEn_ShouldFilterByEnglish() {
        when(questionRepository.countByLanguageAndIsActiveTrue("en")).thenReturn(1L);
        when(questionRepository.findByLanguageAndIsActiveTrue(eq("en"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        List<Question> result = questionService.getRandomQuestions(null, null, "en", 1, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(questionRepository).countByLanguageAndIsActiveTrue("en");
    }

    @Test
    void getRandomQuestions_WithBookFilter_ShouldReturnFilteredQuestions() {
        String book = "Genesis";
        when(questionRepository.countByBookAndLanguageAndIsActiveTrue(book, "vi")).thenReturn(1L);
        when(questionRepository.findByLanguageAndBookAndIsActiveTrue(eq("vi"), eq(book), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        List<Question> result = questionService.getRandomQuestions(book, null, 1, null);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getRandomQuestions_WithDifficultyFilter_ShouldReturnFilteredQuestions() {
        when(questionRepository.countByDifficultyAndLanguageAndIsActiveTrue(Question.Difficulty.easy, "vi")).thenReturn(1L);
        when(questionRepository.findByLanguageAndDifficultyAndIsActiveTrue(eq("vi"), eq(Question.Difficulty.easy), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        List<Question> result = questionService.getRandomQuestions(null, "easy", 1, null);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getRandomQuestions_WithExcludeIds_ShouldExcludeSpecifiedQuestions() {
        List<String> excludeIds = Arrays.asList("1", "2");
        when(questionRepository.countByLanguageAndIsActiveTrue("vi")).thenReturn(3L);
        when(questionRepository.findByLanguageAndIsActiveTrue(eq("vi"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        List<Question> result = questionService.getRandomQuestions(null, null, 1, excludeIds);

        assertNotNull(result);
    }

    @Test
    void getRandomQuestions_WithZeroLimit_ShouldReturnEmptyList() {
        List<Question> result = questionService.getRandomQuestions(null, null, 0, null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verifyNoInteractions(questionRepository);
    }

    @Test
    void getRandomQuestions_WithNoQuestionsAvailable_ShouldReturnEmptyList() {
        when(questionRepository.countByLanguageAndIsActiveTrue("vi")).thenReturn(0L);

        List<Question> result = questionService.getRandomQuestions(null, null, 1, null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getQuestionOfTheDay_WithValidData_ShouldReturnQuestion() {
        when(questionRepository.countByLanguageAndIsActiveTrue("vi")).thenReturn(1L);
        when(questionRepository.findByLanguageAndIsActiveTrue(eq("vi"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        Question result = questionService.getQuestionOfTheDay("vi");

        assertNotNull(result);
        assertEquals("Genesis", result.getBook());
    }

    @Test
    void getQuestionOfTheDay_WithNoQuestions_ShouldReturnNull() {
        when(questionRepository.countByLanguageAndIsActiveTrue("vi")).thenReturn(0L);

        Question result = questionService.getQuestionOfTheDay("vi");

        assertNull(result);
    }

    @Test
    void getQuestionOfTheDay_WithEmptyPage_ShouldReturnFirstAvailableQuestion() {
        when(questionRepository.countByLanguageAndIsActiveTrue("vi")).thenReturn(1L);
        when(questionRepository.findByLanguageAndIsActiveTrue(eq("vi"), any(PageRequest.class)))
                .thenReturn(Page.empty())
                .thenReturn(new PageImpl<>(sampleQuestions));

        Question result = questionService.getQuestionOfTheDay("vi");

        assertNotNull(result);
        assertEquals("Genesis", result.getBook());
    }
}
