package com.biblequiz.modules.quiz.dto;

/**
 * Easy/Medium/Hard split (percent) + per-question timer for a tier.
 *
 * <p>Lives in the {@code quiz} module (the consumer — {@code SmartQuestionSelector})
 * so the selector no longer imports the {@code ranked} module. The {@code ranked}
 * module's {@code TierDifficultyConfig} produces it and the {@code TierDifficultyProvider}
 * implementation adapts a user id to it. Numbers are pinned by SPEC_USER §3.2.
 */
public record DifficultyDistribution(
        int easyPercent,
        int mediumPercent,
        int hardPercent,
        int timerSeconds
) {}
