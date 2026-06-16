package com.biblequiz.modules.adminai;

import java.util.List;

/** QPG-2: payload for POST /api/admin/ai/improve-question. */
public record ImproveQuestionRequest(
        String content,
        List<String> options,
        List<Integer> correctAnswer,
        String explanation,
        String type,
        String language,
        String difficulty,
        String book,
        Integer chapter,
        Integer verseStart,
        Integer verseEnd
) {}
