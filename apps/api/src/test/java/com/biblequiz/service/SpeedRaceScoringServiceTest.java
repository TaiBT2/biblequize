package com.biblequiz.service;

import com.biblequiz.modules.room.service.SpeedRaceScoringService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class SpeedRaceScoringServiceTest {

    private final SpeedRaceScoringService service = new SpeedRaceScoringService();

    @Test
    void calculateScore_incorrectAnswer_shouldReturnZero() {
        assertEquals(0, service.calculateScore(false, 30, 5000));
    }

    @Test
    void calculateScore_instantAnswer_shouldReturnNearMax() {
        int score = service.calculateScore(true, 30, 1);
        assertTrue(score >= 149 && score <= 150);
    }

    @Test
    void calculateScore_halfTimeAnswer_shouldReturnAbout125() {
        int score = service.calculateScore(true, 30, 15000);
        assertEquals(125, score);
    }

    @Test
    void calculateScore_atTimeLimit_shouldReturn100() {
        int score = service.calculateScore(true, 30, 30000);
        assertEquals(100, score);
    }

    @Test
    void calculateScore_overTimeLimit_shouldReturn100() {
        int score = service.calculateScore(true, 30, 60000);
        assertEquals(100, score);
    }

    @Test
    void calculateScore_zeroResponseTime_shouldReturn100() {
        int score = service.calculateScore(true, 30, 0);
        assertEquals(100, score);
    }

    @Test
    void calculateScore_negativeResponseTime_shouldReturn100() {
        int score = service.calculateScore(true, 30, -100);
        assertEquals(100, score);
    }

    @ParameterizedTest
    @CsvSource({
            "true, 30, 1, 149",
            "true, 30, 10000, 133",
            "true, 30, 20000, 116",
            "true, 30, 29999, 100",
            "false, 30, 5000, 0",
    })
    void calculateScore_variousScenarios(boolean correct, int timeLimit, int responseMs, int expected) {
        assertEquals(expected, service.calculateScore(correct, timeLimit, responseMs));
    }
}
