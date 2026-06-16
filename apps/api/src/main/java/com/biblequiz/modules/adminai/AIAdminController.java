package com.biblequiz.modules.adminai;

import com.biblequiz.modules.adminai.provider.AIGenerationContext;
import com.biblequiz.modules.adminai.provider.AIGenerationResult;
import com.biblequiz.modules.adminai.provider.AIProviderException;
import com.biblequiz.modules.adminai.provider.AIProviderRouter;
import com.biblequiz.modules.adminai.quota.AIQuotaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(path = "/api/admin/ai", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
public class AIAdminController {

    private static final Logger log = LoggerFactory.getLogger(AIAdminController.class);

    private static final double COST_ALERT_USD = 10.0;

    private final AIGenerationService aiGenerationService;
    private final AIProviderRouter providerRouter;
    private final AIQuotaService quotaService;

    public AIAdminController(AIGenerationService aiGenerationService,
                             AIProviderRouter providerRouter,
                             AIQuotaService quotaService) {
        this.aiGenerationService = aiGenerationService;
        this.providerRouter = providerRouter;
        this.quotaService = quotaService;
    }

    @GetMapping("/models")
    public ResponseEntity<?> listModels() {
        return ResponseEntity.ok(aiGenerationService.listModels());
    }

    @GetMapping("/info")
    public ResponseEntity<?> info() {
        AIQuotaService.Usage usage = quotaService.snapshot();
        boolean deepseekConfigured = providerRouter.findProvider("deepseek")
                .map(p -> p.isAvailable()).orElse(false);
        return ResponseEntity.ok(Map.of(
                "providers", Map.of(
                        "deepseek", Map.of(
                                "configured", deepseekConfigured,
                                "model",      "deepseek.v3.2"
                        ),
                        "gemini", Map.of(
                                "configured", aiGenerationService.isConfigured(),
                                "model",      aiGenerationService.getModel()
                        ),
                        "claude", Map.of(
                                "configured", aiGenerationService.isClaudeConfigured(),
                                "model",      aiGenerationService.getClaudeModel()
                        )
                ),
                "defaultProvider", providerRouter.getDefaultProviderName(),
                "quotaToday", Map.of(
                        "used", usage.used(),
                        "limit", usage.limit(),
                        "remaining", usage.remaining()
                ),
                "costAlert", COST_ALERT_USD
        ));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody AIGenerationRequest req,
            org.springframework.security.core.Authentication auth) {
        int requestCount = req.validCount();
        if (!quotaService.tryAcquire(requestCount)) {
            AIQuotaService.Usage usage = quotaService.snapshot();
            return ResponseEntity.status(429).body(Map.of(
                    "error", "QUOTA_EXCEEDED",
                    "message", "Đã vượt quota " + usage.limit() + " câu/ngày. Đã dùng: " + usage.used(),
                    "used", usage.used(),
                    "limit", usage.limit(),
                    "remaining", usage.remaining()
            ));
        }

        AIGenerationRequest.ScriptureRef scripture =
                req.scripture() != null ? req.scripture() : new AIGenerationRequest.ScriptureRef(
                        "Genesis", 1, 1, 1, 1, null);

        String book       = scripture.book() != null && !scripture.book().isBlank() ? scripture.book().trim() : "Genesis";
        int    chapter    = scripture.chapter()    != null ? scripture.chapter()    : 1;
        int    chapterEnd = scripture.chapterEnd() != null ? Math.max(chapter, scripture.chapterEnd()) : chapter;
        int    verseStart = scripture.verseStart() != null ? scripture.verseStart() : 1;
        int    verseEnd   = scripture.verseEnd()   != null ? scripture.verseEnd()   : verseStart;
        String t = scripture.text();
        String scriptureText = t != null && !t.isBlank() ? t.trim() : null;

        String difficulty   = req.validDifficulty();
        String type         = req.validType();
        String language     = req.validLanguage();
        int    count        = req.validCount();
        String customPrompt = req.sanitizedPrompt();
        String provider     = req.validProvider();
        List<String> claudeModels = req.claudeModels();

        AIGenerationContext ctx = new AIGenerationContext(
                book, chapter, chapterEnd, verseStart, verseEnd,
                difficulty, type, language, count,
                scriptureText, customPrompt, claudeModels);

        try {
            AIGenerationResult result = providerRouter.generate(ctx, provider);
            String adminId = auth != null ? auth.getName() : "unknown";
            AIQuotaService.Usage usage = quotaService.snapshot();
            log.info("[AI] Admin {} generated {} questions via {}. Quota: {}/{}",
                    adminId, result.questions().size(), result.providerUsed(),
                    usage.used(), usage.limit());
            return ResponseEntity.ok(Map.of(
                    "jobId",       result.providerUsed() + "-job-" + System.currentTimeMillis(),
                    "status",      "completed",
                    "provider",    result.providerUsed(),
                    "count",       result.questions().size(),
                    "questions",   result.questions(),
                    "quotaUsed",   usage.used(),
                    "quotaLimit",  usage.limit()
            ));
        } catch (AIProviderException e) {
            log.error("[AI] Generation failed via router: {}", e.getMessage(), e);
            // Fallback: mock data when no provider is configured (preserves legacy dev UX)
            if (e.getMessage() != null && e.getMessage().contains("no providers available")) {
                log.warn("[AI] No providers available — returning mock data");
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
            return ResponseEntity.internalServerError().body(Map.of(
                    "error",   "AI_GENERATION_FAILED",
                    "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error",   "INVALID_PROVIDER",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * QPG-2: AI suggestion to improve an existing question's answers (balanced
     * length, plausible distractors, shuffled position). Returns aiAvailable:false
     * (not an error) when no provider is configured — the FE still has its instant
     * heuristic check. Consumes 1 quota unit only when a provider exists.
     */
    @PostMapping("/improve-question")
    public ResponseEntity<?> improveQuestion(@RequestBody ImproveQuestionRequest req) {
        // Goes through AIProviderRouter → default DeepSeek (Bedrock) + Gemini/Claude
        // fallback, same as generation. Improve = "regenerate this one question with
        // better answers", carried as a customPrompt so buildPrompt's distractor rules apply.
        if (!providerRouter.hasAvailableProvider()) {
            return ResponseEntity.ok(Map.of(
                    "aiAvailable", false,
                    "message", "Chưa cấu hình AI provider — chỉ có đánh giá heuristic."));
        }
        if (!quotaService.tryAcquire(1)) {
            AIQuotaService.Usage usage = quotaService.snapshot();
            return ResponseEntity.status(429).body(Map.of(
                    "error", "QUOTA_EXCEEDED",
                    "message", "Đã vượt quota " + usage.limit() + " câu/ngày."));
        }

        int correctIdx = (req.correctAnswer() != null && !req.correctAnswer().isEmpty()
                && req.correctAnswer().get(0) != null) ? req.correctAnswer().get(0) : 0;
        String correctText = (req.options() != null && correctIdx >= 0 && correctIdx < req.options().size())
                ? req.options().get(correctIdx) : "";
        String type       = req.type() != null ? req.type() : "multiple_choice_single";
        String language   = req.language() != null ? req.language() : "vi";
        String difficulty = req.difficulty() != null ? req.difficulty() : "medium";
        String book       = (req.book() != null && !req.book().isBlank()) ? req.book() : "Genesis";
        int chapter       = req.chapter()    != null ? req.chapter()    : 1;
        int verseStart    = req.verseStart() != null ? req.verseStart() : 1;
        int verseEnd      = req.verseEnd()   != null ? req.verseEnd()   : verseStart;

        boolean isVi = "vi".equals(language);
        String directive = (isVi
                ? "ĐÂY LÀ VIỆC CẢI THIỆN MỘT CÂU HỎI ĐÃ CÓ — KHÔNG tạo câu mới khác chủ đề.\n"
                  + "Giữ NGUYÊN nội dung câu hỏi: \"" + req.content() + "\"\n"
                  + "Giữ NGUYÊN Ý NGHĨA đáp án đúng: \"" + correctText + "\" (có thể viết lại cho cân bằng độ dài).\n"
                  + "4 đáp án hiện tại: " + req.options() + "\n"
                  + "Hãy viết lại 4 đáp án theo đúng các quy tắc chất lượng ở trên (cân bằng độ dài, distractor hợp lý, đảo vị trí)."
                : "THIS IS IMPROVING AN EXISTING QUESTION — do NOT invent a different one.\n"
                  + "Keep the question content: \"" + req.content() + "\"\n"
                  + "Keep the MEANING of the correct answer: \"" + correctText + "\" (may reword for balanced length).\n"
                  + "Current 4 options: " + req.options() + "\n"
                  + "Rewrite the 4 options following the quality rules above (balanced length, plausible distractors, shuffled position).");

        AIGenerationContext ctx = new AIGenerationContext(
                book, chapter, chapter, verseStart, verseEnd,
                difficulty, type, language, 1, null, directive, null);

        try {
            AIGenerationResult result = providerRouter.generate(ctx, null);
            if (result.questions() == null || result.questions().isEmpty()) {
                return ResponseEntity.ok(Map.of("aiAvailable", false, "message", "AI không trả về kết quả — thử lại."));
            }
            Map<String, Object> q = result.questions().get(0);
            Map<String, Object> suggestion = new LinkedHashMap<>();
            suggestion.put("options", q.get("options"));
            suggestion.put("correctAnswer", q.get("correctAnswer"));
            suggestion.put("explanation", q.get("explanation"));
            suggestion.put("providerUsed", result.providerUsed());
            return ResponseEntity.ok(Map.of("aiAvailable", true, "suggestion", suggestion));
        } catch (AIProviderException e) {
            log.warn("[AI][improve] all providers failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("aiAvailable", false, "message", "AI provider không khả dụng."));
        }
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
                    ? "⚠️ Đây là dữ liệu mô phỏng. Cấu hình AI provider để dùng AI thực."
                    : "⚠️ This is mock data. Configure an AI provider for real generation.";
        }

        var result = new LinkedHashMap<String, Object>();
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
