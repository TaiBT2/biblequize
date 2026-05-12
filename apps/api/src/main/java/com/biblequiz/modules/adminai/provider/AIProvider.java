package com.biblequiz.modules.adminai.provider;

/**
 * AI provider abstraction for question generation. Implementations are stateless
 * Spring components and are discovered by {@link AIProviderRouter} via DI.
 */
public interface AIProvider {

    /**
     * Generate questions per the request. Throws {@link AIProviderException} on failure;
     * the router catches and falls back to the next provider in the chain.
     */
    AIGenerationResult generate(AIGenerationContext context);

    /** Unique short name: "deepseek", "gemini", "claude". */
    String getProviderName();

    /** Whether the provider is currently usable (credentials present, not in cooldown). */
    boolean isAvailable();
}
