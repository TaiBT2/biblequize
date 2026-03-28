package com.biblequiz.service;

import com.biblequiz.modules.ranked.model.RankTier;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RankTierTest {

    // ── TC-TIER-001: fromPoints returns correct tier for boundary values ─────

    @Order(1)
    @ParameterizedTest(name = "fromPoints({0}) should be {1}")
    @CsvSource({
            "0,      TAN_TIN_HUU",
            "999,    TAN_TIN_HUU",
            "1000,   NGUOI_TIM_KIEM",
            "4999,   NGUOI_TIM_KIEM",
            "5000,   MON_DO",
            "14999,  MON_DO",
            "15000,  HIEN_TRIET",
            "39999,  HIEN_TRIET",
            "40000,  TIEN_TRI",
            "99999,  TIEN_TRI",
            "100000, SU_DO"
    })
    void TC_TIER_001_fromPoints_shouldReturnCorrectTier(int points, RankTier expected) {
        assertEquals(expected, RankTier.fromPoints(points));
    }

    // ── TC-TIER-003: Tiers are in ascending order ────────────────────────────

    @Order(2)
    @Test
    void TC_TIER_003_tierValues_shouldBeInAscendingPointOrder() {
        RankTier[] tiers = RankTier.values();
        for (int i = 1; i < tiers.length; i++) {
            assertTrue(tiers[i].getRequiredPoints() > tiers[i - 1].getRequiredPoints(),
                    tiers[i].name() + " requiredPoints should be > " + tiers[i - 1].name());
        }
    }

    @Order(3)
    @Test
    void TC_TIER_003_fromPoints_neverDecreasesAsPointsIncrease() {
        RankTier previous = RankTier.fromPoints(0);
        for (int pts = 1; pts <= 120_000; pts += 500) {
            RankTier current = RankTier.fromPoints(pts);
            assertTrue(current.ordinal() >= previous.ordinal(),
                    "fromPoints(" + pts + ") = " + current + " should be >= " + previous);
            previous = current;
        }
    }

    // ── next() returns correct next tier ─────────────────────────────────────

    @Order(4)
    @Test
    void next_shouldReturnCorrectNextTier() {
        assertEquals(RankTier.NGUOI_TIM_KIEM, RankTier.TAN_TIN_HUU.next());
        assertEquals(RankTier.MON_DO, RankTier.NGUOI_TIM_KIEM.next());
        assertEquals(RankTier.HIEN_TRIET, RankTier.MON_DO.next());
        assertEquals(RankTier.TIEN_TRI, RankTier.HIEN_TRIET.next());
        assertEquals(RankTier.SU_DO, RankTier.TIEN_TRI.next());
    }

    @Order(5)
    @Test
    void next_onSuDo_shouldReturnNull() {
        assertNull(RankTier.SU_DO.next());
    }
}
