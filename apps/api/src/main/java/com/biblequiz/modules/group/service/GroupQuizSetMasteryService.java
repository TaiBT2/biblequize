package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.entity.GroupQuizSetMastery;
import com.biblequiz.modules.group.repository.GroupQuizSetMasteryRepository;
import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Q-A SAFE: KHÔNG insert vào UserDailyProgress hay group leaderboard query.
 * Mastery là personal stats riêng biệt.
 */
@Service
public class GroupQuizSetMasteryService {

    @Autowired
    private GroupQuizSetMasteryRepository repository;

    @Autowired
    private GroupQuizSetRepository quizSetRepository;

    /**
     * Hook called sau khi user complete 1 solo practice session từ group quiz set.
     * @param correctQuestionIds set IDs câu đã trả lời ĐÚNG (không double-count)
     */
    @Transactional
    public GroupQuizSetMastery recordPracticeSession(String quizSetId, String userId,
                                                      Set<String> correctQuestionIds,
                                                      int sessionScore, double accuracyPct) {
        GroupQuizSetMastery m = repository.findByQuizSetIdAndUserId(quizSetId, userId)
                .orElseGet(() -> {
                    GroupQuizSetMastery fresh = new GroupQuizSetMastery();
                    fresh.setQuizSetId(quizSetId);
                    fresh.setUserId(userId);
                    fresh.setLearnedQuestionIds(new ArrayList<>());
                    return fresh;
                });

        // Union learned IDs (dedupe).
        Set<String> learned = new LinkedHashSet<>();
        if (m.getLearnedQuestionIds() != null) {
            for (Object o : m.getLearnedQuestionIds()) {
                if (o != null) learned.add(o.toString());
            }
        }
        if (correctQuestionIds != null) learned.addAll(correctQuestionIds);
        m.setLearnedQuestionIds(new ArrayList<>(learned));
        m.setQuestionsLearned(learned.size());
        m.setTotalAttempts((m.getTotalAttempts() == null ? 0 : m.getTotalAttempts()) + 1);
        m.setLastPracticedAt(LocalDateTime.now());

        if (sessionScore > (m.getBestScore() == null ? 0 : m.getBestScore())) {
            m.setBestScore(sessionScore);
            m.setBestAccuracy(BigDecimal.valueOf(accuracyPct).setScale(2, java.math.RoundingMode.HALF_UP));
        }

        // Check completed mastery
        if (Boolean.FALSE.equals(m.getCompletedMastery())) {
            quizSetRepository.findById(quizSetId).ifPresent(set -> {
                int total = set.getTotalQuestions() == null ? 0 : set.getTotalQuestions();
                if (total > 0 && learned.size() >= total) {
                    m.setCompletedMastery(true);
                    m.setCompletedMasteryAt(LocalDateTime.now());
                }
            });
        }

        return repository.save(m);
    }

    public Map<String, Object> getMastery(String quizSetId, String userId) {
        return repository.findByQuizSetIdAndUserId(quizSetId, userId)
                .map(GroupQuizSetMasteryService::toMap)
                .orElse(emptyMastery(quizSetId, userId));
    }

    public List<Map<String, Object>> getUserMasteriesInGroup(String userId, String groupId) {
        return repository.findByUserIdAndGroupId(userId, groupId).stream()
                .map(GroupQuizSetMasteryService::toMap).toList();
    }

    public static Map<String, Object> toMap(GroupQuizSetMastery m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("quizSetId", m.getQuizSetId());
        map.put("userId", m.getUserId());
        map.put("questionsLearned", m.getQuestionsLearned());
        map.put("totalAttempts", m.getTotalAttempts());
        map.put("bestScore", m.getBestScore());
        map.put("bestAccuracy", m.getBestAccuracy());
        map.put("lastPracticedAt", m.getLastPracticedAt());
        map.put("completedMastery", m.getCompletedMastery());
        map.put("completedMasteryAt", m.getCompletedMasteryAt());
        return map;
    }

    private static Map<String, Object> emptyMastery(String quizSetId, String userId) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", null);
        map.put("quizSetId", quizSetId);
        map.put("userId", userId);
        map.put("questionsLearned", 0);
        map.put("totalAttempts", 0);
        map.put("bestScore", 0);
        map.put("bestAccuracy", null);
        map.put("lastPracticedAt", null);
        map.put("completedMastery", false);
        map.put("completedMasteryAt", null);
        return map;
    }
}
