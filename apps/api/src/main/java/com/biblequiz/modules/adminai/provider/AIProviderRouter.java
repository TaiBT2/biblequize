package com.biblequiz.modules.adminai.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Routes generation requests to AI providers with default + fallback chain.
 *
 * <ul>
 *   <li>{@code requestedProvider=null} or {@code "auto"}: try default → fallback chain</li>
 *   <li>Explicit provider name (e.g. {@code "gemini"}): no fallback (caller must retry on failure)</li>
 * </ul>
 */
@Service
public class AIProviderRouter {

    private static final Logger log = LoggerFactory.getLogger(AIProviderRouter.class);

    private final List<AIProvider> providersInOrder;

    /**
     * Spring injects all {@link AIProvider} beans. Order is determined by:
     * BedrockDeepSeekProvider (default) → GeminiProvider → ClaudeProvider.
     * Note we use {@link ObjectProvider} for DeepSeek because it's conditional.
     */
    @Autowired
    public AIProviderRouter(ObjectProvider<BedrockDeepSeekProvider> deepseek,
                            GeminiProvider gemini,
                            ClaudeProvider claude) {
        List<AIProvider> ordered = new ArrayList<>();
        BedrockDeepSeekProvider ds = deepseek.getIfAvailable();
        if (ds != null) ordered.add(ds);
        ordered.add(gemini);
        ordered.add(claude);
        this.providersInOrder = List.copyOf(ordered);
        log.info("[AI][Router] Providers in order: {}", ordered.stream().map(AIProvider::getProviderName).toList());
    }

    /** Test-only constructor. */
    AIProviderRouter(List<AIProvider> providersInOrder) {
        this.providersInOrder = List.copyOf(providersInOrder);
    }

    /**
     * Generate using the requested provider, or auto-route via fallback chain when
     * {@code requestedProvider} is null or "auto".
     */
    public AIGenerationResult generate(AIGenerationContext ctx, String requestedProvider) {
        if (requestedProvider != null && !requestedProvider.isBlank() && !"auto".equalsIgnoreCase(requestedProvider)) {
            AIProvider provider = findProvider(requestedProvider)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown AI provider: " + requestedProvider));
            log.info("[AI][Router] Explicit provider={} (no fallback)", provider.getProviderName());
            return provider.generate(ctx);
        }

        AIProviderException lastError = null;
        for (int i = 0; i < providersInOrder.size(); i++) {
            AIProvider provider = providersInOrder.get(i);
            if (!provider.isAvailable()) {
                log.info("[AI][Router] Provider {} unavailable — skipping", provider.getProviderName());
                continue;
            }
            try {
                AIGenerationResult result = provider.generate(ctx);
                if (i > 0) {
                    log.warn("[AI][Router] Fallback triggered: primary={} actual={} lastError={}",
                            providersInOrder.get(0).getProviderName(),
                            provider.getProviderName(),
                            lastError != null ? lastError.getMessage() : "unavailable");
                }
                return result;
            } catch (AIProviderException e) {
                lastError = e;
                log.warn("[AI][Router] Provider {} failed: {} — trying next",
                        provider.getProviderName(), e.getMessage());
            }
        }
        throw new AIProviderException("All AI providers failed. Last error: "
                + (lastError != null ? lastError.getMessage() : "no providers available"), lastError);
    }

    public Optional<AIProvider> findProvider(String name) {
        return providersInOrder.stream()
                .filter(p -> p.getProviderName().equalsIgnoreCase(name))
                .findFirst();
    }

    public List<String> getProviderNames() {
        return providersInOrder.stream().map(AIProvider::getProviderName).toList();
    }

    public String getDefaultProviderName() {
        return providersInOrder.isEmpty() ? "none" : providersInOrder.get(0).getProviderName();
    }
}
