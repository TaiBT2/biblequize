package com.biblequiz.modules.adminai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Set;

/**
 * Request DTO for AI question generation.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AIGenerationRequest(
        ScriptureRef scripture,
        String difficulty,
        String type,
        String language,
        Integer count,
        String prompt,
        String provider,
        List<String> claudeModels
) {

    private static final Set<String> VALID_DIFFICULTIES = Set.of("easy", "medium", "hard");
    private static final Set<String> VALID_TYPES = Set.of(
            "multiple_choice_single", "multiple_choice_multi", "true_false", "fill_in_blank");
    private static final Set<String> VALID_LANGUAGES = Set.of("vi", "en");
    private static final Set<String> VALID_PROVIDERS = Set.of("gemini", "claude");

    public String validProvider() {
        return VALID_PROVIDERS.contains(provider) ? provider : "gemini";
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScriptureRef(
            String book,
            Integer chapter,
            Integer chapterEnd,
            Integer verseStart,
            Integer verseEnd,
            String text
    ) {}

    public String validDifficulty() {
        return VALID_DIFFICULTIES.contains(difficulty) ? difficulty : "easy";
    }

    public String validType() {
        return VALID_TYPES.contains(type) ? type : "multiple_choice_single";
    }

    public String validLanguage() {
        return VALID_LANGUAGES.contains(language) ? language : "vi";
    }

    public int validCount() {
        if (count == null) return 3;
        return Math.max(1, Math.min(count, 10));
    }

    /** Strip potentially injected instructions from the custom prompt. */
    public String sanitizedPrompt() {
        if (prompt == null || prompt.isBlank()) return null;
        // Remove common prompt-injection patterns: "ignore", "forget", "override", "system:"
        String cleaned = prompt
                .replaceAll("(?i)ignore (all )?(previous|above|prior) instructions?.*", "")
                .replaceAll("(?i)forget (everything|all) (above|prior|before).*", "")
                .replaceAll("(?i)you are now.*", "")
                .trim();
        // Limit length to prevent oversized payloads
        return cleaned.length() > 1000 ? cleaned.substring(0, 1000) : cleaned;
    }
}
