package com.biblequiz.modules.adminai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(path = "/api/admin/ai", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
public class AIAdminController {

    private static final Logger log = LoggerFactory.getLogger(AIAdminController.class);

    private final AIGenerationService aiGenerationService;

    public AIAdminController(AIGenerationService aiGenerationService) {
        this.aiGenerationService = aiGenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        Map<String, Object> scripture = payload.containsKey("scripture")
                ? (Map<String, Object>) payload.get("scripture")
                : Map.of();

        String book       = (String)  scripture.getOrDefault("book",       "Genesis");
        Object chapterObj = scripture.getOrDefault("chapter", 1);
        int    chapter    = chapterObj instanceof Number n ? n.intValue() : 1;
        Object vsObj      = scripture.getOrDefault("verseStart", 1);
        Object veObj      = scripture.getOrDefault("verseEnd",   1);
        int    verseStart = vsObj instanceof Number n ? n.intValue() : 1;
        int    verseEnd   = veObj instanceof Number n ? n.intValue() : verseStart;
        String scriptureText = scripture.get("text") instanceof String s ? s : null;

        String difficulty   = (String) payload.getOrDefault("difficulty", "easy");
        String type         = (String) payload.getOrDefault("type",       "multiple_choice_single");
        String language     = (String) payload.getOrDefault("language",   "vi");
        String customPrompt = payload.get("prompt") instanceof String s ? s : null;
        int    count        = payload.get("count") instanceof Number n ? n.intValue() : 3;
        count = Math.max(1, Math.min(count, 10));

        if (aiGenerationService.isConfigured()) {
            try {
                List<Map<String, Object>> questions = aiGenerationService.generate(
                        book, chapter, verseStart, verseEnd,
                        difficulty, type, language, count,
                        scriptureText, customPrompt);
                return ResponseEntity.ok(Map.of(
                        "jobId",     "ai-job-" + System.currentTimeMillis(),
                        "status",    "completed",
                        "count",     questions.size(),
                        "questions", questions
                ));
            } catch (Exception e) {
                log.error("[AI] Generation failed: {}", e.getMessage(), e);
                return ResponseEntity.internalServerError().body(Map.of(
                        "error",   "AI_GENERATION_FAILED",
                        "message", e.getMessage()
                ));
            }
        }

        // Fallback: mock data when API key not configured
        log.warn("[AI] ANTHROPIC_API_KEY not configured — returning mock data");
        List<Map<String, Object>> questions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            questions.add(buildMockQuestion(book, chapter, verseStart, verseEnd, difficulty, type, language, i));
        }
        return ResponseEntity.ok(Map.of(
                "jobId",     "mock-job-" + System.currentTimeMillis(),
                "status",    "completed",
                "count",     questions.size(),
                "questions", questions
        ));
    }

    private Map<String, Object> buildMockQuestion(
            String book, int chapter, int vs, int ve,
            String difficulty, String type, String language, int idx) {

        String ref = book + " " + chapter + ":" + vs;
        boolean isVi = "vi".equals(language);

        String content;
        List<String> options;
        int correctAnswer;
        String explanation;

        if ("true_false".equals(type)) {
            content       = isVi ? "Đây là một sự kiện trong " + ref + "." : "This event appears in " + ref + ".";
            options       = isVi ? List.of("Đúng", "Sai") : List.of("True", "False");
            correctAnswer = 0;
            explanation   = isVi ? "Dựa trên " + ref + "." : "Based on " + ref + ".";
        } else if ("fill_in_blank".equals(type)) {
            content       = isVi ? "Trong " + ref + ", nhân vật chính là ___." : "In " + ref + ", the main figure is ___.";
            options       = List.of();
            correctAnswer = 0;
            explanation   = isVi ? "Xem " + ref + " để biết thêm chi tiết." : "See " + ref + " for more details.";
        } else {
            String[] viContents = {
                "Theo " + ref + ", điều gì đã xảy ra vào ngày đầu tiên?",
                "Nhân vật nào được đề cập trong " + ref + "?",
                "Lời hứa trong " + ref + " là gì?",
                "Ai đã nói những lời được ghi lại trong " + ref + "?",
                "Sự kiện nào xảy ra theo " + ref + "?",
            };
            String[] enContents = {
                "According to " + ref + ", what happened on the first day?",
                "Who is mentioned in " + ref + "?",
                "What is the promise recorded in " + ref + "?",
                "Who spoke the words recorded in " + ref + "?",
                "What event occurs according to " + ref + "?",
            };
            content = (isVi ? viContents : enContents)[idx % 5];
            options = isVi
                    ? List.of("Đáp án A (mô phỏng)", "Đáp án B (mô phỏng)", "Đáp án C (mô phỏng)", "Đáp án D (mô phỏng)")
                    : List.of("Option A (mock)", "Option B (mock)", "Option C (mock)", "Option D (mock)");
            correctAnswer = idx % 4;
            explanation = isVi
                    ? "⚠️ Đây là dữ liệu mô phỏng. Cấu hình ANTHROPIC_API_KEY để dùng AI thực."
                    : "⚠️ This is mock data. Set ANTHROPIC_API_KEY to use real AI generation.";
        }

        var result = new java.util.LinkedHashMap<String, Object>();
        result.put("content",       content);
        result.put("type",          type);
        result.put("difficulty",    difficulty);
        result.put("language",      language);
        result.put("options",       options);
        result.put("correctAnswer", correctAnswer);
        result.put("explanation",   explanation);
        result.put("book",          book);
        result.put("chapter",       chapter);
        result.put("verseStart",    vs);
        result.put("verseEnd",      ve);
        result.put("tags",          List.of(book.toLowerCase().replace(" ", ""), "chapter" + chapter));
        result.put("source",        "Kinh Thánh");
        return result;
    }
}
