package com.biblequiz.modules.ranked.service;

import com.biblequiz.modules.quiz.dto.DifficultyDistribution;
import com.biblequiz.modules.quiz.service.TierDifficultyProvider;
import org.springframework.stereotype.Service;

/**
 * {@code ranked}-module implementation of the {@code quiz}-module
 * {@link TierDifficultyProvider}: resolves a user's tier from cumulative points
 * ({@link UserTierService}) then maps it to the difficulty mix
 * ({@link TierDifficultyConfig}). Keeps the module dependency pointing
 * ranked → quiz so SmartQuestionSelector stays free of ranked imports.
 */
@Service
public class RankedTierDifficultyProvider implements TierDifficultyProvider {

    private final UserTierService userTierService;
    private final TierDifficultyConfig tierDifficultyConfig;

    public RankedTierDifficultyProvider(UserTierService userTierService,
                                        TierDifficultyConfig tierDifficultyConfig) {
        this.userTierService = userTierService;
        this.tierDifficultyConfig = tierDifficultyConfig;
    }

    @Override
    public DifficultyDistribution distributionFor(String userId) {
        return tierDifficultyConfig.getDistribution(userTierService.getTierLevel(userId));
    }
}
