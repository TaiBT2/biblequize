package com.biblequiz.modules.adminai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping(path = "/api/admin/ai", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
public class AIAdminController {

    private static final Logger log = LoggerFactory.getLogger(AIAdminController.class);

    private static final int DAILY_QUOTA = 200;
    private static final double COST_ALERT_USD = 10.0;

    private final AIGenerationService aiGenerationService;

    // In-memory daily quota tracking (reset on new UTC day)
    private final ConcurrentHashMap<String, AtomicInteger> dailyQuota = new ConcurrentHashMap<>();
    private volatile LocalDate quotaDate = LocalDate.now(ZoneOffset.UTC);

    public AIAdminController(AIGenerationService aiGenerationService) {
        this.aiGenerationService = aiGenerationService;
    }

    private AtomicInteger getQuotaCounter(String adminId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!today.equals(quotaDate)) {
            dailyQuota.clear();
            quotaDate = today;
        }
        return dailyQuota.computeIfAbsent(adminId, k -> new AtomicInteger(0));
    }

    @GetMapping("/models")
    public ResponseEntity<?> listModels() {
        return ResponseEntity.ok(aiGenerationService.listModels());
    }

    @GetMapping("/info")
    public ResponseEntity<?> info(org.springframework.security.core.Authentication auth) {
        String adminId = auth != null ? auth.getName() : "unknown";
        int used = getQuotaCounter(adminId).get();
        return ResponseEntity.ok(Map.of(
                "providers", Map.of(
                        "gemini", Map.of(
                                "configured", aiGenerationService.isConfigured(),
                                "model",      aiGenerationService.getModel()
                        ),
                        "claude", Map.of(
                                "configured", aiGenerationService.isClaudeConfigured(),
                                "model",      aiGenerationService.getClaudeModel()
                        )
                ),
                "quotaToday", Map.of(
                        "used", used,
                        "limit", DAILY_QUOTA,
                        "remaining", Math.max(0, DAILY_QUOTA - used)
                ),
                "costAlert", COST_ALERT_USD
        ));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody AIGenerationRequest req,
            org.springframework.security.core.Authentication auth) {
        // Quota check
        String adminId = auth != null ? auth.getName() : "unknown";
        int requestCount = req.validCount();
        AtomicInteger counter = getQuotaCounter(adminId);
        if (counter.get() + requestCount > DAILY_QUOTA) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "QUOTA_EXCEEDED",
                    "message", "Đã vượt quota " + DAILY_QUOTA + " câu/ngày. Đã dùng: " + counter.get(),
                    "used", counter.get(),
                    "limit", DAILY_QUOTA
            ));
        }
        AIGenerationRequest.ScriptureRef scripture =
                req.scripture() != null ? req.scripture() : new AIGenerationRequest.ScriptureRef(
                        "Genesis", 1, 1, 1, 1, null);

        String book       = scripture.book() != null && !scripture.book().isBlank() ? scripture.book().trim() : "Genesis";
        int    chapter    = scripture.chapter()    != null ? scripture.chapter()    : 1;
        int    verseStart = scripture.verseStart() != null ? scripture.verseStart() : 1;
        int    verseEnd   = scripture.verseEnd()   != null ? scripture.verseEnd()   : verseStart;
        String t = scripture.text();
        String scriptureText = t != null && !t.isBlank() ? t.trim() : null;

        String difficulty    = req.validDifficulty();
        String type          = req.validType();
        String language      = req.validLanguage();
        int    count         = req.validCount();
        String customPrompt  = req.sanitizedPrompt();
        String provider      = req.validProvider();

        boolean useGemini = "gemini".equals(provider) && aiGenerationService.isConfigured();
        boolean useClaude = "claude".equals(provider) && aiGenerationService.isClaudeConfigured();
        java.util.List<String> claudeModels = req.claudeModels();

        if (useGemini || useClaude) {
            try {
                List<Map<String, Object>> questions = useClaude
                        ? aiGenerationService.generateWithClaude(book, chapter, verseStart, verseEnd,
                                difficulty, type, language, count, scriptureText, customPrompt, claudeModels)
                        : aiGenerationService.generate(book, chapter, verseStart, verseEnd,
                                difficulty, type, language, count, scriptureText, customPrompt);
                counter.addAndGet(questions.size());
                log.info("[AI] Admin {} generated {} questions. Quota: {}/{}", adminId, questions.size(), counter.get(), DAILY_QUOTA);
                return ResponseEntity.ok(Map.of(
                        "jobId",     provider + "-job-" + System.currentTimeMillis(),
                        "status",    "completed",
                        "provider",  provider,
                        "count",     questions.size(),
                        "questions", questions,
                        "quotaUsed", counter.get(),
                        "quotaLimit", DAILY_QUOTA
                ));
            } catch (Exception e) {
                log.error("[AI][{}] Generation failed: {}", provider, e.getMessage(), e);
                return ResponseEntity.internalServerError().body(Map.of(
                        "error",   "AI_GENERATION_FAILED",
                        "message", e.getMessage()
                ));
            }
        }

        // Fallback: mock data when no provider is configured
        log.warn("[AI] Provider '{}' not configured — returning mock data", provider);
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
                    ? "⚠️ Đây là dữ liệu mô phỏng. Cấu hình gemini.api-key để dùng AI thực."
                    : "⚠️ This is mock data. Set gemini.api-key to use real AI generation.";
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
