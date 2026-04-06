package com.biblequiz.modules.ranked.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class GameModeUnlockConfig {

    private static final Map<String, Integer> UNLOCK_REQUIREMENTS = Map.of(
            "PRACTICE", 1,
            "DAILY", 1,
            "RANKED", 2,
            "SPEED_RACE", 2,
            "BATTLE_ROYALE", 3,
            "TEAM_VS_TEAM", 4,
            "SUDDEN_DEATH", 5,
            "TOURNAMENT", 4
    );

    public Map<String, Integer> getUnlockRequirements() {
        return UNLOCK_REQUIREMENTS;
    }

    public boolean isUnlocked(String gameMode, int tierLevel) {
        Integer required = UNLOCK_REQUIREMENTS.get(gameMode);
        return required != null && tierLevel >= required;
    }

    public List<GameModeInfo> getModesForTier(int tierLevel) {
        return UNLOCK_REQUIREMENTS.entrySet().stream()
                .map(e -> new GameModeInfo(
                        e.getKey(),
                        e.getValue(),
                        tierLevel >= e.getValue()))
                .sorted((a, b) -> Integer.compare(a.requiredTier(), b.requiredTier()))
                .toList();
    }

    public record GameModeInfo(
            String mode,
            int requiredTier,
            boolean unlocked
    ) {}
}
