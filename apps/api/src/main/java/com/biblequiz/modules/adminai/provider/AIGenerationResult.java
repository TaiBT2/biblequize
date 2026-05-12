package com.biblequiz.modules.adminai.provider;

import java.util.List;
import java.util.Map;

/**
 * Provider-neutral response. {@code inputTokens} / {@code outputTokens} may be 0
 * for providers that don't report usage (Gemini-on-HTTP, mocks).
 */
public record AIGenerationResult(
        List<Map<String, Object>> questions,
        int inputTokens,
        int outputTokens,
        String providerUsed
) {
    public static AIGenerationResult of(List<Map<String, Object>> questions, String providerUsed) {
        return new AIGenerationResult(questions, 0, 0, providerUsed);
    }
}
