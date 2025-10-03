package com.biblequiz.service;

import com.biblequiz.entity.*;
import com.biblequiz.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@Transactional
public class AchievementService {
    
    @Autowired
    private AchievementRepository achievementRepository;
    
    @Autowired
    private UserAchievementRepository userAchievementRepository;
    
    @Autowired
    private UserDailyProgressRepository udpRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public List<UserAchievement> getUserAchievements(User user) {
        return userAchievementRepository.findByUserOrderByUnlockedAtDesc(user);
    }
    
    public List<UserAchievement> getUnnotifiedAchievements(User user) {
        return userAchievementRepository.findByUserAndIsNotifiedFalse(user);
    }
    
    public void markAsNotified(UserAchievement userAchievement) {
        userAchievement.setIsNotified(true);
        userAchievementRepository.save(userAchievement);
    }
    
    public void checkAndUnlockAchievements(User user) {
        List<Achievement> allAchievements = achievementRepository.findByIsActiveTrueOrderByCategoryAscPointsAsc();
        
        for (Achievement achievement : allAchievements) {
            if (!userAchievementRepository.existsByUserAndAchievement(user, achievement)) {
                if (checkAchievementCriteria(user, achievement)) {
                    unlockAchievement(user, achievement);
                }
            }
        }
    }
    
    private boolean checkAchievementCriteria(User user, Achievement achievement) {
        String category = achievement.getCategory();
        
        switch (category) {
            case "quiz":
                return checkQuizAchievements(user, achievement);
            case "streak":
                return checkStreakAchievements(user, achievement);
            case "points":
                return checkPointsAchievements(user, achievement);
            case "books":
                return checkBooksAchievements(user, achievement);
            case "accuracy":
                return checkAccuracyAchievements(user, achievement);
            default:
                return false;
        }
    }
    
    private boolean checkQuizAchievements(User user, Achievement achievement) {
        String criteria = achievement.getCriteria();
        // Parse criteria JSON and check conditions
        // For now, implement basic checks
        
        if (achievement.getName().contains("First Quiz")) {
            return udpRepository.findByUserIdOrderByDateDesc(user.getId()).size() >= 1;
        }
        
        if (achievement.getName().contains("10 Quizzes")) {
            return udpRepository.findByUserIdOrderByDateDesc(user.getId()).size() >= 10;
        }
        
        if (achievement.getName().contains("50 Quizzes")) {
            return udpRepository.findByUserIdOrderByDateDesc(user.getId()).size() >= 50;
        }
        
        return false;
    }
    
    private boolean checkStreakAchievements(User user, Achievement achievement) {
        // Implement streak checking logic
        List<UserDailyProgress> progress = udpRepository.findByUserIdOrderByDateDesc(user.getId());
        
        if (achievement.getName().contains("3 Day Streak")) {
            return checkConsecutiveDays(progress, 3);
        }
        
        if (achievement.getName().contains("7 Day Streak")) {
            return checkConsecutiveDays(progress, 7);
        }
        
        return false;
    }
    
    private boolean checkPointsAchievements(User user, Achievement achievement) {
        List<UserDailyProgress> progress = udpRepository.findByUserIdOrderByDateDesc(user.getId());
        int totalPoints = progress.stream()
            .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
            .sum();
        
        if (achievement.getName().contains("1000 Points")) {
            return totalPoints >= 1000;
        }
        
        if (achievement.getName().contains("5000 Points")) {
            return totalPoints >= 5000;
        }
        
        return false;
    }
    
    private boolean checkBooksAchievements(User user, Achievement achievement) {
        List<UserDailyProgress> progress = udpRepository.findByUserIdOrderByDateDesc(user.getId());
        long uniqueBooks = progress.stream()
            .map(UserDailyProgress::getCurrentBook)
            .distinct()
            .count();
        
        if (achievement.getName().contains("5 Books")) {
            return uniqueBooks >= 5;
        }
        
        if (achievement.getName().contains("All Books")) {
            return uniqueBooks >= 10; // Assuming 10 books total
        }
        
        return false;
    }
    
    private boolean checkAccuracyAchievements(User user, Achievement achievement) {
        List<UserDailyProgress> progress = udpRepository.findByUserIdOrderByDateDesc(user.getId());
        
        if (progress.isEmpty()) return false;
        
        int totalQuestions = progress.stream()
            .mapToInt(udp -> udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0)
            .sum();
        
        int totalPoints = progress.stream()
            .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
            .sum();
        
        if (totalQuestions == 0) return false;
        
        double accuracy = (double) totalPoints / (totalQuestions * 10); // Assuming 10 points per correct answer
        
        if (achievement.getName().contains("80% Accuracy")) {
            return accuracy >= 0.8;
        }
        
        if (achievement.getName().contains("90% Accuracy")) {
            return accuracy >= 0.9;
        }
        
        return false;
    }
    
    private boolean checkConsecutiveDays(List<UserDailyProgress> progress, int requiredDays) {
        if (progress.size() < requiredDays) return false;
        
        LocalDate today = LocalDate.now();
        int consecutiveDays = 0;
        
        for (int i = 0; i < requiredDays; i++) {
            LocalDate checkDate = today.minusDays(i);
            boolean hasProgress = progress.stream()
                .anyMatch(udp -> udp.getDate().equals(checkDate));
            
            if (hasProgress) {
                consecutiveDays++;
            } else {
                break;
            }
        }
        
        return consecutiveDays >= requiredDays;
    }
    
    private void unlockAchievement(User user, Achievement achievement) {
        UserAchievement userAchievement = new UserAchievement(user, achievement);
        userAchievementRepository.save(userAchievement);
    }
    
    public Map<String, Object> getAchievementStats(User user) {
        List<UserAchievement> userAchievements = getUserAchievements(user);
        
        int totalPoints = userAchievements.stream()
            .mapToInt(ua -> ua.getAchievement().getPoints())
            .sum();
        
        int level = Math.max(1, totalPoints / 1000 + 1);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("level", level);
        stats.put("totalPoints", totalPoints);
        stats.put("achievementsCount", userAchievements.size());
        stats.put("highScore", totalPoints);
        
        return stats;
    }
}
