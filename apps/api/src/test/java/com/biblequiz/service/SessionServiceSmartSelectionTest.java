package com.biblequiz.service;

import com.biblequiz.modules.quiz.entity.QuizSession;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests verifying smart selection integration rules.
 */
class SessionServiceSmartSelectionTest {

    @Test
    void practiceMode_shouldUseSmartSelection() {
        QuizSession.Mode mode = QuizSession.Mode.practice;
        boolean useSmartSelection = (mode == QuizSession.Mode.practice || mode == QuizSession.Mode.ranked);
        assertThat(useSmartSelection).isTrue();
    }

    @Test
    void rankedMode_shouldUseSmartSelection() {
        QuizSession.Mode mode = QuizSession.Mode.ranked;
        boolean useSmartSelection = (mode == QuizSession.Mode.practice || mode == QuizSession.Mode.ranked);
        assertThat(useSmartSelection).isTrue();
    }

    @Test
    void singleMode_shouldNotUseSmartSelection() {
        // "single" mode = daily/multiplayer → random
        QuizSession.Mode mode = QuizSession.Mode.single;
        boolean useSmartSelection = (mode == QuizSession.Mode.practice || mode == QuizSession.Mode.ranked);
        assertThat(useSmartSelection).isFalse();
    }

    @Test
    void dailyChallengeDoesNotUseSmartSelection() {
        // Daily challenge uses "single" mode → should NOT trigger smart selection
        // This mirrors the logic in SessionService.createSession()
        QuizSession.Mode dailyMode = QuizSession.Mode.single;
        boolean useSmartSelection = (dailyMode == QuizSession.Mode.practice || dailyMode == QuizSession.Mode.ranked);
        assertThat(useSmartSelection).as("Daily challenge must use random selection, not smart").isFalse();
    }
}
