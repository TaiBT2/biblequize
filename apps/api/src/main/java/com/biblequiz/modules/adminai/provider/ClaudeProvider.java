package com.biblequiz.modules.adminai.provider;

import com.biblequiz.modules.adminai.AIGenerationService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/** Thin adapter delegating to existing {@link AIGenerationService#generateWithClaude}. */
@Component
public class ClaudeProvider implements AIProvider {

    private final AIGenerationService delegate;

    public ClaudeProvider(AIGenerationService delegate) {
        this.delegate = delegate;
    }

    @Override
    public String getProviderName() { return "claude"; }

    @Override
    public boolean isAvailable() { return delegate.isClaudeConfigured(); }

    @Override
    public AIGenerationResult generate(AIGenerationContext ctx) {
        try {
            List<Map<String, Object>> questions = delegate.generateWithClaude(
                    ctx.book(), ctx.chapter(), ctx.verseStart(), ctx.verseEnd(),
                    ctx.difficulty(), ctx.type(), ctx.language(), ctx.count(),
                    ctx.scriptureText(), ctx.customPrompt(), ctx.claudeModels());
            return AIGenerationResult.of(questions, getProviderName());
        } catch (Exception e) {
            throw new AIProviderException("Claude failed: " + e.getMessage(), e);
        }
    }
}
