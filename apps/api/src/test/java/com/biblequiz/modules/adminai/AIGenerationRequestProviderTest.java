package com.biblequiz.modules.adminai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AIGenerationRequestProviderTest {

    @Test
    void validProvider_deepseek_isAccepted() {
        var req = new AIGenerationRequest(null, "easy", "multiple_choice_single",
                "vi", 3, null, "deepseek", null);
        assertEquals("deepseek", req.validProvider());
    }

    @Test
    void validProvider_null_defaultsToAuto() {
        var req = new AIGenerationRequest(null, "easy", "multiple_choice_single",
                "vi", 3, null, null, null);
        assertEquals("auto", req.validProvider());
    }

    @Test
    void validProvider_blank_defaultsToAuto() {
        var req = new AIGenerationRequest(null, "easy", "multiple_choice_single",
                "vi", 3, null, "", null);
        assertEquals("auto", req.validProvider());
    }

    @Test
    void validProvider_unknown_defaultsToAuto() {
        var req = new AIGenerationRequest(null, "easy", "multiple_choice_single",
                "vi", 3, null, "openai", null);
        assertEquals("auto", req.validProvider());
    }

    @Test
    void validProvider_geminiAndClaude_stillAccepted() {
        var gemini = new AIGenerationRequest(null, "easy", "multiple_choice_single",
                "vi", 3, null, "gemini", null);
        var claude = new AIGenerationRequest(null, "easy", "multiple_choice_single",
                "vi", 3, null, "claude", null);
        assertEquals("gemini", gemini.validProvider());
        assertEquals("claude", claude.validProvider());
    }
}
