package com.biblequiz.service.lifeline;

import com.biblequiz.api.dto.lifeline.HintResponse;
import com.biblequiz.api.dto.lifeline.LifelineStatusResponse;
import com.biblequiz.modules.lifeline.entity.LifelineType;
import com.biblequiz.modules.lifeline.entity.LifelineUsage;
import com.biblequiz.modules.lifeline.repository.LifelineUsageRepository;
import com.biblequiz.modules.lifeline.service.HintAlgorithmService;
import com.biblequiz.modules.lifeline.service.HintAlgorithmService.HintSelection;
import com.biblequiz.modules.lifeline.service.HintAlgorithmService.Method;
import com.biblequiz.modules.lifeline.service.LifelineConfigService;
import com.biblequiz.modules.lifeline.service.LifelineService;
import com.biblequiz.modules.lifeline.service.LifelineService.ConflictException;
import com.biblequiz.modules.lifeline.service.LifelineService.ForbiddenException;
import com.biblequiz.modules.lifeline.service.LifelineService.NotFoundException;
import com.biblequiz.modules.lifeline.service.LifelineService.UnsupportedLifelineException;
import com.biblequiz.modules.quiz.entity.Answer;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.entity.QuizSessionQuestion;
import com.biblequiz.modules.quiz.repository.AnswerRepository;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.QuizSessionQuestionRepository;
import com.biblequiz.modules.quiz.repository.QuizSessionRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link LifelineService}.
 *
 * <p>Covers precondition validation (ownership, session state, question
 * membership, answered status, question type, quota) and the happy path.
 */
@ExtendWith(MockitoExtension.class)
class LifelineServiceTest {

    @Mock private QuizSessionRepository sessionRepo;
    @Mock private QuizSessionQuestionRepository sessionQuestionRepo;
    @Mock private QuestionRepository questionRepo;
    @Mock private AnswerRepository answerRepo;
    @Mock private UserRepository userRepo;
    @Mock private LifelineUsageRepository lifelineUsageRepo;
    @Mock private LifelineConfigService configService;
    @Mock private HintAlgorithmService hintAlgorithm;

    @InjectMocks private LifelineService service;

    private static final String SESSION_ID = "sess-1";
    private static final String USER_ID = "user-1";
    private static final String QUESTION_ID = "q-1";

    private User user;
    private QuizSession session;
    private Question question;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(USER_ID);

        session = new QuizSession();
        session.setId(SESSION_ID);
        session.setOwner(user);
        session.setMode(QuizSession.Mode.ranked);
        session.setStatus(QuizSession.Status.in_progress);

        question = new Question();
        question.setId(QUESTION_ID);
        question.setType(Question.Type.multiple_choice_single);
        question.setOptions(List.of("A", "B", "C", "D"));
        question.setCorrectAnswer(List.of(0));
    }

    private void wireHappyPath() {
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(sessionQuestionRepo.findBySessionIdAndQuestionId(SESSION_ID, QUESTION_ID))
                .thenReturn(new QuizSessionQuestion());
        when(questionRepo.findById(QUESTION_ID)).thenReturn(Optional.of(question));
        when(answerRepo.findBySessionIdAndQuestionIdAndUserId(SESSION_ID, QUESTION_ID, USER_ID))
                .thenReturn(Optional.empty());
        when(configService.getHintQuota(QuizSession.Mode.ranked)).thenReturn(2);
        when(lifelineUsageRepo.countBySessionAndUserAndType(SESSION_ID, USER_ID, LifelineType.HINT))
                .thenReturn(0L);
        when(lifelineUsageRepo.findBySessionAndQuestionAndUser(
                SESSION_ID, QUESTION_ID, USER_ID, LifelineType.HINT))
                .thenReturn(List.of());
        when(hintAlgorithm.selectOptionToEliminate(any(Question.class), anySet()))
                .thenReturn(new HintSelection(2, Method.RANDOM));
        when(userRepo.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    // ── Happy path ───────────────────────────────────────────────────

    @Test
    void useHint_happyPath_returnsEliminatedIndexAndDecrementsRemaining() {
        wireHappyPath();

        HintResponse response = service.useHint(SESSION_ID, USER_ID, QUESTION_ID);

        assertEquals(2, response.getEliminatedOptionIndex());
        assertEquals(1, response.getHintsRemaining()); // 2 quota - 1 used = 1 remaining
        assertEquals("RANDOM", response.getMethod());
        verify(lifelineUsageRepo).save(any(LifelineUsage.class));
    }

    @Test
    void useHint_unlimitedQuota_returnsMinusOneRemaining() {
        wireHappyPath();
        when(configService.getHintQuota(any())).thenReturn(-1);

        HintResponse response = service.useHint(SESSION_ID, USER_ID, QUESTION_ID);

        assertEquals(-1, response.getHintsRemaining());
    }

    // ── Precondition failures ────────────────────────────────────────

    @Test
    void useHint_sessionNotFound_throwsNotFound() {
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    @Test
    void useHint_wrongOwner_throwsForbidden() {
        User other = new User();
        other.setId("user-other");
        session.setOwner(other);
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));

        assertThrows(ForbiddenException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    @Test
    void useHint_sessionCompleted_throwsConflict() {
        session.setStatus(QuizSession.Status.completed);
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));

        assertThrows(ConflictException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    @Test
    void useHint_sessionAbandoned_throwsConflict() {
        session.setStatus(QuizSession.Status.abandoned);
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));

        assertThrows(ConflictException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    @Test
    void useHint_questionNotInSession_throwsNotFound() {
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(sessionQuestionRepo.findBySessionIdAndQuestionId(SESSION_ID, QUESTION_ID))
                .thenReturn(null);

        assertThrows(NotFoundException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    @Test
    void useHint_alreadyAnswered_throwsConflict() {
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(sessionQuestionRepo.findBySessionIdAndQuestionId(SESSION_ID, QUESTION_ID))
                .thenReturn(new QuizSessionQuestion());
        when(questionRepo.findById(QUESTION_ID)).thenReturn(Optional.of(question));
        when(answerRepo.findBySessionIdAndQuestionIdAndUserId(SESSION_ID, QUESTION_ID, USER_ID))
                .thenReturn(Optional.of(new Answer()));

        assertThrows(ConflictException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    @Test
    void useHint_unsupportedQuestionType_throwsUnsupported() {
        question.setType(Question.Type.fill_in_blank);
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(sessionQuestionRepo.findBySessionIdAndQuestionId(SESSION_ID, QUESTION_ID))
                .thenReturn(new QuizSessionQuestion());
        when(questionRepo.findById(QUESTION_ID)).thenReturn(Optional.of(question));
        when(answerRepo.findBySessionIdAndQuestionIdAndUserId(SESSION_ID, QUESTION_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThrows(UnsupportedLifelineException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    @Test
    void useHint_quotaExhausted_throwsConflict() {
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(sessionQuestionRepo.findBySessionIdAndQuestionId(SESSION_ID, QUESTION_ID))
                .thenReturn(new QuizSessionQuestion());
        when(questionRepo.findById(QUESTION_ID)).thenReturn(Optional.of(question));
        when(answerRepo.findBySessionIdAndQuestionIdAndUserId(SESSION_ID, QUESTION_ID, USER_ID))
                .thenReturn(Optional.empty());
        when(configService.getHintQuota(QuizSession.Mode.ranked)).thenReturn(2);
        when(lifelineUsageRepo.countBySessionAndUserAndType(SESSION_ID, USER_ID, LifelineType.HINT))
                .thenReturn(2L);

        assertThrows(ConflictException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    @Test
    void useHint_quotaZero_throwsConflict() {
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(sessionQuestionRepo.findBySessionIdAndQuestionId(SESSION_ID, QUESTION_ID))
                .thenReturn(new QuizSessionQuestion());
        when(questionRepo.findById(QUESTION_ID)).thenReturn(Optional.of(question));
        when(answerRepo.findBySessionIdAndQuestionIdAndUserId(SESSION_ID, QUESTION_ID, USER_ID))
                .thenReturn(Optional.empty());
        when(configService.getHintQuota(QuizSession.Mode.ranked)).thenReturn(0);

        assertThrows(ConflictException.class,
                () -> service.useHint(SESSION_ID, USER_ID, QUESTION_ID));
    }

    // ── Status endpoint ──────────────────────────────────────────────

    @Test
    void getStatus_returnsRemainingAndEliminatedOptions() {
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(configService.getHintQuota(QuizSession.Mode.ranked)).thenReturn(2);
        when(lifelineUsageRepo.countBySessionAndUserAndType(SESSION_ID, USER_ID, LifelineType.HINT))
                .thenReturn(1L);

        LifelineUsage prior = new LifelineUsage();
        prior.setEliminatedOptionIndex(3);
        when(lifelineUsageRepo.findBySessionAndQuestionAndUser(
                SESSION_ID, QUESTION_ID, USER_ID, LifelineType.HINT))
                .thenReturn(List.of(prior));

        LifelineStatusResponse status = service.getStatus(SESSION_ID, USER_ID, QUESTION_ID);

        assertEquals(1, status.getHintsRemaining());
        assertEquals(2, status.getHintQuota());
        assertEquals(List.of(3), status.getEliminatedOptions());
        assertEquals("ranked", status.getMode());
        assertFalse(status.isAskOpinionAvailable(), "v1 — askOpinion must be disabled");
    }

    @Test
    void getStatus_nullQuestionId_returnsEmptyEliminated() {
        when(sessionRepo.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(configService.getHintQuota(any())).thenReturn(2);
        when(lifelineUsageRepo.countBySessionAndUserAndType(any(), any(), any())).thenReturn(0L);

        LifelineStatusResponse status = service.getStatus(SESSION_ID, USER_ID, null);

        assertTrue(status.getEliminatedOptions().isEmpty());
    }
}
