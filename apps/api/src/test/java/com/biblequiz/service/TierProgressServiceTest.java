package com.biblequiz.service;

import com.biblequiz.modules.ranked.service.TierProgressService;
import com.biblequiz.modules.ranked.service.TierProgressService.StarInfo;
import com.biblequiz.modules.ranked.service.TierProgressService.StarEvent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TierProgressServiceTest {

    private final TierProgressService service = new TierProgressService();

    // ── Star info: Tier 1 (0-999, 200 XP/star) ──

    @Test
    void tier1_zeroPoints_star0() {
        StarInfo info = service.getStarInfo(0);
        assertEquals(1, info.tierLevel());
        assertEquals("Tân Tín Hữu", info.tierName());
        assertEquals(0, info.starIndex());
        assertEquals(0, info.starXp());
        assertEquals(200, info.nextStarXp());
        assertEquals(0.0, info.starProgressPercent());
    }

    @Test
    void tier1_199points_star0_almostFull() {
        StarInfo info = service.getStarInfo(199);
        assertEquals(1, info.tierLevel());
        assertEquals(0, info.starIndex());
        assertEquals(99.5, info.starProgressPercent());
    }

    @Test
    void tier1_200points_star1() {
        StarInfo info = service.getStarInfo(200);
        assertEquals(1, info.tierLevel());
        assertEquals(1, info.starIndex());
        assertEquals(200, info.starXp());
        assertEquals(400, info.nextStarXp());
    }

    @Test
    void tier1_999points_star4() {
        StarInfo info = service.getStarInfo(999);
        assertEquals(1, info.tierLevel());
        assertEquals(4, info.starIndex());
        assertEquals(800, info.starXp());
        // Capped at tier boundary: 1000
        assertEquals(1000, info.nextStarXp());
    }

    // ── Star info: Tier 2 (1000-4999, 800 XP/star) ──

    @Test
    void tier2_1000points_star0() {
        StarInfo info = service.getStarInfo(1000);
        assertEquals(2, info.tierLevel());
        assertEquals("Người Tìm Kiếm", info.tierName());
        assertEquals(0, info.starIndex());
        assertEquals(1000, info.starXp());
        assertEquals(1800, info.nextStarXp());
    }

    @Test
    void tier2_4200points_star4() {
        StarInfo info = service.getStarInfo(4200);
        assertEquals(2, info.tierLevel());
        assertEquals(4, info.starIndex());
    }

    // ── Star info: Tier 6 (100000+, no stars) ──

    @Test
    void tier6_noStars() {
        StarInfo info = service.getStarInfo(100000);
        assertEquals(6, info.tierLevel());
        assertEquals("Sứ Đồ", info.tierName());
        assertEquals(0, info.starIndex());
        assertEquals(100.0, info.tierProgressPercent());
    }

    // ── Tier progress percent ──

    @Test
    void tierProgressPercent_midway() {
        // Tier 1 range: 0-999, at 500 = 50%
        StarInfo info = service.getStarInfo(500);
        assertEquals(50.0, info.tierProgressPercent());
    }

    @Test
    void tierProgressPercent_tier3_start() {
        StarInfo info = service.getStarInfo(5000);
        assertEquals(3, info.tierLevel());
        assertEquals(0.0, info.tierProgressPercent());
    }

    // ── Star boundary crossing ──

    @Test
    void starBoundary_crossed() {
        StarEvent event = service.checkStarBoundary(190, 210);
        assertNotNull(event);
        assertEquals(1, event.newStarIndex());
        assertEquals(30, event.bonusXp());
    }

    @Test
    void starBoundary_notCrossed() {
        StarEvent event = service.checkStarBoundary(100, 150);
        assertNull(event);
    }

    @Test
    void starBoundary_tierChange() {
        // Crossing from tier 1 to tier 2 (999 → 1010)
        StarEvent event = service.checkStarBoundary(999, 1010);
        assertNotNull(event);
        assertEquals(0, event.newStarIndex());
        assertEquals(30, event.bonusXp());
    }

    @Test
    void starBoundary_tier6_noEvent() {
        StarEvent event = service.checkStarBoundary(99999, 100001);
        assertNull(event);
    }

    @Test
    void starBoundary_pointsDecrease_noEvent() {
        StarEvent event = service.checkStarBoundary(500, 300);
        assertNull(event);
    }

    // ── Milestone detection ──

    @Test
    void milestone_50percent_detected() {
        // Tier 1: 0-999, 50% = 500
        String milestone = service.checkMilestone(490, 510);
        assertEquals("50", milestone);
    }

    @Test
    void milestone_90percent_detected() {
        // Tier 1: 0-999, 90% = 900
        String milestone = service.checkMilestone(890, 910);
        assertEquals("90", milestone);
    }

    @Test
    void milestone_90percent_overrides_50percent() {
        // If both crossed in same jump, 90% takes priority
        String milestone = service.checkMilestone(400, 950);
        assertEquals("90", milestone);
    }

    @Test
    void milestone_none() {
        String milestone = service.checkMilestone(100, 200);
        assertNull(milestone);
    }

    @Test
    void milestone_tier6_none() {
        // Tier 6 has no next tier, so no milestone
        String milestone = service.checkMilestone(100000, 110000);
        assertNull(milestone);
    }
}
