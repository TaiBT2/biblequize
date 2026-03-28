package com.biblequiz.modules.daily.service;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.infrastructure.service.CacheService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

/**
 * SPEC-v2 Daily Challenge: 5 fixed questions per day, same for all users.
 * Uses date as seed for deterministic question selection.
 * Guests can play (no auth required).
 */
@Service
public class DailyChallengeService {

    private static final int DAILY_QUESTION_COUNT = 5;
    private static final String CACHE_KEY_PREFIX = "daily_challenge:";

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private CacheService cacheService;

    /**
     * Get today's 5 challenge questions. Same questions for all users on the same day.
     */
    @SuppressWarnings("unchecked")
    public List<Question> getDailyQuestions(LocalDate date) {
        if (date == null) {
            date = LocalDate.now(ZoneOffset.UTC);
        }

        String cacheKey = CACHE_KEY_PREFIX + date.toString();
        Optional<List> cached = cacheService.get(cacheKey, List.class);
        if (cached.isPresent()) {
            return cached.get();
        }

        // Use date-based seed for deterministic selection
        long seed = date.toEpochDay();
        Random random = new Random(seed);

        long totalActive = questionRepository.countByIsActiveTrue();
        if (totalActive == 0) {
            return List.of();
        }

        // Select DAILY_QUESTION_COUNT unique random questions
        Set<Integer> selectedIndices = new HashSet<>();
        int maxAttempts = DAILY_QUESTION_COUNT * 3;
        int attempts = 0;

        while (selectedIndices.size() < DAILY_QUESTION_COUNT && selectedIndices.size() < totalActive && attempts < maxAttempts) {
            selectedIndices.add(random.nextInt((int) totalActive));
            attempts++;
        }

        List<Question> questions = new ArrayList<>();
        for (int index : selectedIndices) {
            var page = questionRepository.findByIsActiveTrue(PageRequest.of(index, 1));
            if (page.hasContent()) {
                questions.add(page.getContent().get(0));
            }
        }

        // Cache for 24 hours
        cacheService.put(cacheKey, questions, java.time.Duration.ofHours(24));

        return questions;
    }

    /**
     * Get today's daily questions (convenience method).
     */
    public List<Question> getTodayQuestions() {
        return getDailyQuestions(LocalDate.now(ZoneOffset.UTC));
    }

    /**
     * Check if a user has completed today's challenge.
     */
    public boolean hasCompletedToday(String userId) {
        String key = CACHE_KEY_PREFIX + "completed:" + userId + ":" + LocalDate.now(ZoneOffset.UTC);
        return cacheService.exists(key);
    }

    /**
     * Mark user as having completed today's challenge.
     */
    public void markCompleted(String userId, int score, int correctCount) {
        String dateStr = LocalDate.now(ZoneOffset.UTC).toString();
        String key = CACHE_KEY_PREFIX + "completed:" + userId + ":" + dateStr;
        Map<String, Object> result = Map.of(
                "score", score,
                "correct", correctCount,
                "total", DAILY_QUESTION_COUNT,
                "completedAt", System.currentTimeMillis());
        cacheService.put(key, result, java.time.Duration.ofHours(48));

        // Increment total completions for percentile calculation
        String countKey = CACHE_KEY_PREFIX + "count:" + dateStr;
        // Simple approach: store each user's score
        String scoresKey = CACHE_KEY_PREFIX + "scores:" + dateStr;
        // We'll compute percentile on read
    }

    public int getDailyQuestionCount() {
        return DAILY_QUESTION_COUNT;
    }
}
