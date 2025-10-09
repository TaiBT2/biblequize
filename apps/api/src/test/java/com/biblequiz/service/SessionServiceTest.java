package com.biblequiz.service;

import com.biblequiz.entity.*;
import com.biblequiz.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private QuizSessionRepository quizSessionRepository;
    @Mock
    private QuizSessionQuestionRepository quizSessionQuestionRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private AnswerRepository answerRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private QuestionService questionService;

    @InjectMocks
    private SessionService sessionService;

    private User sampleUser;
    private Question sampleQuestion;
    private QuizSession sampleSession;
    private Answer sampleAnswer;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("user1");
        sampleUser.setName("Test User");
        sampleUser.setEmail("test@example.com");

        sampleQuestion = new Question();
        sampleQuestion.setId("q1");
        sampleQuestion.setBook("Genesis");
        sampleQuestion.setChapter(1);
        sampleQuestion.setDifficulty(Question.Difficulty.easy);
        sampleQuestion.setType(Question.Type.multiple_choice_single);
        sampleQuestion.setContent("What is the first book of the Bible?");
        sampleQuestion.setOptions(Arrays.asList("Genesis", "Exodus", "Leviticus", "Numbers"));
        sampleQuestion.setCorrectAnswer(Arrays.asList(0));
        sampleQuestion.setIsActive(true);

        sampleSession = new QuizSession();
        sampleSession.setId("session1");
        sampleSession.setMode(QuizSession.Mode.practice);
        sampleSession.setOwner(sampleUser);
        sampleSession.setStatus(QuizSession.Status.in_progress);
        sampleSession.setScore(0);
        sampleSession.setTotalQuestions(1);
        sampleSession.setCorrectAnswers(0);

        sampleAnswer = new Answer();
        sampleAnswer.setId("answer1");
        sampleAnswer.setSession(sampleSession);
        sampleAnswer.setQuestion(sampleQuestion);
        sampleAnswer.setUser(sampleUser);
        sampleAnswer.setAnswer("0");
        sampleAnswer.setIsCorrect(true);
        sampleAnswer.setElapsedMs(5000);
        sampleAnswer.setScoreEarned(10);
    }

    @Test
    void createSession_WithValidData_ShouldCreateSession() throws Exception {
        // Given
        String ownerId = "user1";
        QuizSession.Mode mode = QuizSession.Mode.practice;
        Map<String, Object> config = new HashMap<>();
        config.put("questionCount", 1);
        config.put("book", "Genesis");
        config.put("difficulty", "easy");

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(sampleUser));
        when(objectMapper.writeValueAsString(config)).thenReturn("{}");
        when(questionService.getRandomQuestions("Genesis", "easy", 1, null))
                .thenReturn(Arrays.asList(sampleQuestion));
        when(quizSessionRepository.save(any(QuizSession.class))).thenReturn(sampleSession);
        when(quizSessionQuestionRepository.save(any(QuizSessionQuestion.class))).thenReturn(new QuizSessionQuestion());

        // When
        Map<String, Object> result = sessionService.createSession(ownerId, mode, config);

        // Then
        assertNotNull(result);
        assertNotNull(result.get("sessionId"));
        assertNotNull(result.get("questions"));
        
        verify(userRepository).findById(ownerId);
        verify(quizSessionRepository, times(2)).save(any(QuizSession.class));
        verify(quizSessionQuestionRepository).save(any(QuizSessionQuestion.class));
    }

    @Test
    void createSession_WithNonExistentUser_ShouldCreateNewUser() throws Exception {
        // Given
        String ownerId = "nonexistent@example.com";
        QuizSession.Mode mode = QuizSession.Mode.practice;
        Map<String, Object> config = new HashMap<>();
        config.put("questionCount", 1);

        when(userRepository.findById(ownerId)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(ownerId)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(objectMapper.writeValueAsString(config)).thenReturn("{}");
        when(questionService.getRandomQuestions(null, null, 1, null))
                .thenReturn(Arrays.asList(sampleQuestion));
        when(quizSessionRepository.save(any(QuizSession.class))).thenReturn(sampleSession);
        when(quizSessionQuestionRepository.save(any(QuizSessionQuestion.class))).thenReturn(new QuizSessionQuestion());

        // When
        Map<String, Object> result = sessionService.createSession(ownerId, mode, config);

        // Then
        assertNotNull(result);
        verify(userRepository).findById(ownerId);
        verify(userRepository).findByEmail(ownerId);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void submitAnswer_WithValidData_ShouldCreateAnswer() {
        // Given
        String sessionId = "session1";
        String userId = "user1";
        String questionId = "q1";
        Object answerPayload = 0;
        int clientElapsedMs = 5000;

        when(quizSessionRepository.findById(sessionId)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(sampleQuestion));
        when(answerRepository.findBySessionIdAndQuestionIdAndUserId(sessionId, questionId, userId))
                .thenReturn(Optional.empty());
        when(answerRepository.save(any(Answer.class))).thenReturn(sampleAnswer);
        when(quizSessionQuestionRepository.findBySessionIdAndQuestionId(sessionId, questionId))
                .thenReturn(new QuizSessionQuestion());

        // When
        Map<String, Object> result = sessionService.submitAnswer(sessionId, userId, questionId, answerPayload, clientElapsedMs);

        // Then
        assertNotNull(result);
        assertTrue((Boolean) result.get("isCorrect"));
        assertEquals(60, result.get("scoreDelta"));
        
        verify(quizSessionRepository).findById(sessionId);
        verify(userRepository).findById(userId);
        verify(questionRepository).findById(questionId);
        verify(answerRepository).save(any(Answer.class));
        verify(quizSessionRepository).save(any(QuizSession.class));
    }

    @Test
    void submitAnswer_WithExistingAnswer_ShouldReturnExistingResult() {
        // Given
        String sessionId = "session1";
        String userId = "user1";
        String questionId = "q1";
        Object answerPayload = 0;
        int clientElapsedMs = 5000;

        when(quizSessionRepository.findById(sessionId)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(sampleQuestion));
        when(answerRepository.findBySessionIdAndQuestionIdAndUserId(sessionId, questionId, userId))
                .thenReturn(Optional.of(sampleAnswer));

        // When
        Map<String, Object> result = sessionService.submitAnswer(sessionId, userId, questionId, answerPayload, clientElapsedMs);

        // Then
        assertNotNull(result);
        assertTrue((Boolean) result.get("isCorrect"));
        assertEquals(10, result.get("scoreDelta")); // Existing answer score
        
        verify(answerRepository, never()).save(any(Answer.class));
    }

    @Test
    void getSession_WithValidSessionId_ShouldReturnSessionData() {
        // Given
        String sessionId = "session1";
        QuizSessionQuestion qsq = new QuizSessionQuestion();
        qsq.setQuestion(sampleQuestion);
        qsq.setOrderIndex(0);
        qsq.setTimeLimitSec(30);

        when(quizSessionRepository.findById(sessionId)).thenReturn(Optional.of(sampleSession));
        when(quizSessionQuestionRepository.findBySessionIdOrderByOrderIndex(sessionId))
                .thenReturn(Arrays.asList(qsq));

        // When
        Map<String, Object> result = sessionService.getSession(sessionId);

        // Then
        assertNotNull(result);
        assertEquals("session1", result.get("id"));
        assertEquals("practice", result.get("mode"));
        assertEquals("in_progress", result.get("status"));
        assertEquals(0, result.get("score"));
        assertEquals(1, result.get("totalQuestions"));
        assertEquals(0, result.get("correctAnswers"));
        assertNotNull(result.get("questions"));
    }

    @Test
    void getReview_WithValidSessionId_ShouldReturnReviewData() {
        // Given
        String sessionId = "session1";
        when(quizSessionRepository.findById(sessionId)).thenReturn(Optional.of(sampleSession));
        when(answerRepository.findBySessionIdOrderByCreatedAt(sessionId))
                .thenReturn(Arrays.asList(sampleAnswer));

        // When
        Map<String, Object> result = sessionService.getReview(sessionId);

        // Then
        assertNotNull(result);
        assertNotNull(result.get("items"));
        assertNotNull(result.get("stats"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> stats = (Map<String, Object>) result.get("stats");
        assertEquals(1, stats.get("totalQuestions"));
        assertEquals(1, stats.get("correctAnswers"));
        assertEquals(10, stats.get("totalScore"));
    }

    @Test
    void submitAnswer_WithTrueFalseQuestion_ShouldValidateCorrectly() {
        // Given
        Question trueFalseQuestion = new Question();
        trueFalseQuestion.setId("tf1");
        trueFalseQuestion.setType(Question.Type.true_false);
        trueFalseQuestion.setCorrectAnswer(Arrays.asList(1)); // true

        String sessionId = "session1";
        String userId = "user1";
        String questionId = "tf1";
        Object answerPayload = true;
        int clientElapsedMs = 3000;

        when(quizSessionRepository.findById(sessionId)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(trueFalseQuestion));
        when(answerRepository.findBySessionIdAndQuestionIdAndUserId(sessionId, questionId, userId))
                .thenReturn(Optional.empty());
        when(answerRepository.save(any(Answer.class))).thenReturn(sampleAnswer);
        when(quizSessionQuestionRepository.findBySessionIdAndQuestionId(sessionId, questionId))
                .thenReturn(new QuizSessionQuestion());

        // When
        Map<String, Object> result = sessionService.submitAnswer(sessionId, userId, questionId, answerPayload, clientElapsedMs);

        // Then
        assertNotNull(result);
        assertTrue((Boolean) result.get("isCorrect"));
    }

    @Test
    void submitAnswer_WithMultipleChoiceMulti_ShouldValidateCorrectly() {
        // Given
        Question multiChoiceQuestion = new Question();
        multiChoiceQuestion.setId("mc1");
        multiChoiceQuestion.setType(Question.Type.multiple_choice_multi);
        multiChoiceQuestion.setCorrectAnswer(Arrays.asList(0, 2)); // first and third options

        String sessionId = "session1";
        String userId = "user1";
        String questionId = "mc1";
        Object answerPayload = Arrays.asList(0, 2);
        int clientElapsedMs = 4000;

        when(quizSessionRepository.findById(sessionId)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(multiChoiceQuestion));
        when(answerRepository.findBySessionIdAndQuestionIdAndUserId(sessionId, questionId, userId))
                .thenReturn(Optional.empty());
        when(answerRepository.save(any(Answer.class))).thenReturn(sampleAnswer);
        when(quizSessionQuestionRepository.findBySessionIdAndQuestionId(sessionId, questionId))
                .thenReturn(new QuizSessionQuestion());

        // When
        Map<String, Object> result = sessionService.submitAnswer(sessionId, userId, questionId, answerPayload, clientElapsedMs);

        // Then
        assertNotNull(result);
        assertTrue((Boolean) result.get("isCorrect"));
    }
}
