package com.biblequiz.modules.ranked.service;

import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.ranked.model.RankTier;
import com.biblequiz.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserTierService {

    private final UserDailyProgressRepository dailyProgressRepository;
    private final UserRepository userRepository;

    public UserTierService(UserDailyProgressRepository dailyProgressRepository,
                           UserRepository userRepository) {
        this.dailyProgressRepository = dailyProgressRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get user's effective all-time points for tier/progression:
     * ledger total minus the prestige offset (V66 / DECISIONS 2026-06-12).
     * Leaderboards intentionally do NOT use this — they aggregate the raw
     * per-day ledger by date range, which prestige no longer touches.
     */
    public int getTotalPoints(String userId) {
        int offset = userRepository.findById(userId)
                .map(u -> u.getPrestigeXpOffset() != null ? u.getPrestigeXpOffset() : 0)
                .orElse(0);
        // Clamp at 0: admin test-seeding (or any ledger rewrite) can leave the
        // ledger below the recorded offset.
        return Math.max(0, getLedgerPoints(userId) - offset);
    }

    /** Raw ledger total (no prestige offset) — used by PrestigeService to
     *  record the offset itself. */
    public int getLedgerPoints(String userId) {
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
