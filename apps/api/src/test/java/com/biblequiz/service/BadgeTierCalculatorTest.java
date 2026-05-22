package com.biblequiz.service;

import com.biblequiz.modules.coverage.service.BadgeTierCalculator;
import com.biblequiz.modules.coverage.service.BadgeTierCalculator.BadgeTier;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class BadgeTierCalculatorTest {

    private final BadgeTierCalculator calc = new BadgeTierCalculator();

    @Test
    void calculateTier_boundaries() {
        assertThat(calc.calculateTier(0)).isEqualTo(BadgeTier.NONE);
        assertThat(calc.calculateTier(20)).isEqualTo(BadgeTier.NONE);
        assertThat(calc.calculateTier(21)).isEqualTo(BadgeTier.HANH_HUONG);
        assertThat(calc.calculateTier(50)).isEqualTo(BadgeTier.HANH_HUONG);
        assertThat(calc.calculateTier(51)).isEqualTo(BadgeTier.TAN_TAM);
        assertThat(calc.calculateTier(65)).isEqualTo(BadgeTier.TAN_TAM);
        assertThat(calc.calculateTier(66)).isEqualTo(BadgeTier.TOAN_THU);
    }

    @Test
    void countCoveredBooks_countsOnlyAtOrAboveThreshold() {
        Map<String, Integer> coverage = new HashMap<>();
        coverage.put("Genesis", 4);   // covered
        coverage.put("Exodus", 12);   // covered
        coverage.put("Joel", 3);      // not covered
        coverage.put("Amos", 0);      // not covered
        assertThat(calc.countCoveredBooks(coverage)).isEqualTo(2);
    }

    @Test
    void countCoveredBooks_handlesNullAndEmpty() {
        assertThat(calc.countCoveredBooks(null)).isEqualTo(0);
        assertThat(calc.countCoveredBooks(new HashMap<>())).isEqualTo(0);
    }

    @Test
    void countCoveredBooks_skipsNullValues() {
        Map<String, Integer> coverage = new HashMap<>();
        coverage.put("Genesis", 4);
        coverage.put("Exodus", null);
        assertThat(calc.countCoveredBooks(coverage)).isEqualTo(1);
    }
}
