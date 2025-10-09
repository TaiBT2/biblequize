package com.biblequiz.service;

import com.biblequiz.entity.Question;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class CacheService {
    
    private static final Logger logger = LoggerFactory.getLogger(CacheService.class);
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    // Cache keys constants
    public static final String QUESTIONS_CACHE_PREFIX = "questions:";
    public static final String USER_SESSION_CACHE_PREFIX = "user:session:";
    public static final String LEADERBOARD_CACHE_PREFIX = "leaderboard:";
    public static final String USER_PROGRESS_CACHE_PREFIX = "user:progress:";
    public static final String QUESTION_OF_DAY_CACHE = "question:qotd:";
    
    // Default TTL values
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(30);
    private static final Duration QUESTIONS_TTL = Duration.ofHours(1);
    private static final Duration USER_SESSION_TTL = Duration.ofMinutes(15);
    private static final Duration LEADERBOARD_TTL = Duration.ofMinutes(5);
    private static final Duration QOTD_TTL = Duration.ofDays(1);
    
    public <T> void put(String key, T value) {
        put(key, value, DEFAULT_TTL);
    }
    
    public <T> void put(String key, T value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl.toMillis(), TimeUnit.MILLISECONDS);
            logger.debug("Cached value for key: {}", key);
        } catch (Exception e) {
            logger.error("Failed to cache value for key: {}", key, e);
        }
    }
    
    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                logger.debug("Cache hit for key: {}", key);
                return Optional.of(type.cast(value));
            }
            logger.debug("Cache miss for key: {}", key);
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Failed to get cached value for key: {}", key, e);
            return Optional.empty();
        }
    }
    
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            logger.debug("Deleted cache key: {}", key);
        } catch (Exception e) {
            logger.error("Failed to delete cache key: {}", key, e);
        }
    }
    
    public void deletePattern(String pattern) {
        try {
            redisTemplate.delete(redisTemplate.keys(pattern));
            logger.debug("Deleted cache keys matching pattern: {}", pattern);
        } catch (Exception e) {
            logger.error("Failed to delete cache keys for pattern: {}", pattern, e);
        }
    }
    
    public boolean exists(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            logger.error("Failed to check cache key existence: {}", key, e);
            return false;
        }
    }
    
    public void extendTTL(String key, Duration ttl) {
        try {
            redisTemplate.expire(key, ttl.toMillis(), TimeUnit.MILLISECONDS);
            logger.debug("Extended TTL for key: {}", key);
        } catch (Exception e) {
            logger.error("Failed to extend TTL for key: {}", key, e);
        }
    }
    
    // Specialized cache methods for different data types
    
    public void cacheQuestions(String book, String difficulty, Object questions) {
        String key = QUESTIONS_CACHE_PREFIX + book + ":" + difficulty;
        put(key, questions, QUESTIONS_TTL);
    }
    
    public <T> Optional<T> getCachedQuestions(String book, String difficulty, Class<T> type) {
        String key = QUESTIONS_CACHE_PREFIX + book + ":" + difficulty;
        return get(key, type);
    }
    
    @SuppressWarnings("unchecked")
    public Optional<List<Question>> getCachedQuestionList(String book, String difficulty) {
        String key = QUESTIONS_CACHE_PREFIX + book + ":" + difficulty;
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                logger.debug("Cache hit for key: {}", key);
                return Optional.of((List<Question>) value);
            }
            logger.debug("Cache miss for key: {}", key);
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Failed to get cached value for key: {}", key, e);
            return Optional.empty();
        }
    }
    
    public void cacheUserSession(String userId, Object sessionData) {
        String key = USER_SESSION_CACHE_PREFIX + userId;
        put(key, sessionData, USER_SESSION_TTL);
    }
    
    public <T> Optional<T> getCachedUserSession(String userId, Class<T> type) {
        String key = USER_SESSION_CACHE_PREFIX + userId;
        return get(key, type);
    }
    
    public void cacheLeaderboard(String period, Object leaderboard) {
        String key = LEADERBOARD_CACHE_PREFIX + period;
        put(key, leaderboard, LEADERBOARD_TTL);
    }
    
    public <T> Optional<T> getCachedLeaderboard(String period, Class<T> type) {
        String key = LEADERBOARD_CACHE_PREFIX + period;
        return get(key, type);
    }
    
    public void cacheQuestionOfTheDay(String language, Object question) {
        String key = QUESTION_OF_DAY_CACHE + language + ":" + java.time.LocalDate.now();
        put(key, question, QOTD_TTL);
    }
    
    public <T> Optional<T> getCachedQuestionOfTheDay(String language, Class<T> type) {
        String key = QUESTION_OF_DAY_CACHE + language + ":" + java.time.LocalDate.now();
        return get(key, type);
    }
    
    public void cacheUserProgress(String userId, Object progress) {
        String key = USER_PROGRESS_CACHE_PREFIX + userId;
        put(key, progress, Duration.ofMinutes(10));
    }
    
    public <T> Optional<T> getCachedUserProgress(String userId, Class<T> type) {
        String key = USER_PROGRESS_CACHE_PREFIX + userId;
        return get(key, type);
    }
    
    // Cache statistics
    public CacheStats getCacheStats() {
        try {
            // This would require Redis INFO command implementation
            // For now, return basic stats
            return new CacheStats(
                redisTemplate.getConnectionFactory().getConnection().dbSize(),
                System.currentTimeMillis()
            );
        } catch (Exception e) {
            logger.error("Failed to get cache stats", e);
            return new CacheStats(0, System.currentTimeMillis());
        }
    }
    
    public static class CacheStats {
        private final long keyCount;
        private final long timestamp;
        
        public CacheStats(long keyCount, long timestamp) {
            this.keyCount = keyCount;
            this.timestamp = timestamp;
        }
        
        public long getKeyCount() { return keyCount; }
        public long getTimestamp() { return timestamp; }
    }
}
