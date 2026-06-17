package com.biblequiz.modules.quiz.service;

import com.biblequiz.modules.quiz.dto.DifficultyDistribution;

/**
 * Resolves a user's tier-based difficulty distribution.
 *
 * <p>Abstraction owned by the {@code quiz} module so {@link SmartQuestionSelector}
 * depends on it instead of reaching into the {@code ranked} module
 * (UserTierService + TierDifficultyConfig). The {@code ranked} module supplies the
 * implementation — dependency points ranked → quiz, never the reverse.
 */
public interface TierDifficultyProvider {

    /** Difficulty distribution for the user's current tier. */
    DifficultyDistribution distributionFor(String userId);
}
