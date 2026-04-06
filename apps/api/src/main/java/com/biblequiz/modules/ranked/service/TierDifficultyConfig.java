package com.biblequiz.modules.ranked.service;

import org.springframework.stereotype.Component;

@Component
public class TierDifficultyConfig {

    /**
     * Difficulty distribution by tier level.
     * Higher tier → more hard questions, shorter timer.
     */
    public DifficultyDistribution getDistribution(int tierLevel) {
        return switch (tierLevel) {
            case 1 -> new DifficultyDistribution(70, 25, 5, 30);
            case 2 -> new DifficultyDistribution(55, 35, 10, 28);
            case 3 -> new DifficultyDistribution(35, 45, 20, 25);
            case 4 -> new DifficultyDistribution(20, 50, 30, 23);
            case 5 -> new DifficultyDistribution(10, 40, 50, 20);
            case 6 -> new DifficultyDistribution(5, 35, 60, 18);
            default -> new DifficultyDistribution(50, 35, 15, 30);
        };
    }

    public record DifficultyDistribution(
            int easyPercent,
            int mediumPercent,
            int hardPercent,
            int timerSeconds
    ) {}
}
