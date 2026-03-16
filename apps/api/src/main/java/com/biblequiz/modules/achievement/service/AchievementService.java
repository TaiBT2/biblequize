package com.biblequiz.modules.achievement.service;

import com.biblequiz.modules.achievement.entity.Achievement;
import com.biblequiz.modules.achievement.entity.UserAchievement;
import com.biblequiz.modules.achievement.repository.AchievementRepository;
import com.biblequiz.modules.achievement.repository.UserAchievementRepository;
import com.biblequiz.modules.user.entity.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AchievementService {

    private static final Logger log = LoggerFactory.getLogger(AchievementService.class);

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    /**
     * Returns all achievements earned by this user.
     */
    public List<Map<String, Object>> getUserAchievements(String userId) {
        return userAchievementRepository.findByUserId(userId).stream().map(ua -> {
            Map<String, Object> m = new HashMap<>();
            Achievement a = ua.getAchievement();
            m.put("key", a.getKeyName());
            m.put("name", a.getName());
            m.put("description", a.getDescription());
            m.put("icon", a.getIcon());
            m.put("category", a.getCategory());
            m.put("earnedAt", ua.getEarnedAt() != null ? ua.getEarnedAt().toString() : null);
            return m;
        }).collect(Collectors.toList());
    }

    /**
     * Returns all achievements with earned status for a user.
     */
    public List<Map<String, Object>> getAllWithStatus(String userId) {
        List<Achievement> all = achievementRepository.findAll();
        Set<String> earned = userAchievementRepository.findByUserId(userId).stream()
                .map(ua -> ua.getAchievement().getId())
                .collect(Collectors.toSet());

        return all.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("key", a.getKeyName());
            m.put("name", a.getName());
            m.put("description", a.getDescription());
            m.put("icon", a.getIcon());
            m.put("category", a.getCategory());
            m.put("threshold", a.getThreshold());
            m.put("earned", earned.contains(a.getId()));
            return m;
        }).collect(Collectors.toList());
    }

    /**
     * Checks and awards achievements based on current stats.
     * Returns list of newly awarded achievement keys.
     */
    public List<String> checkAndAward(User user, int totalPoints, int totalQuestions,
                                       int currentStreak, int booksCompleted) {
        List<String> newlyAwarded = new ArrayList<>();

        // Persistent 1000 questions
        tryAward(user, "persistent_1000", totalQuestions >= 1000, newlyAwarded);

        // Perfect streak 20
        tryAward(user, "perfect_20", currentStreak >= 20, newlyAwarded);

        // Scholar — 10 books completed
        tryAward(user, "scholar_10", booksCompleted >= 10, newlyAwarded);

        // Tier-based achievements
        tryAward(user, "elder", totalPoints >= 8000, newlyAwarded);
        tryAward(user, "apostle", totalPoints >= 80000, newlyAwarded);

        return newlyAwarded;
    }

    private void tryAward(User user, String achievementKey, boolean condition, List<String> newlyAwarded) {
        if (!condition) return;
        if (userAchievementRepository.existsByUserIdAndAchievementKeyName(user.getId(), achievementKey)) return;

        achievementRepository.findByKeyName(achievementKey).ifPresent(achievement -> {
            UserAchievement ua = new UserAchievement(UUID.randomUUID().toString(), user, achievement);
            userAchievementRepository.save(ua);
            newlyAwarded.add(achievementKey);
            log.info("Achievement awarded: {} -> {}", user.getName(), achievementKey);
        });
    }
}
