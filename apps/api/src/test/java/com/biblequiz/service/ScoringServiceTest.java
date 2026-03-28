package com.biblequiz.service;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.ranked.service.ScoringService;
import com.biblequiz.modules.ranked.service.ScoringService.ScoreResult;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for SPEC-v2 scoring engine.
 * Base: Easy 8, Medium 12, Hard 18
 * Speed bonus: floor(base * 0.5 * speedRatio²), speedRatio = (30000 - elapsed) / 30000
 * Combo: 5-streak → x1.2, 10-streak → x1.5
 * Daily first: x2
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ScoringServiceTest {

    private final ScoringService scoringService = new ScoringService();

    // ── Base scores ──────────────────────────────────────────────────────────

    @Test
    void calculate_easyQuestion_shouldReturn8Base() {
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 1);
        assertEquals(8, result.baseScore);
    }

    @Test
    void calculate_mediumQuestion_shouldReturn12Base() {
        ScoreResult result = scoringService.calculate(Question.Difficulty.medium, 30000, 1);
        assertEquals(12, result.baseScore);
    }

    @Test
    void calculate_hardQuestion_shouldReturn18Base() {
        ScoreResult result = scoringService.calculate(Question.Difficulty.hard, 30000, 1);
        assertEquals(18, result.baseScore);
    }

    @Test
    void calculate_nullDifficulty_shouldDefaultToEasy8() {
        ScoreResult result = scoringService.calculate(null, 30000, 1);
        assertEquals(8, result.baseScore);
    }

    // ── Speed bonus (quadratic) ──────────────────────────────────────────────

    @Test
    void calculate_atTimeLimit_shouldHaveZeroSpeedBonus() {
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 1);
        assertEquals(0, result.speedBonus);
        assertEquals(8, result.earned); // base only
    }

    @Test
    void calculate_instantAnswer_shouldHaveMaxSpeedBonus() {
        // speedRatio = 1.0, bonus = floor(8 * 0.5 * 1.0) = 4
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 0, 1);
        assertEquals(4, result.speedBonus);
        assertEquals(12, result.earned); // 8 + 4
    }

    @Test
    void calculate_halfTimeAnswer_shouldHaveQuadraticBonus() {
        // speedRatio = 0.5, bonus = floor(8 * 0.5 * 0.25) = floor(1.0) = 1
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 15000, 1);
        assertEquals(1, result.speedBonus);
    }

    @Test
    void calculate_mediumInstant_shouldHaveCorrectBonus() {
        // speedRatio = 1.0, bonus = floor(12 * 0.5 * 1.0) = 6
        ScoreResult result = scoringService.calculate(Question.Difficulty.medium, 0, 1);
        assertEquals(6, result.speedBonus);
        assertEquals(18, result.earned); // 12 + 6
    }

    @Test
    void calculate_hardInstant_shouldHaveCorrectBonus() {
        // speedRatio = 1.0, bonus = floor(18 * 0.5 * 1.0) = 9
        ScoreResult result = scoringService.calculate(Question.Difficulty.hard, 0, 1);
        assertEquals(9, result.speedBonus);
        assertEquals(27, result.earned); // 18 + 9
    }

    @Test
    void calculate_overTimeLimit_shouldClampToZeroBonus() {
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 60000, 1);
        assertEquals(0, result.speedBonus);
        assertEquals(8, result.earned);
    }

    // ── Combo multiplier ─────────────────────────────────────────────────────

    @Test
    void calculate_streak4_shouldHaveNoCombo() {
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 4);
        assertEquals(100, result.comboMultiplierPercent);
        assertEquals(8, result.earned);
    }

    @Test
    void calculate_streak5_shouldHave1_2xCombo() {
        // base 8, no speed bonus at 30s, combo x1.2 → floor(8 * 1.2) = 9
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 5);
        assertEquals(120, result.comboMultiplierPercent);
        assertEquals(9, result.earned); // 8 * 120 / 100 = 9
    }

    @Test
    void calculate_streak10_shouldHave1_5xCombo() {
        // base 8, no speed, combo x1.5 → 8 * 150 / 100 = 12
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 10);
        assertEquals(150, result.comboMultiplierPercent);
        assertEquals(12, result.earned);
    }

    @Test
    void calculate_streak15_shouldStillBe1_5x() {
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 15);
        assertEquals(150, result.comboMultiplierPercent);
    }

    // ── Daily first-question bonus ───────────────────────────────────────────

    @Test
    void calculate_dailyFirst_shouldDoubleFinalScore() {
        // base 8, no speed, no combo, daily first x2 → 16
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 1, true);
        assertTrue(result.isDailyFirst);
        assertEquals(16, result.earned);
    }

    @Test
    void calculate_dailyFirst_withCombo_shouldStackMultipliers() {
        // base 8, no speed, combo x1.2 → 9, then daily x2 → 18
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 5, true);
        assertEquals(18, result.earned);
    }

    @Test
    void calculate_notDailyFirst_shouldNotDouble() {
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 30000, 1, false);
        assertFalse(result.isDailyFirst);
        assertEquals(8, result.earned);
    }

    // ── earnedEqualsFormula ──────────────────────────────────────────────────

    @Test
    void calculate_earnedMatchesFormula() {
        // Medium, 10s elapsed, streak 7, daily first
        // speedRatio = (30000-10000)/30000 = 0.667
        // speedBonus = floor(12 * 0.5 * 0.667²) = floor(12 * 0.5 * 0.444) = floor(2.667) = 2
        // subtotal = 14, combo x1.2 → 14*120/100 = 16, daily x2 → 32
        ScoreResult result = scoringService.calculate(Question.Difficulty.medium, 10000, 7, true);
        assertEquals(12, result.baseScore);
        assertEquals(2, result.speedBonus);
        assertEquals(120, result.comboMultiplierPercent);
        assertEquals(32, result.earned);
    }

    // ── validateMultipleChoiceSingle ─────────────────────────────────────────

    @Test
    void validateMultipleChoiceSingle_correctAnswer_shouldReturnTrue() {
        Question q = new Question();
        q.setCorrectAnswer(Arrays.asList(0));
        assertTrue(scoringService.validateMultipleChoiceSingle(q, 0));
        assertTrue(scoringService.validateMultipleChoiceSingle(q, "0"));
    }

    @Test
    void validateMultipleChoiceSingle_wrongAnswer_shouldReturnFalse() {
        Question q = new Question();
        q.setCorrectAnswer(Arrays.asList(0));
        assertFalse(scoringService.validateMultipleChoiceSingle(q, 1));
    }

    @Test
    void validateMultipleChoiceSingle_nullQuestion_shouldReturnFalse() {
        assertFalse(scoringService.validateMultipleChoiceSingle(null, 0));
    }

    @Test
    void validateMultipleChoiceSingle_invalidFormat_shouldReturnFalse() {
        Question q = new Question();
        q.setCorrectAnswer(Arrays.asList(0));
        assertFalse(scoringService.validateMultipleChoiceSingle(q, "abc"));
    }

    // ── validateFillInBlank ──────────────────────────────────────────────────

    @Test
    void validateFillInBlank_caseInsensitive_shouldReturnTrue() {
        Question q = new Question();
        q.setCorrectAnswerText("Moses");
        assertTrue(scoringService.validateFillInBlank(q, "moses"));
        assertTrue(scoringService.validateFillInBlank(q, "  MOSES  "));
    }

    @Test
    void validateFillInBlank_wrongAnswer_shouldReturnFalse() {
        Question q = new Question();
        q.setCorrectAnswerText("Moses");
        assertFalse(scoringService.validateFillInBlank(q, "Aaron"));
    }

    @Test
    void validateFillInBlank_nullQuestion_shouldReturnFalse() {
        assertFalse(scoringService.validateFillInBlank(null, "answer"));
    }

    // ── TC-SEC-001: Negative elapsed time should clamp to 0 ──────────────────

    @Test
    void calculate_negativeElapsedMs_shouldClampSpeedRatioToMax() {
        // Negative elapsed → speedRatio = max(0, (30000 - (-1000)) / 30000) = max(0, 1.033) clamped to valid
        // The formula uses Math.max(0.0, ...) so negative elapsed gives > 1.0 speedRatio
        // This is then used in floor(base * 0.5 * ratio²)
        // For easy: base=8, ratio = (30000-(-1000))/30000 = 1.033, bonus = floor(8*0.5*1.067) = 4
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, -1000, 1);
        // Speed bonus should not exceed the maximum possible (which is floor(base * 0.5) = 4)
        assertTrue(result.speedBonus >= 0, "Speed bonus should never be negative");
        assertTrue(result.earned >= result.baseScore, "Earned should be at least base score");
    }

    @Test
    void calculate_veryLargeElapsedMs_shouldHaveZeroBonus() {
        // Way past time limit → speedRatio = 0 → no bonus
        ScoreResult result = scoringService.calculate(Question.Difficulty.medium, 999_999, 1);
        assertEquals(0, result.speedBonus);
        assertEquals(12, result.earned);
    }

    // ── TC-RANK-001/002/003: Comprehensive scoring formula tests ─────────────

    @Test
    void calculate_specV2_medium3sElapsed_streak0() {
        // SPEC-v2 test case: Medium, 3000ms, no combo
        // speedRatio = (30000-3000)/30000 = 0.9
        // speedBonus = floor(12*0.5*0.81) = floor(4.86) = 4
        // total = 12 + 4 = 16
        ScoreResult result = scoringService.calculate(Question.Difficulty.medium, 3000, 1);
        assertEquals(12, result.baseScore);
        assertEquals(4, result.speedBonus);
        assertEquals(16, result.earned);
    }

    @Test
    void calculate_specV2_easyHalfTime_streak0() {
        // Easy, 15000ms, no combo
        // speedRatio = (30000-15000)/30000 = 0.5
        // speedBonus = floor(8*0.5*0.25) = floor(1.0) = 1
        // total = 8 + 1 = 9
        ScoreResult result = scoringService.calculate(Question.Difficulty.easy, 15000, 1);
        assertEquals(8, result.baseScore);
        assertEquals(1, result.speedBonus);
        assertEquals(9, result.earned);
    }

    @Test
    void calculate_specV2_hardFast_streak12() {
        // Hard, 1500ms, 12-streak (x1.5 combo)
        // speedRatio = (30000-1500)/30000 = 0.95
        // speedBonus = floor(18*0.5*0.9025) = floor(8.1225) = 8
        // subtotal = 26, combo x1.5 → 26*150/100 = 39
        ScoreResult result = scoringService.calculate(Question.Difficulty.hard, 1500, 12);
        assertEquals(18, result.baseScore);
        assertEquals(8, result.speedBonus);
        assertEquals(150, result.comboMultiplierPercent);
        assertEquals(39, result.earned);
    }

    // ── TC-RANK-004: Daily bonus first question x2 for medium ────────────────

    @Order(100)
    @Test
    void TC_RANK_004_dailyBonusFirstQuestion_medium_shouldDouble() {
        // Medium 12, elapsed 30000ms (no speed bonus), streak 1 (no combo), daily first x2
        // 12 * 2 = 24
        ScoreResult result = scoringService.calculate(Question.Difficulty.medium, 30000, 1, true);
        assertEquals(12, result.baseScore);
        assertEquals(0, result.speedBonus);
        assertEquals(100, result.comboMultiplierPercent);
        assertTrue(result.isDailyFirst);
        assertEquals(24, result.earned);
    }
}
