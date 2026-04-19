package com.biblequiz.service;

import com.biblequiz.modules.quiz.service.EarlyRankedUnlockPolicy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests for {@link EarlyRankedUnlockPolicy}.
 *
 * <p>Thresholds: need ≥10 total AND ≥80% accuracy.
 */
class EarlyRankedUnlockPolicyTest {

    @Test
    void belowMinQuestions_neverUnlocks() {
        // 9/9 = 100% but below 10-question minimum
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(9, 9));
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(0, 0));
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(5, 5));
    }

    @Test
    void atMinimum10Questions_requires80Percent() {
        assertTrue(EarlyRankedUnlockPolicy.shouldUnlock(8, 10));   // 80% exact
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(7, 10));  // 70% insufficient
        assertTrue(EarlyRankedUnlockPolicy.shouldUnlock(9, 10));   // 90%
        assertTrue(EarlyRankedUnlockPolicy.shouldUnlock(10, 10));  // 100%
    }

    @Test
    void largerSample_stillRespectsThreshold() {
        assertTrue(EarlyRankedUnlockPolicy.shouldUnlock(16, 20));  // 80%
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(15, 20)); // 75%
        assertTrue(EarlyRankedUnlockPolicy.shouldUnlock(40, 50));  // 80%
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(39, 50)); // 78%
    }

    @Test
    void defensiveHandlingOfInvalidInput() {
        // Negative correct count
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(-1, 10));
        // Correct > total (invalid)
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(15, 10));
    }

    @Test
    void largeNumbersDoNotOverflow() {
        // Ensure long arithmetic keeps this honest up to large sample counts
        assertTrue(EarlyRankedUnlockPolicy.shouldUnlock(800_000, 1_000_000));   // 80%
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(799_999, 1_000_000)); // just under
    }

    @Test
    void exactBoundaryCases() {
        // 8/10 = 80% — should unlock (inclusive)
        assertTrue(EarlyRankedUnlockPolicy.shouldUnlock(8, 10));
        // 4/5 = 80% — but only 5 total, fails MIN_QUESTIONS
        assertFalse(EarlyRankedUnlockPolicy.shouldUnlock(4, 5));
        // 80/100 = 80%
        assertTrue(EarlyRankedUnlockPolicy.shouldUnlock(80, 100));
    }
}
