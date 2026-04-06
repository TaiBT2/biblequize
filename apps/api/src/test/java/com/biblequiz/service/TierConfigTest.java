package com.biblequiz.service;

import com.biblequiz.modules.ranked.service.TierDifficultyConfig;
import com.biblequiz.modules.ranked.service.TierDifficultyConfig.DifficultyDistribution;
import com.biblequiz.modules.ranked.service.TierRewardsConfig;
import com.biblequiz.modules.ranked.service.TierRewardsConfig.TierRewards;
import com.biblequiz.modules.ranked.service.GameModeUnlockConfig;
import com.biblequiz.modules.ranked.service.GameModeUnlockConfig.GameModeInfo;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TierConfigTest {

    private final TierDifficultyConfig diffConfig = new TierDifficultyConfig();
    private final TierRewardsConfig rewardsConfig = new TierRewardsConfig();
    private final GameModeUnlockConfig unlockConfig = new GameModeUnlockConfig();

    // === Phase 2: Difficulty Distribution ===

    @Test
    void tier1_gets70PercentEasyQuestions() {
        DifficultyDistribution dist = diffConfig.getDistribution(1);
        assertThat(dist.easyPercent()).isEqualTo(70);
        assertThat(dist.timerSeconds()).isEqualTo(30);
    }

    @Test
    void tier6_gets60PercentHardQuestions() {
        DifficultyDistribution dist = diffConfig.getDistribution(6);
        assertThat(dist.hardPercent()).isEqualTo(60);
        assertThat(dist.timerSeconds()).isEqualTo(18);
    }

    @Test
    void timerDecreasesWithHigherTier() {
        int timer1 = diffConfig.getDistribution(1).timerSeconds();
        int timer6 = diffConfig.getDistribution(6).timerSeconds();
        assertThat(timer6).isLessThan(timer1);
    }

    @Test
    void difficultyPercentsAlwaysSumTo100() {
        for (int tier = 1; tier <= 6; tier++) {
            DifficultyDistribution dist = diffConfig.getDistribution(tier);
            assertThat(dist.easyPercent() + dist.mediumPercent() + dist.hardPercent()).isEqualTo(100);
        }
    }

    @Test
    void easyPercentDecreasesWithTier() {
        int easy1 = diffConfig.getDistribution(1).easyPercent();
        int easy6 = diffConfig.getDistribution(6).easyPercent();
        assertThat(easy6).isLessThan(easy1);
    }

    // === Phase 3: Rewards ===

    @Test
    void tier1_xpMultiplier_is1x() {
        assertThat(rewardsConfig.getRewards(1).xpMultiplier()).isEqualTo(1.0);
    }

    @Test
    void tier6_xpMultiplier_is2x() {
        assertThat(rewardsConfig.getRewards(6).xpMultiplier()).isEqualTo(2.0);
    }

    @Test
    void xpMultiplierIncreasesWithTier() {
        double prev = 0;
        for (int tier = 1; tier <= 6; tier++) {
            double mult = rewardsConfig.getRewards(tier).xpMultiplier();
            assertThat(mult).isGreaterThanOrEqualTo(prev);
            prev = mult;
        }
    }

    @Test
    void energyRegen_increasesWithTier() {
        assertThat(rewardsConfig.getRewards(1).energyRegenPerHour()).isEqualTo(20);
        assertThat(rewardsConfig.getRewards(6).energyRegenPerHour()).isEqualTo(35);
    }

    @Test
    void streakFreezes_increasesWithTier() {
        assertThat(rewardsConfig.getRewards(1).streakFreezesPerWeek()).isEqualTo(1);
        assertThat(rewardsConfig.getRewards(5).streakFreezesPerWeek()).isEqualTo(3);
    }

    // === Phase 4: Game Mode Unlock ===

    @Test
    void tier1_onlyPracticeAndDailyUnlocked() {
        List<GameModeInfo> modes = unlockConfig.getModesForTier(1);
        List<String> unlocked = modes.stream()
                .filter(GameModeInfo::unlocked)
                .map(GameModeInfo::mode)
                .toList();
        assertThat(unlocked).containsExactlyInAnyOrder("PRACTICE", "DAILY");
    }

    @Test
    void tier3_battleRoyaleUnlocked() {
        assertThat(unlockConfig.isUnlocked("BATTLE_ROYALE", 3)).isTrue();
        assertThat(unlockConfig.isUnlocked("BATTLE_ROYALE", 2)).isFalse();
    }

    @Test
    void tier6_allModesUnlocked() {
        List<GameModeInfo> modes = unlockConfig.getModesForTier(6);
        assertThat(modes).allMatch(GameModeInfo::unlocked);
    }

    @Test
    void rankedRequiresTier2() {
        assertThat(unlockConfig.isUnlocked("RANKED", 1)).isFalse();
        assertThat(unlockConfig.isUnlocked("RANKED", 2)).isTrue();
    }

    @Test
    void tournamentRequiresTier4() {
        assertThat(unlockConfig.isUnlocked("TOURNAMENT", 3)).isFalse();
        assertThat(unlockConfig.isUnlocked("TOURNAMENT", 4)).isTrue();
    }

    @Test
    void unknownModeIsNeverUnlocked() {
        assertThat(unlockConfig.isUnlocked("UNKNOWN_MODE", 6)).isFalse();
    }
}
