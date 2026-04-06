package com.biblequiz.modules.ranked.service;

import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.ranked.model.RankTier;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserTierService {

    private final UserDailyProgressRepository dailyProgressRepository;

    public UserTierService(UserDailyProgressRepository dailyProgressRepository) {
        this.dailyProgressRepository = dailyProgressRepository;
    }

    /**
     * Get user's total all-time points.
     */
    public int getTotalPoints(String userId) {
        List<UserDailyProgress> progress = dailyProgressRepository.findByUserIdOrderByDateDesc(userId);
        return progress.stream()
                .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
                .sum();
    }

    /**
     * Get user's current tier (1-6).
     */
    public int getTierLevel(String userId) {
        int totalPoints = getTotalPoints(userId);
        return RankTier.fromPoints(totalPoints).ordinal() + 1;
    }

    /**
     * Get user's current RankTier enum.
     */
    public RankTier getTier(String userId) {
        return RankTier.fromPoints(getTotalPoints(userId));
    }
}
