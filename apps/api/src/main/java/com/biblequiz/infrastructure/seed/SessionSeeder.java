package com.biblequiz.infrastructure.seed;

import com.biblequiz.modules.quiz.entity.Answer;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.repository.AnswerRepository;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.QuizSessionRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Profile("!prod")
public class SessionSeeder {

    private static final Logger log = LoggerFactory.getLogger(SessionSeeder.class);
    @Autowired private UserRepository userRepository;
    @Autowired private QuizSessionRepository sessionRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private AnswerRepository answerRepository;

    public int seed() {
        List<User> testUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().endsWith("@biblequiz.test"))
                .filter(u -> !"ADMIN".equalsIgnoreCase(u.getRole()))
                .toList();
        if (testUsers.isEmpty()) return 0;

        // Check existing
        long existing = sessionRepository.findByOwnerIdOrderByCreatedAtDesc(testUsers.get(0).getId(), PageRequest.of(0, 1)).getTotalElements();
        if (existing > 0) {
            log.info("SessionSeeder: already seeded, skipping");
            return 0;
        }

        List<Question> allQuestions = questionRepository.findAll().stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsActive()))
                .toList();
        if (allQuestions.isEmpty()) {
            log.warn("SessionSeeder: no active questions, skipping");
            return 0;
        }

        int count = 0;
        for (User user : testUsers) {
            for (int i = 0; i < 5; i++) count += createSession(user, QuizSession.Mode.ranked, allQuestions, 10);
            for (int i = 0; i < 3; i++) count += createSession(user, QuizSession.Mode.practice, allQuestions, 10);
        }

        log.info("SessionSeeder: created {} sessions with answers", count);
        return count;
    }

    private int createSession(User user, QuizSession.Mode mode, List<Question> allQuestions, int numQ) {
        LocalDateTime date = UserSeeder.randomRecent(30);
        int correct = ThreadLocalRandom.current().nextInt(3, numQ + 1);
        int score = correct * ThreadLocalRandom.current().nextInt(8, 18);

        QuizSession session = new QuizSession(UUID.randomUUID().toString(), mode, user, null);
        session.setStatus(QuizSession.Status.completed);
        session.setTotalQuestions(numQ);
        session.setCorrectAnswers(correct);
        session.setScore(score);
        session.setCreatedAt(date);
        session.setStartedAt(date);
        session.setEndedAt(date.plusMinutes(ThreadLocalRandom.current().nextInt(3, 8)));
        sessionRepository.save(session);

        List<Question> picked = pickRandom(allQuestions, numQ);
        for (int i = 0; i < picked.size(); i++) {
            Answer a = new Answer(UUID.randomUUID().toString(), session, picked.get(i), user,
                    String.valueOf(ThreadLocalRandom.current().nextInt(0, 4)),
                    i < correct, ThreadLocalRandom.current().nextInt(2000, 25000),
                    i < correct ? ThreadLocalRandom.current().nextInt(8, 18) : 0);
            a.setCreatedAt(date.plusSeconds(i * 30L));
            answerRepository.save(a);
        }
        return 1;
    }

    private <T> List<T> pickRandom(List<T> list, int n) {
        List<T> copy = new ArrayList<>(list);
        Collections.shuffle(copy);
        return copy.subList(0, Math.min(n, copy.size()));
    }

    public void clear() {
        List<User> testUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().endsWith("@biblequiz.test"))
                .toList();
        for (User u : testUsers) {
            sessionRepository.findByOwnerIdAndStatus(u.getId(), QuizSession.Status.completed)
                    .forEach(s -> {
                        answerRepository.deleteBySessionId(s.getId());
                        sessionRepository.delete(s);
                    });
        }
        log.info("SessionSeeder: cleared");
    }
}
