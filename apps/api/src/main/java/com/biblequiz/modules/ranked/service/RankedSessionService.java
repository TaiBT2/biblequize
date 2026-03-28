package com.biblequiz.modules.ranked.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
public class RankedSessionService {

    public static class Progress {
        public String date;
        public int livesRemaining = 100;  // SPEC-v2: energy (100/day, -5 per wrong)
        public int questionsCounted = 0;
        public int pointsToday = 0;
        public int cap = 100;             // SPEC-v2: 100 questions/day (was 500)
        public int dailyLives = 100;      // SPEC-v2: 100 energy
        public String currentBook = "Genesis";
        public int currentBookIndex = 0;
        public int questionsInCurrentBook = 0;
        public int correctAnswersInCurrentBook = 0;
        public boolean isPostCycle = false;
        public String currentDifficulty = "all";
        public int currentStreak = 0;

        public Progress() {}
    }

    private static final String KEY_PREFIX = "ranked:session:";
    private static final Duration SESSION_TTL = Duration.ofHours(26);

    private final RedisTemplate<String, Object> redisTemplate;

    public RankedSessionService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @SuppressWarnings("null")
    public void save(String sessionId, Progress progress) {
        redisTemplate.opsForValue().set(KEY_PREFIX + sessionId, progress, SESSION_TTL);
    }

    @SuppressWarnings("null")
    public Progress get(String sessionId) {
        Object value = redisTemplate.opsForValue().get(KEY_PREFIX + sessionId);
        if (value instanceof Progress p) {
            return p;
        }
        return null;
    }

    public Progress getOrCreate(String sessionId) {
        Progress p = get(sessionId);
        if (p == null) {
            p = new Progress();
            p.date = LocalDate.now(ZoneOffset.UTC).toString();
        }
        return p;
    }
}
