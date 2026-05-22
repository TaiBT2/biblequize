package com.biblequiz.modules.coverage.service;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Pure calculator for end-of-season badge tier (SPEC_USER_v3.2 §7.14.2).
 * Thresholds locked 2026-05-21 — no side effects, no dependencies.
 */
@Component
public class BadgeTierCalculator {

    public enum BadgeTier {
        TOAN_THU,    // 66/66
        TAN_TAM,     // 51-65
        HANH_HUONG,  // 21-50
        NONE         // 1-20
    }

    /** Coverage threshold per book — mirrors {@link LiturgicalCoverageService#COVERAGE_THRESHOLD}. */
    private static final int COVERAGE_THRESHOLD = 4;

    /**
     * Badge tier from the count of books covered (≥ threshold answered).
     * Thresholds: 66 → TOAN_THU, 51-65 → TAN_TAM, 21-50 → HANH_HUONG, ≤20 → NONE.
     */
    public BadgeTier calculateTier(int booksCovered) {
        if (booksCovered >= 66) return BadgeTier.TOAN_THU;
        if (booksCovered >= 51) return BadgeTier.TAN_TAM;
        if (booksCovered >= 21) return BadgeTier.HANH_HUONG;
        return BadgeTier.NONE;
    }

    /** Counts books whose answered-count reached the coverage threshold. */
    public int countCoveredBooks(Map<String, Integer> bookCoverage) {
        if (bookCoverage == null) return 0;
        return (int) bookCoverage.values().stream()
                .filter(count -> count != null && count >= COVERAGE_THRESHOLD)
                .count();
    }
}
