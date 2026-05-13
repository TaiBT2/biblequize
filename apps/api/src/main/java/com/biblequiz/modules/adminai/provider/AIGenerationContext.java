package com.biblequiz.modules.adminai.provider;

import java.util.List;

/**
 * Provider-neutral request for question generation. All fields are pre-validated
 * by the caller (controller or router).
 */
public record AIGenerationContext(
        String book,
        int chapter,
        int chapterEnd,   // same as chapter for single-chapter requests
        int verseStart,
        int verseEnd,
        String difficulty,
        String type,
        String language,
        int count,
        String scriptureText,
        String customPrompt,
        // Claude-specific (ignored by other providers)
        List<String> claudeModels
) {
    public static AIGenerationContext of(String book, int chapter, int verseStart, int verseEnd,
                                         String difficulty, String type, String language, int count,
                                         String scriptureText, String customPrompt) {
        return new AIGenerationContext(book, chapter, chapter, verseStart, verseEnd,
                difficulty, type, language, count, scriptureText, customPrompt, null);
    }

    public static AIGenerationContext range(String book, int chapter, int chapterEnd,
                                            int verseStart, int verseEnd,
                                            String difficulty, String type, String language, int count,
                                            String scriptureText, String customPrompt) {
        int chEnd = Math.max(chapter, chapterEnd);
        return new AIGenerationContext(book, chapter, chEnd, verseStart, verseEnd,
                difficulty, type, language, count, scriptureText, customPrompt, null);
    }

    public boolean isChapterRange() { return chapterEnd > chapter; }
}
