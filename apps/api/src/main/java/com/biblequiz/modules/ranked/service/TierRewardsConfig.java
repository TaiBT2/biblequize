package com.biblequiz.modules.ranked.service;

import org.springframework.stereotype.Component;

@Component
public class TierRewardsConfig {

    /**
     * Tier rewards: higher tier → more XP, faster energy regen, more streak freezes.
     */
    public TierRewards getRewards(int tierLevel) {
        return switch (tierLevel) {
            case 1 -> new TierRewards(1.0, 20, 1);
            case 2 -> new TierRewards(1.1, 22, 1);
            case 3 -> new TierRewards(1.2, 25, 2);
            case 4 -> new TierRewards(1.3, 28, 2);
            case 5 -> new TierRewards(1.5, 30, 3);
            case 6 -> new TierRewards(2.0, 35, 3);
            default -> new TierRewards(1.0, 20, 1);
        };
    }

    public record TierRewards(
            double xpMultiplier,
            int energyRegenPerHour,
            int streakFreezesPerWeek
    ) {}
}
