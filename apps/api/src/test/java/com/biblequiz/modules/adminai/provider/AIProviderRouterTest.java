package com.biblequiz.modules.adminai.provider;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AIProviderRouterTest {

    private FakeProvider deepseek;
    private FakeProvider gemini;
    private FakeProvider claude;
    private AIGenerationContext ctx;

    @BeforeEach
    void setUp() {
        deepseek = new FakeProvider("deepseek", true, false);
        gemini = new FakeProvider("gemini", true, false);
        claude = new FakeProvider("claude", true, false);
        ctx = AIGenerationContext.of("Genesis", 1, 1, 5, "easy",
                "multiple_choice_single", "vi", 2, null, null);
    }

    @Test
    void generate_autoMode_primarySucceeds_returnsImmediately() {
        AIProviderRouter router = new AIProviderRouter(List.of(deepseek, gemini, claude));
        AIGenerationResult result = router.generate(ctx, null);
        assertEquals("deepseek", result.providerUsed());
        assertEquals(1, deepseek.callCount);
        assertEquals(0, gemini.callCount);
    }

    @Test
    void generate_autoMode_primaryFails_fallsBackToSecondary() {
        deepseek.failNext = true;
        AIProviderRouter router = new AIProviderRouter(List.of(deepseek, gemini, claude));
        AIGenerationResult result = router.generate(ctx, "auto");
        assertEquals("gemini", result.providerUsed());
        assertEquals(1, deepseek.callCount);
        assertEquals(1, gemini.callCount);
        assertEquals(0, claude.callCount);
    }

    @Test
    void generate_autoMode_unavailableProviderSkipped() {
        deepseek.available = false;
        AIProviderRouter router = new AIProviderRouter(List.of(deepseek, gemini, claude));
        AIGenerationResult result = router.generate(ctx, null);
        assertEquals("gemini", result.providerUsed());
        assertEquals(0, deepseek.callCount);
    }

    @Test
    void generate_allFail_throwsAIProviderException() {
        deepseek.failNext = true;
        gemini.failNext = true;
        claude.failNext = true;
        AIProviderRouter router = new AIProviderRouter(List.of(deepseek, gemini, claude));
        AIProviderException ex = assertThrows(AIProviderException.class,
                () -> router.generate(ctx, null));
        assertTrue(ex.getMessage().contains("All AI providers failed"));
    }

    @Test
    void generate_explicitProvider_doesNotFallback() {
        gemini.failNext = true;
        AIProviderRouter router = new AIProviderRouter(List.of(deepseek, gemini, claude));
        assertThrows(AIProviderException.class, () -> router.generate(ctx, "gemini"));
        assertEquals(0, deepseek.callCount);
        assertEquals(1, gemini.callCount);
        assertEquals(0, claude.callCount);
    }

    @Test
    void generate_unknownExplicitProvider_throwsIllegalArgument() {
        AIProviderRouter router = new AIProviderRouter(List.of(deepseek, gemini, claude));
        assertThrows(IllegalArgumentException.class, () -> router.generate(ctx, "openai"));
    }

    @Test
    void getDefaultProviderName_isFirstInChain() {
        AIProviderRouter router = new AIProviderRouter(List.of(deepseek, gemini, claude));
        assertEquals("deepseek", router.getDefaultProviderName());
    }

    static class FakeProvider implements AIProvider {
        final String name;
        boolean available;
        boolean failNext;
        int callCount = 0;

        FakeProvider(String name, boolean available, boolean failNext) {
            this.name = name;
            this.available = available;
            this.failNext = failNext;
        }

        @Override public String getProviderName() { return name; }
        @Override public boolean isAvailable() { return available; }

        @Override public AIGenerationResult generate(AIGenerationContext ctx) {
            callCount++;
            if (failNext) throw new AIProviderException(name + " simulated failure");
            return new AIGenerationResult(List.of(Map.of("content", "Q from " + name)), 10, 20, name);
        }
    }
}
