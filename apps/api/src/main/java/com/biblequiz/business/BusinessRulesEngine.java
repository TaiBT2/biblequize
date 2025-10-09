package com.biblequiz.business;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Business Rules Engine for Bible Quiz Application
 * 
 * This class encapsulates all business logic and rules for the application.
 * It provides a centralized place to manage business rules and ensures
 * consistency across all services.
 */
@Service
public class BusinessRulesEngine {
    
    private static final Logger logger = LoggerFactory.getLogger(BusinessRulesEngine.class);
    
    // Business Rules Configuration
    private final Map<String, Object> businessRules = new ConcurrentHashMap<>();
    
    public BusinessRulesEngine() {
        initializeBusinessRules();
    }
    
    /**
     * Initialize all business rules for the application
     */
    private void initializeBusinessRules() {
        // User Management Rules
        businessRules.put("user.max_daily_sessions", 50);
        businessRules.put("user.max_concurrent_sessions", 5);
        businessRules.put("user.session_timeout_minutes", 30);
        businessRules.put("user.min_age_requirement", 13);
        
        // Question Management Rules
        businessRules.put("question.min_options_count", 2);
        businessRules.put("question.max_options_count", 6);
        businessRules.put("question.min_content_length", 10);
        businessRules.put("question.max_content_length", 1000);
        businessRules.put("question.time_limit_seconds", 30);
        businessRules.put("question.daily_limit_per_user", 100);
        
        // Scoring Rules
        businessRules.put("scoring.base_points", 10);
        businessRules.put("scoring.speed_bonus_multiplier", 0.1);
        businessRules.put("scoring.difficulty_multiplier.easy", 1.0);
        businessRules.put("scoring.difficulty_multiplier.medium", 1.5);
        businessRules.put("scoring.difficulty_multiplier.hard", 2.0);
        businessRules.put("scoring.streak_bonus_threshold", 5);
        businessRules.put("scoring.streak_bonus_multiplier", 0.2);
        
        // Ranking Rules
        businessRules.put("ranking.update_frequency_minutes", 15);
        businessRules.put("ranking.min_questions_for_ranking", 10);
        businessRules.put("ranking.leaderboard_size", 100);
        businessRules.put("ranking.season_duration_days", 30);
        
        // Room Management Rules
        businessRules.put("room.max_players", 10);
        businessRules.put("room.min_players_to_start", 2);
        businessRules.put("room.max_questions", 50);
        businessRules.put("room.min_questions", 5);
        businessRules.put("room.timeout_minutes", 60);
        
        // Achievement Rules
        businessRules.put("achievement.min_accuracy_percentage", 80.0);
        businessRules.put("achievement.min_streak_count", 10);
        businessRules.put("achievement.min_daily_questions", 20);
        
        // Security Rules
        businessRules.put("security.max_login_attempts", 5);
        businessRules.put("security.lockout_duration_minutes", 15);
        businessRules.put("security.password_min_length", 8);
        businessRules.put("security.session_max_duration_hours", 24);
        
        // Performance Rules
        businessRules.put("performance.max_concurrent_users", 10000);
        businessRules.put("performance.cache_ttl_seconds", 1800);
        businessRules.put("performance.database_connection_pool_size", 20);
        
        logger.info("Initialized {} business rules", businessRules.size());
    }
    
    /**
     * Get a business rule value
     */
    public <T> T getRule(String ruleName, Class<T> type) {
        Object value = businessRules.get(ruleName);
        if (value != null && type.isInstance(value)) {
            return type.cast(value);
        }
        throw new BusinessRuleException("Rule not found or invalid type: " + ruleName);
    }
    
    /**
     * Get a business rule value with default
     */
    public <T> T getRule(String ruleName, T defaultValue, Class<T> type) {
        try {
            return getRule(ruleName, type);
        } catch (BusinessRuleException e) {
            return defaultValue;
        }
    }
    
    /**
     * Update a business rule
     */
    public void updateRule(String ruleName, Object value) {
        businessRules.put(ruleName, value);
        logger.info("Updated business rule: {} = {}", ruleName, value);
    }
    
    /**
     * Validate user session creation
     */
    public BusinessRuleResult validateUserSessionCreation(String userId, int currentSessionCount) {
        int maxSessions = getRule("user.max_concurrent_sessions", Integer.class);
        
        if (currentSessionCount >= maxSessions) {
            return BusinessRuleResult.failure(
                "User has reached maximum concurrent sessions limit: " + maxSessions
            );
        }
        
        return BusinessRuleResult.success();
    }
    
    /**
     * Calculate question score based on business rules
     */
    public int calculateQuestionScore(QuestionScoreContext context) {
        double basePoints = getRule("scoring.base_points", Double.class);
        double difficultyMultiplier = getDifficultyMultiplier(context.getDifficulty());
        double speedBonus = calculateSpeedBonus(context.getResponseTime(), context.getTimeLimit());
        double streakBonus = calculateStreakBonus(context.getCurrentStreak());
        
        double totalScore = basePoints * difficultyMultiplier + speedBonus + streakBonus;
        
        logger.debug("Score calculation: base={}, difficulty={}, speed={}, streak={}, total={}", 
                basePoints, difficultyMultiplier, speedBonus, streakBonus, totalScore);
        
        return (int) Math.round(totalScore);
    }
    
    /**
     * Validate question content
     */
    public BusinessRuleResult validateQuestionContent(String content, List<String> options) {
        int minLength = getRule("question.min_content_length", Integer.class);
        int maxLength = getRule("question.max_content_length", Integer.class);
        int minOptions = getRule("question.min_options_count", Integer.class);
        int maxOptions = getRule("question.max_options_count", Integer.class);
        
        if (content.length() < minLength) {
            return BusinessRuleResult.failure("Question content too short. Minimum: " + minLength);
        }
        
        if (content.length() > maxLength) {
            return BusinessRuleResult.failure("Question content too long. Maximum: " + maxLength);
        }
        
        if (options.size() < minOptions) {
            return BusinessRuleResult.failure("Too few options. Minimum: " + minOptions);
        }
        
        if (options.size() > maxOptions) {
            return BusinessRuleResult.failure("Too many options. Maximum: " + maxOptions);
        }
        
        return BusinessRuleResult.success();
    }
    
    /**
     * Validate room creation
     */
    public BusinessRuleResult validateRoomCreation(RoomCreationContext context) {
        int maxPlayers = getRule("room.max_players", Integer.class);
        int minPlayers = getRule("room.min_players_to_start", Integer.class);
        int maxQuestions = getRule("room.max_questions", Integer.class);
        int minQuestions = getRule("room.min_questions", Integer.class);
        
        if (context.getMaxPlayers() > maxPlayers) {
            return BusinessRuleResult.failure("Too many players. Maximum: " + maxPlayers);
        }
        
        if (context.getMaxPlayers() < minPlayers) {
            return BusinessRuleResult.failure("Too few players. Minimum: " + minPlayers);
        }
        
        if (context.getQuestionCount() > maxQuestions) {
            return BusinessRuleResult.failure("Too many questions. Maximum: " + maxQuestions);
        }
        
        if (context.getQuestionCount() < minQuestions) {
            return BusinessRuleResult.failure("Too few questions. Minimum: " + minQuestions);
        }
        
        return BusinessRuleResult.success();
    }
    
    /**
     * Check if user is eligible for ranking
     */
    public boolean isEligibleForRanking(int totalQuestionsAnswered, double averageAccuracy) {
        int minQuestions = getRule("ranking.min_questions_for_ranking", Integer.class);
        double minAccuracy = getRule("achievement.min_accuracy_percentage", Double.class);
        
        return totalQuestionsAnswered >= minQuestions && averageAccuracy >= minAccuracy;
    }
    
    /**
     * Calculate difficulty multiplier
     */
    private double getDifficultyMultiplier(String difficulty) {
        String ruleName = "scoring.difficulty_multiplier." + difficulty.toLowerCase();
        return getRule(ruleName, 1.0, Double.class);
    }
    
    /**
     * Calculate speed bonus
     */
    private double calculateSpeedBonus(long responseTimeMs, int timeLimitSeconds) {
        double speedBonusMultiplier = getRule("scoring.speed_bonus_multiplier", Double.class);
        long timeLimitMs = timeLimitSeconds * 1000L;
        
        if (responseTimeMs < timeLimitMs) {
            double speedRatio = (double) (timeLimitMs - responseTimeMs) / timeLimitMs;
            return speedRatio * speedBonusMultiplier * 10; // Base points for speed bonus
        }
        
        return 0;
    }
    
    /**
     * Calculate streak bonus
     */
    private double calculateStreakBonus(int currentStreak) {
        int streakThreshold = getRule("scoring.streak_bonus_threshold", Integer.class);
        double streakMultiplier = getRule("scoring.streak_bonus_multiplier", Double.class);
        
        if (currentStreak >= streakThreshold) {
            return (currentStreak - streakThreshold + 1) * streakMultiplier * 10;
        }
        
        return 0;
    }
    
    /**
     * Get all business rules
     */
    public Map<String, Object> getAllRules() {
        return new HashMap<>(businessRules);
    }
    
    /**
     * Business Rule Result
     */
    public static class BusinessRuleResult {
        private final boolean success;
        private final String message;
        
        private BusinessRuleResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
        
        public static BusinessRuleResult success() {
            return new BusinessRuleResult(true, null);
        }
        
        public static BusinessRuleResult failure(String message) {
            return new BusinessRuleResult(false, message);
        }
        
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
    
    /**
     * Question Score Context
     */
    public static class QuestionScoreContext {
        private final String difficulty;
        private final long responseTime;
        private final int timeLimit;
        private final int currentStreak;
        
        public QuestionScoreContext(String difficulty, long responseTime, int timeLimit, int currentStreak) {
            this.difficulty = difficulty;
            this.responseTime = responseTime;
            this.timeLimit = timeLimit;
            this.currentStreak = currentStreak;
        }
        
        public String getDifficulty() { return difficulty; }
        public long getResponseTime() { return responseTime; }
        public int getTimeLimit() { return timeLimit; }
        public int getCurrentStreak() { return currentStreak; }
    }
    
    /**
     * Room Creation Context
     */
    public static class RoomCreationContext {
        private final int maxPlayers;
        private final int questionCount;
        
        public RoomCreationContext(int maxPlayers, int questionCount) {
            this.maxPlayers = maxPlayers;
            this.questionCount = questionCount;
        }
        
        public int getMaxPlayers() { return maxPlayers; }
        public int getQuestionCount() { return questionCount; }
    }
    
    /**
     * Business Rule Exception
     */
    public static class BusinessRuleException extends RuntimeException {
        public BusinessRuleException(String message) {
            super(message);
        }
    }
}
