package com.biblequiz.modules.ranked.service;

import com.biblequiz.modules.quiz.dto.DifficultyDistribution;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SQS-1 + SQS-7 — pin SPEC §3.2 tier-difficulty distribution.
 *
 * The numbers below are the source of truth for ranked question selection;
 * a regression where someone flips one constant in
 * {@link TierDifficultyConfig#getDistribution(int)} would silently change
 * the difficulty mix every match. The table per BL-20 fix (2026-05-20):
 *
 * <pre>
 *  Tier  Easy  Medium  Hard  Timer(s)
 *   T1    70%   25%     5%    30
 *   T2    55%   35%    10%    28
 *   T3    35%   45%    20%    25
 *   T4    20%   50%    30%    23
 *   T5    10%   40%    50%    20
 *   T6     5%   35%    60%    18
 *  fallback (unknown tier): 50/35/15 @ 30s
 * </pre>
 *
 * Sums must equal 100. Timers strictly decrease with tier (harder + faster).
 */
class TierDifficultyConfigTest {

    private final TierDifficultyConfig cfg = new TierDifficultyConfig();

    @Test
    void tier1_distribution() {
        DifficultyDistribution d = cfg.getDistribution(1);
        assertEquals(70, d.easyPercent());
        assertEquals(25, d.mediumPercent());
        assertEquals(5,  d.hardPercent());
        assertEquals(30, d.timerSeconds());
    }

    @Test
    void tier2_distribution() {
        DifficultyDistribution d = cfg.getDistribution(2);
        assertEquals(55, d.easyPercent());
        assertEquals(35, d.mediumPercent());
        assertEquals(10, d.hardPercent());
        assertEquals(28, d.timerSeconds());
    }

    @Test
    void tier3_distribution() {
        DifficultyDistribution d = cfg.getDistribution(3);
        assertEquals(35, d.easyPercent());
        assertEquals(45, d.mediumPercent());
        assertEquals(20, d.hardPercent());
        assertEquals(25, d.timerSeconds());
    }

    @Test
    void tier4_distribution() {
        DifficultyDistribution d = cfg.getDistribution(4);
        assertEquals(20, d.easyPercent());
        assertEquals(50, d.mediumPercent());
        assertEquals(30, d.hardPercent());
        assertEquals(23, d.timerSeconds());
    }

    @Test
    void tier5_distribution() {
        DifficultyDistribution d = cfg.getDistribution(5);
        assertEquals(10, d.easyPercent());
        assertEquals(40, d.mediumPercent());
        assertEquals(50, d.hardPercent());
        assertEquals(20, d.timerSeconds());
    }

    @Test
    void tier6_distribution() {
        DifficultyDistribution d = cfg.getDistribution(6);
        assertEquals(5,  d.easyPercent());
        assertEquals(35, d.mediumPercent());
        assertEquals(60, d.hardPercent());
        assertEquals(18, d.timerSeconds());
    }

    @Test
    void unknownTier_fallsBackToBalancedMidTimer() {
        DifficultyDistribution d = cfg.getDistribution(99);
        assertEquals(50, d.easyPercent());
        assertEquals(35, d.mediumPercent());
        assertEquals(15, d.hardPercent());
        assertEquals(30, d.timerSeconds());
    }

    @Test
    void everyTier_percentagesSumTo100() {
        for (int tier = 1; tier <= 6; tier++) {
            DifficultyDistribution d = cfg.getDistribution(tier);
            int sum = d.easyPercent() + d.mediumPercent() + d.hardPercent();
            assertEquals(100, sum, "tier " + tier + " sum");
        }
    }

    @Test
    void timer_strictlyDecreasesWithTier() {
        // Harder tiers ship harder questions on a tighter clock per SPEC §3.2.
        for (int tier = 1; tier < 6; tier++) {
            int hi = cfg.getDistribution(tier).timerSeconds();
            int lo = cfg.getDistribution(tier + 1).timerSeconds();
            assertTrue(hi > lo,
                    "timer should drop from T" + tier + " (" + hi + ") to T" + (tier + 1) + " (" + lo + ")");
        }
    }
}
