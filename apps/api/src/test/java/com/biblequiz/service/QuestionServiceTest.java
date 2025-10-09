package com.biblequiz.service;

import com.biblequiz.entity.Question;
import com.biblequiz.repository.QuestionRepository;
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
    private CacheService cacheService;

    @InjectMocks
    private QuestionService questionService;

    private Question sampleQuestion;
    private List<Question> sampleQuestions;

    @BeforeEach
    void setUp() {
        sampleQuestion = new Question();
        sampleQuestion.setId("1");
        sampleQuestion.setBook("Genesis");
        sampleQuestion.setChapter(1);
        sampleQuestion.setDifficulty(Question.Difficulty.easy);
        sampleQuestion.setType(Question.Type.multiple_choice_single);
        sampleQuestion.setContent("What is the first book of the Bible?");
        sampleQuestion.setOptions(Arrays.asList("Genesis", "Exodus", "Leviticus", "Numbers"));
        sampleQuestion.setCorrectAnswer(Arrays.asList(0));
        sampleQuestion.setIsActive(true);

        sampleQuestions = Arrays.asList(sampleQuestion);
        
        // Mock cache service to return empty by default (lenient to avoid unnecessary stubbing warnings)
        lenient().when(cacheService.getCachedQuestionList(any(), any())).thenReturn(java.util.Optional.empty());
        lenient().when(cacheService.getCachedQuestionOfTheDay(any(), any())).thenReturn(java.util.Optional.empty());
    }

    @Test
    void getRandomQuestions_WithValidParameters_ShouldReturnQuestions() {
        // Given
        when(questionRepository.countByIsActiveTrue()).thenReturn(1L);
        when(questionRepository.findByIsActiveTrue(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        // When
        List<Question> result = questionService.getRandomQuestions(null, null, 1, null);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Genesis", result.get(0).getBook());
        verify(questionRepository).countByIsActiveTrue();
        verify(questionRepository).findByIsActiveTrue(any(PageRequest.class));
    }

    @Test
    void getRandomQuestions_WithBookFilter_ShouldReturnFilteredQuestions() {
        // Given
        String book = "Genesis";
        when(questionRepository.countByBookAndIsActiveTrue(book)).thenReturn(1L);
        when(questionRepository.findByBookAndIsActiveTrue(eq(book), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        // When
        List<Question> result = questionService.getRandomQuestions(book, null, 1, null);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(questionRepository).countByBookAndIsActiveTrue(book);
        verify(questionRepository).findByBookAndIsActiveTrue(eq(book), any(PageRequest.class));
    }

    @Test
    void getRandomQuestions_WithDifficultyFilter_ShouldReturnFilteredQuestions() {
        // Given
        String difficulty = "easy";
        when(questionRepository.countByDifficultyAndIsActiveTrue(Question.Difficulty.easy)).thenReturn(1L);
        when(questionRepository.findByDifficultyAndIsActiveTrue(eq(Question.Difficulty.easy), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        // When
        List<Question> result = questionService.getRandomQuestions(null, difficulty, 1, null);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(questionRepository).countByDifficultyAndIsActiveTrue(Question.Difficulty.easy);
        verify(questionRepository).findByDifficultyAndIsActiveTrue(eq(Question.Difficulty.easy), any(PageRequest.class));
    }

    @Test
    void getRandomQuestions_WithExcludeIds_ShouldExcludeSpecifiedQuestions() {
        // Given
        List<String> excludeIds = Arrays.asList("1", "2");
        when(questionRepository.countByIsActiveTrue()).thenReturn(3L);
        when(questionRepository.findByIsActiveTrue(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        // When
        List<Question> result = questionService.getRandomQuestions(null, null, 1, excludeIds);

        // Then
        assertNotNull(result);
        verify(questionRepository).countByIsActiveTrue();
    }

    @Test
    void getRandomQuestions_WithZeroLimit_ShouldReturnEmptyList() {
        // When
        List<Question> result = questionService.getRandomQuestions(null, null, 0, null);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verifyNoInteractions(questionRepository);
    }

    @Test
    void getRandomQuestions_WithNoQuestionsAvailable_ShouldReturnEmptyList() {
        // Given
        when(questionRepository.countByIsActiveTrue()).thenReturn(0L);

        // When
        List<Question> result = questionService.getRandomQuestions(null, null, 1, null);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(questionRepository).countByIsActiveTrue();
        verify(questionRepository, never()).findByIsActiveTrue(any(PageRequest.class));
    }

    @Test
    void getQuestionOfTheDay_WithValidData_ShouldReturnQuestion() {
        // Given
        when(questionRepository.countByIsActiveTrue()).thenReturn(1L);
        when(questionRepository.findByIsActiveTrue(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        // When
        Question result = questionService.getQuestionOfTheDay("vi");

        // Then
        assertNotNull(result);
        assertEquals("Genesis", result.getBook());
        verify(questionRepository).countByIsActiveTrue();
        verify(questionRepository).findByIsActiveTrue(any(PageRequest.class));
    }

    @Test
    void getQuestionOfTheDay_WithNoQuestions_ShouldReturnNull() {
        // Given
        when(questionRepository.countByIsActiveTrue()).thenReturn(0L);

        // When
        Question result = questionService.getQuestionOfTheDay("vi");

        // Then
        assertNull(result);
        verify(questionRepository).countByIsActiveTrue();
        verify(questionRepository, never()).findByIsActiveTrue(any(PageRequest.class));
    }

    @Test
    void getQuestionOfTheDay_WithEmptyPage_ShouldReturnFirstAvailableQuestion() {
        // Given
        when(questionRepository.countByIsActiveTrue()).thenReturn(1L);
        when(questionRepository.findByIsActiveTrue(any(PageRequest.class)))
                .thenReturn(Page.empty());
        when(questionRepository.findByIsActiveTrue(PageRequest.of(0, 1)))
                .thenReturn(new PageImpl<>(sampleQuestions));

        // When
        Question result = questionService.getQuestionOfTheDay("vi");

        // Then
        assertNotNull(result);
        assertEquals("Genesis", result.getBook());
        verify(questionRepository).countByIsActiveTrue();
        verify(questionRepository).findByIsActiveTrue(any(PageRequest.class));
        verify(questionRepository).findByIsActiveTrue(PageRequest.of(0, 1));
    }
}
