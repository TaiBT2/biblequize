package com.biblequiz.service;

import com.biblequiz.entity.*;
import com.biblequiz.repository.*;
import org.springframework.data.domain.PageRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SessionService {

    private final QuizSessionRepository quizSessionRepository;
    private final QuizSessionQuestionRepository quizSessionQuestionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public SessionService(QuizSessionRepository quizSessionRepository,
                          QuizSessionQuestionRepository quizSessionQuestionRepository,
                          QuestionRepository questionRepository,
                          AnswerRepository answerRepository,
                          UserRepository userRepository,
                          ObjectMapper objectMapper) {
        this.quizSessionRepository = quizSessionRepository;
        this.quizSessionQuestionRepository = quizSessionQuestionRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> createSession(String ownerId, QuizSession.Mode mode, Map<String, Object> config) {
        User owner = userRepository.findById(ownerId)
                .orElseGet(() -> userRepository.findByEmail(ownerId)
                        .orElseGet(() -> createUserFromPrincipal(ownerId)));

        String sessionId = UUID.randomUUID().toString();
        String configJson;
        try {
            configJson = objectMapper.writeValueAsString(config);
        } catch (Exception e) {
            configJson = "{}";
        }
        QuizSession session = new QuizSession(sessionId, mode, owner, configJson);
        session.setStatus(QuizSession.Status.in_progress);
        quizSessionRepository.save(session);

        int questionCount = ((Number) config.getOrDefault("questionCount", 10)).intValue();
        String book = (String) config.getOrDefault("book", null);
        String difficultyStr = (String) config.getOrDefault("difficulty", null);
        Question.Difficulty difficulty = null;
        if (difficultyStr != null && !"all".equalsIgnoreCase(difficultyStr)) {
            difficulty = Question.Difficulty.valueOf(difficultyStr);
        }

        List<String> excludeIds = Collections.emptyList();
        List<Question> questions;
        if (book != null || difficulty != null) {
            questions = questionRepository.findRandomQuestionsWithFilters(book, difficulty, excludeIds, PageRequest.of(0, questionCount));
        } else {
            questions = questionRepository.findRandomQuestionsExcluding(excludeIds, PageRequest.of(0, questionCount));
        }

        int order = 0;
        for (Question q : questions) {
            QuizSessionQuestion qsq = new QuizSessionQuestion(UUID.randomUUID().toString(), session, q, order++, 30);
            quizSessionQuestionRepository.save(qsq);
        }

        session.setTotalQuestions(questions.size());
        quizSessionRepository.save(session);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("questions", mapToQuestionDTOs(questions));
        return result;
    }

    @Transactional
    public Map<String, Object> submitAnswer(String sessionId, String userId, String questionId, Object answerPayload, int clientElapsedMs) {
        QuizSession session = quizSessionRepository.findById(sessionId).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();

        Question question = questionRepository.findById(questionId).orElseThrow();

        Optional<Answer> existing = answerRepository.findBySessionIdAndQuestionIdAndUserId(sessionId, questionId, userId);
        if (existing.isPresent()) {
            return toAnswerResult(existing.get(), question);
        }

        boolean isCorrect = validateAnswer(question, answerPayload);
        int scoreDelta = isCorrect ? (10 + computeSpeedBonus(clientElapsedMs, 30)) : 0;

        String answerJson;
        try {
            answerJson = objectMapper.writeValueAsString(answerPayload);
        } catch (Exception e) {
            answerJson = "null";
        }
        Answer answer = new Answer(
                UUID.randomUUID().toString(),
                session,
                question,
                user,
                answerJson,
                isCorrect,
                clientElapsedMs,
                scoreDelta
        );
        answerRepository.save(answer);

        if (isCorrect) {
            session.setScore(Optional.ofNullable(session.getScore()).orElse(0) + scoreDelta);
            session.setCorrectAnswers(Optional.ofNullable(session.getCorrectAnswers()).orElse(0) + 1);
        }
        quizSessionRepository.save(session);

        QuizSessionQuestion qsq = quizSessionQuestionRepository.findBySessionIdAndQuestionId(sessionId, questionId);
        if (qsq != null) {
            qsq.setAnsweredAt(LocalDateTime.now());
            qsq.setIsCorrect(isCorrect);
            qsq.setScoreEarned(scoreDelta);
            quizSessionQuestionRepository.save(qsq);
        }

        return toAnswerResult(answer, question);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSession(String sessionId) {
        QuizSession session = quizSessionRepository.findById(sessionId).orElseThrow();
        List<QuizSessionQuestion> items = quizSessionQuestionRepository.findBySessionIdOrderByOrderIndex(sessionId);
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", session.getId());
        dto.put("mode", session.getMode().name());
        dto.put("status", session.getStatus().name());
        dto.put("score", session.getScore());
        dto.put("totalQuestions", session.getTotalQuestions());
        dto.put("correctAnswers", session.getCorrectAnswers());
        dto.put("questions", items.stream().map(i -> Map.of(
                "id", i.getQuestion().getId(),
                "order", i.getOrderIndex(),
                "timeLimitSec", i.getTimeLimitSec()
        )).toList());
        return dto;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getReview(String sessionId) {
        List<Answer> answers = answerRepository.findBySessionIdOrderByCreatedAt(sessionId);
        List<Map<String, Object>> review = new ArrayList<>();
        for (Answer a : answers) {
            Question q = a.getQuestion();
            Map<String, Object> item = new HashMap<>();
            item.put("questionId", q.getId());
            item.put("content", q.getContent());
            item.put("options", q.getOptions());
            item.put("correctAnswer", q.getCorrectAnswer());
            item.put("explanation", q.getExplanation());
            item.put("answer", a.getAnswer());
            item.put("isCorrect", a.getIsCorrect());
            item.put("elapsedMs", a.getElapsedMs());
            item.put("scoreEarned", a.getScoreEarned());
            review.add(item);
        }
        return Map.of("items", review);
    }

    private List<Map<String, Object>> mapToQuestionDTOs(List<Question> questions) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", q.getId());
            dto.put("book", q.getBook());
            dto.put("chapter", q.getChapter());
            dto.put("difficulty", q.getDifficulty().name());
            dto.put("content", q.getContent());
            dto.put("options", q.getOptions());
            dto.put("type", q.getType().name());
            dto.put("timeLimitSec", 30);
            dto.put("correctAnswer", q.getCorrectAnswer());
            dto.put("explanation", q.getExplanation());
            list.add(dto);
        }
        return list;
    }

    private User createUserFromPrincipal(String principalName) {
        String email = principalName;
        String name = principalName;
        if (principalName != null && principalName.contains("@")) {
            name = principalName.substring(0, principalName.indexOf('@'));
        }
        User user = new User(UUID.randomUUID().toString(), name, email, "google");
        return userRepository.save(user);
    }

    private int computeSpeedBonus(int elapsedMs, int timeLimitSec) {
        int remaining = Math.max(0, timeLimitSec * 1000 - elapsedMs);
        return (int) Math.floor(remaining / 500.0);
    }

    @SuppressWarnings("unchecked")
    private boolean validateAnswer(Question question, Object answerPayload) {
        Question.Type type = question.getType();
        if (type == Question.Type.true_false) {
            if (answerPayload instanceof Boolean) {
                boolean b = (Boolean) answerPayload;
                List<Integer> correct = question.getCorrectAnswer();
                return (b ? 1 : 0) == (correct != null && !correct.isEmpty() ? correct.get(0) : 0);
            }
            return false;
        }
        if (type == Question.Type.multiple_choice_single) {
            int chosen = answerPayload instanceof Number ? ((Number) answerPayload).intValue() : -1;
            List<Integer> correct = question.getCorrectAnswer();
            return correct != null && correct.size() == 1 && chosen == correct.get(0);
        }
        if (type == Question.Type.multiple_choice_multi) {
            if (!(answerPayload instanceof List<?>)) return false;
            List<?> raw = (List<?>) answerPayload;
            List<Integer> chosen = new ArrayList<>();
            for (Object o : raw) {
                if (o instanceof Number) chosen.add(((Number) o).intValue());
            }
            List<Integer> correct = new ArrayList<>(Optional.ofNullable(question.getCorrectAnswer()).orElse(Collections.emptyList()));
            Collections.sort(chosen);
            Collections.sort(correct);
            return chosen.equals(correct);
        }
        if (type == Question.Type.fill_in_blank) {
            String ans = String.valueOf(answerPayload).trim().toLowerCase();
            String expected = String.valueOf(Optional.ofNullable(question.getExplanation()).orElse(""))
                    .trim().toLowerCase();
            return Objects.equals(ans, expected);
        }
        return false;
    }

    private Map<String, Object> toAnswerResult(Answer answer, Question q) {
        Map<String, Object> res = new HashMap<>();
        res.put("isCorrect", answer.getIsCorrect());
        res.put("correctAnswer", q.getCorrectAnswer());
        res.put("scoreDelta", answer.getScoreEarned());
        res.put("explanation", q.getExplanation());
        return res;
    }

}


