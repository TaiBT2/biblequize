package com.biblequiz.modules.lifeline.service;

import com.biblequiz.api.dto.lifeline.HintResponse;
import com.biblequiz.api.dto.lifeline.LifelineStatusResponse;
import com.biblequiz.modules.lifeline.entity.LifelineType;
import com.biblequiz.modules.lifeline.entity.LifelineUsage;
import com.biblequiz.modules.lifeline.repository.LifelineUsageRepository;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.entity.QuizSessionQuestion;
import com.biblequiz.modules.quiz.repository.AnswerRepository;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.QuizSessionQuestionRepository;
import com.biblequiz.modules.quiz.repository.QuizSessionRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates lifeline usage during a quiz session: validates preconditions,
 * enforces quota, delegates option-picking to {@link HintAlgorithmService},
 * and persists the usage record.
 *
 * <h3>Preconditions enforced for {@code useHint}</h3>
 * <ol>
 *   <li>Session exists and is owned by the user.</li>
 *   <li>Session status is {@code in_progress}.</li>
 *   <li>Question is part of the session's question set.</li>
 *   <li>Question has not yet been answered by this user in this session.</li>
 *   <li>Question type is {@code multiple_choice_single} or
 *       {@code multiple_choice_multi} (hint is meaningless for true/false or
 *       fill-in-blank).</li>
 *   <li>Quota for the session mode has not been exhausted.</li>
 * </ol>
 *
 * <h3>Error signalling</h3>
 * <p>Validation failures throw {@link LifelineException} subclasses so the
 * controller can map them to specific HTTP status codes (404 / 403 / 409 /
 * 400) without leaking stack traces.
 */
@Service
public class LifelineService {

    private static final Logger logger = LoggerFactory.getLogger(LifelineService.class);

    // ── Exceptions ──

    public static abstract class LifelineException extends RuntimeException {
        protected LifelineException(String msg) { super(msg); }
    }

    /** 404 — session, question, or user not found. */
    public static class NotFoundException extends LifelineException {
        public NotFoundException(String msg) { super(msg); }
    }

    /** 403 — user doesn't own this session. */
    public static class ForbiddenException extends LifelineException {
        public ForbiddenException(String msg) { super(msg); }
    }

    /** 409 — state conflict (session not in progress, already answered, quota hit). */
    public static class ConflictException extends LifelineException {
        public ConflictException(String msg) { super(msg); }
    }

    /** 400 — request is valid-looking but semantically unsupported (e.g. hint on fill-blank). */
    public static class UnsupportedLifelineException extends LifelineException {
        public UnsupportedLifelineException(String msg) { super(msg); }
    }

    // ── Dependencies ──

    private final QuizSessionRepository sessionRepo;
    private final QuizSessionQuestionRepository sessionQuestionRepo;
    private final QuestionRepository questionRepo;
    private final AnswerRepository answerRepo;
    private final UserRepository userRepo;
    private final LifelineUsageRepository lifelineUsageRepo;
    private final LifelineConfigService configService;
    private final HintAlgorithmService hintAlgorithm;

    @Autowired
    public LifelineService(QuizSessionRepository sessionRepo,
                           QuizSessionQuestionRepository sessionQuestionRepo,
                           QuestionRepository questionRepo,
                           AnswerRepository answerRepo,
                           UserRepository userRepo,
                           LifelineUsageRepository lifelineUsageRepo,
                           LifelineConfigService configService,
                           HintAlgorithmService hintAlgorithm) {
        this.sessionRepo = sessionRepo;
        this.sessionQuestionRepo = sessionQuestionRepo;
        this.questionRepo = questionRepo;
        this.answerRepo = answerRepo;
        this.userRepo = userRepo;
        this.lifelineUsageRepo = lifelineUsageRepo;
        this.configService = configService;
        this.hintAlgorithm = hintAlgorithm;
    }

    // ── Public API ──

    @Transactional
    public HintResponse useHint(String sessionId, String userId, String questionId) {
        QuizSession session = loadSessionForUser(sessionId, userId);
        assertSessionInProgress(session);

        Question question = loadQuestionInSession(sessionId, questionId);
        assertNotAnswered(sessionId, questionId, userId);
        assertQuestionSupportsHint(question);

        int quota = configService.getHintQuota(session.getMode());
        if (quota == 0) {
            throw new ConflictException("Hint lifeline disabled for mode " + session.getMode());
        }

        long used = lifelineUsageRepo.countBySessionAndUserAndType(
                sessionId, userId, LifelineType.HINT);
        if (quota > 0 && used >= quota) {
            throw new ConflictException(
                    "Hint quota exhausted for session (" + used + "/" + quota + ")");
        }

        Set<Integer> alreadyEliminated = loadEliminatedOptions(sessionId, questionId, userId);
        HintAlgorithmService.HintSelection selection;
        try {
            selection = hintAlgorithm.selectOptionToEliminate(question, alreadyEliminated);
        } catch (HintAlgorithmService.NoOptionsToEliminateException e) {
            throw new ConflictException(e.getMessage());
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        LifelineUsage usage = new LifelineUsage(
                UUID.randomUUID().toString(),
                session,
                question,
                user,
                LifelineType.HINT,
                selection.getEliminatedOptionIndex());
        lifelineUsageRepo.save(usage);

        int remaining = quota < 0 ? -1 : (int) Math.max(0, quota - used - 1);
        logger.info("HINT used: session={}, user={}, question={}, eliminated={}, remaining={}, method={}",
                sessionId, userId, questionId, selection.getEliminatedOptionIndex(),
                remaining, selection.getMethod());

        return new HintResponse(
                selection.getEliminatedOptionIndex(),
                remaining,
                selection.getMethod().name());
    }

    @Transactional(readOnly = true)
    public LifelineStatusResponse getStatus(String sessionId, String userId, String questionId) {
        QuizSession session = loadSessionForUser(sessionId, userId);
        int quota = configService.getHintQuota(session.getMode());
        long used = lifelineUsageRepo.countBySessionAndUserAndType(
                sessionId, userId, LifelineType.HINT);
        int remaining = quota < 0 ? -1 : (int) Math.max(0, quota - used);

        List<Integer> eliminated = List.of();
        if (questionId != null && !questionId.isBlank()) {
            eliminated = new ArrayList<>(loadEliminatedOptions(sessionId, questionId, userId));
        }

        return new LifelineStatusResponse(
                remaining,
                quota,
                eliminated,
                session.getMode().name(),
                /* askOpinionAvailable */ false // v1 — feature deferred
        );
    }

    // ── Private helpers ──

    private QuizSession loadSessionForUser(String sessionId, String userId) {
        QuizSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found: " + sessionId));
        if (session.getOwner() == null || !userId.equals(session.getOwner().getId())) {
            throw new ForbiddenException("Session " + sessionId + " does not belong to user");
        }
        return session;
    }

    private void assertSessionInProgress(QuizSession session) {
        QuizSession.Status s = session.getStatus();
        if (s != QuizSession.Status.in_progress && s != QuizSession.Status.created) {
            throw new ConflictException("Session is not active (status=" + s + ")");
        }
    }

    private Question loadQuestionInSession(String sessionId, String questionId) {
        QuizSessionQuestion link = sessionQuestionRepo.findBySessionIdAndQuestionId(sessionId, questionId);
        if (link == null) {
            throw new NotFoundException(
                    "Question " + questionId + " is not part of session " + sessionId);
        }
        return questionRepo.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found: " + questionId));
    }

    private void assertNotAnswered(String sessionId, String questionId, String userId) {
        if (answerRepo.findBySessionIdAndQuestionIdAndUserId(sessionId, questionId, userId).isPresent()) {
            throw new ConflictException(
                    "Question " + questionId + " has already been answered in this session");
        }
    }

    private void assertQuestionSupportsHint(Question question) {
        Question.Type t = question.getType();
        if (t != Question.Type.multiple_choice_single && t != Question.Type.multiple_choice_multi) {
            throw new UnsupportedLifelineException(
                    "HINT lifeline is not supported for question type " + t);
        }
    }

    private Set<Integer> loadEliminatedOptions(String sessionId, String questionId, String userId) {
        return lifelineUsageRepo
                .findBySessionAndQuestionAndUser(sessionId, questionId, userId, LifelineType.HINT)
                .stream()
                .map(LifelineUsage::getEliminatedOptionIndex)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }
}
