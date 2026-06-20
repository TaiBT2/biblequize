package com.biblequiz.modules.adminai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class AIGenerationService {

    private static final Logger log = LoggerFactory.getLogger(AIGenerationService.class);
    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${anthropic.api-key:}")
    private String claudeApiKey;

    @Value("${anthropic.model:claude-haiku-4-5-20251001}")
    private String claudeModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public Map<String, Object> listModels() {
        if (!isConfigured()) return Map.of("error", "API key not configured");
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(15))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public boolean isClaudeConfigured() {
        return claudeApiKey != null && !claudeApiKey.isBlank();
    }

    public String getModel() {
        return model;
    }

    public String getClaudeModel() {
        return claudeModel;
    }

    public List<Map<String, Object>> generate(
            String book, int chapter, int verseStart, int verseEnd,
            String difficulty, String type, String language, int count,
            String scriptureText, String customPrompt) throws Exception {

        // Single request asking for all `count` questions to avoid Gemini rate limiting
        String prompt = buildPrompt(book, chapter, verseStart, verseEnd,
                difficulty, type, language, count, scriptureText, customPrompt);

        String requestJson = objectMapper.writeValueAsString(Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        ));
        String url = String.format(GEMINI_API_URL, model, apiKey);

        log.info("[AI] Single Gemini request for {} questions: model={}, book={} {}:{}-{}",
                count, model, book, chapter, verseStart, verseEnd);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .timeout(Duration.ofSeconds(90))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("[AI] Request failed: status={}, body={}", response.statusCode(),
                    response.body().substring(0, Math.min(300, response.body().length())));
            return List.of();
        }

        String text = extractTextFromGeminiResponse(response.body()).strip();
        if (text.startsWith("```")) {
            text = text.replaceFirst("```(?:json)?\\s*", "").replaceAll("```\\s*$", "").strip();
        }

        List<Map<String, Object>> questions = objectMapper.readValue(
                extractJsonArray(text), new TypeReference<>() {});

        log.info("[AI] Generated {}/{} questions from single request", questions.size(), count);
        return questions;
    }

    /** Auto-select the best Claude model for the given difficulty. */
    private String selectModelForDifficulty(String difficulty) {
        return switch (difficulty) {
            case "hard"   -> "claude-sonnet-4-6";        // Sonnet 4.6 for hard questions
            case "medium" -> "claude-sonnet-4-6";        // Sonnet 4.6 for medium
            default       -> "claude-haiku-4-5-20251001"; // Haiku for easy (fast + cheap)
        };
    }

    /**
     * Generate questions using one or more Claude models simultaneously.
     * Pass modelIds=["auto"] or empty to auto-select model based on difficulty.
     * Each model generates `count` questions in parallel → results tagged with _generatedBy.
     * Total requests = modelIds.size × count, all fired concurrently.
     */
    public List<Map<String, Object>> generateWithClaude(
            String book, int chapter, int verseStart, int verseEnd,
            String difficulty, String type, String language, int count,
            String scriptureText, String customPrompt, List<String> modelIds) throws Exception {

        // Resolve "auto" and empty list to difficulty-based model
        List<String> effectiveModels;
        if (modelIds == null || modelIds.isEmpty() || modelIds.contains("auto")) {
            String autoModel = selectModelForDifficulty(difficulty);
            log.info("[AI][Claude] Auto-selected model={} for difficulty={}", autoModel, difficulty);
            effectiveModels = List.of(autoModel);
        } else {
            effectiveModels = modelIds;
        }

        String prompt = buildPrompt(book, chapter, verseStart, verseEnd,
                difficulty, type, language, 1, scriptureText, customPrompt);

        log.info("[AI][Claude] Launching {} models × {} questions = {} parallel requests, book={} {}:{}-{}",
                effectiveModels.size(), count, effectiveModels.size() * count,
                book, chapter, verseStart, verseEnd);

        List<CompletableFuture<Map<String, Object>>> futures = new ArrayList<>();

        for (String modelId : effectiveModels) {
            String requestJson = objectMapper.writeValueAsString(Map.of(
                    "model", modelId,
                    "max_tokens", 1024,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            ));

            for (int i = 0; i < count; i++) {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.anthropic.com/v1/messages"))
                        .header("Content-Type", "application/json")
                        .header("x-api-key", claudeApiKey)
                        .header("anthropic-version", "2023-06-01")
                        .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                        .timeout(Duration.ofSeconds(60))
                        .build();

                final String finalModelId = modelId;
                final int idx = i;
                CompletableFuture<Map<String, Object>> future = httpClient
                        .sendAsync(request, HttpResponse.BodyHandlers.ofString())
                        .thenApply(response -> {
                            try {
                                if (response.statusCode() != 200) {
                                    log.error("[AI][Claude][{}] Request #{} failed: status={}", finalModelId, idx, response.statusCode());
                                    return null;
                                }
                                String text = extractTextFromClaudeResponse(response.body()).strip();
                                if (text.startsWith("```")) {
                                    text = text.replaceFirst("```(?:json)?\\s*", "").replaceAll("```\\s*$", "").strip();
                                }
                                List<Map<String, Object>> list = objectMapper.readValue(
                                        extractJsonArray(text), new TypeReference<>() {});
                                if (list.isEmpty()) return null;
                                // Tag with generating model
                                java.util.LinkedHashMap<String, Object> q = new java.util.LinkedHashMap<>(list.get(0));
                                q.put("_generatedBy", finalModelId);
                                log.debug("[AI][Claude][{}] Request #{} OK", finalModelId, idx);
                                return q;
                            } catch (Exception e) {
                                log.error("[AI][Claude][{}] Request #{} parse error: {}", finalModelId, idx, e.getMessage());
                                return null;
                            }
                        });
                futures.add(future);
            }
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        List<Map<String, Object>> questions = futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        log.info("[AI][Claude] Generated {}/{} questions from {} models (parallel)",
                questions.size(), effectiveModels.size() * count, effectiveModels.size());
        return questions;
    }

    private String extractTextFromClaudeResponse(String body) throws Exception {
        Map<String, Object> responseBody = objectMapper.readValue(body, new TypeReference<>() {});
        if (!(responseBody.get("content") instanceof List<?> contentList) || contentList.isEmpty()) {
            throw new RuntimeException("Empty or missing 'content' in Claude API response");
        }
        if (!(contentList.get(0) instanceof Map<?, ?> block)
                || !"text".equals(block.get("type"))
                || !(block.get("text") instanceof String text)) {
            throw new RuntimeException("Invalid content block in Claude API response");
        }
        return text;
    }

    /**
     * Safely navigates the Gemini response structure with null/type checks
     * and detects blocked responses (finishReason != STOP).
     */
    private String extractTextFromGeminiResponse(String body) throws Exception {
        Map<String, Object> responseBody = objectMapper.readValue(body, new TypeReference<>() {});

        if (!(responseBody.get("candidates") instanceof List<?> candidatesList) || candidatesList.isEmpty()) {
            throw new RuntimeException("Empty or missing 'candidates' in Gemini API response");
        }

        if (!(candidatesList.get(0) instanceof Map<?, ?> candidateMap)) {
            throw new RuntimeException("Invalid candidate structure in Gemini API response");
        }

        // Check if Gemini blocked or truncated the response
        Object finishReason = candidateMap.get("finishReason");
        if (finishReason instanceof String reason && !"STOP".equals(reason) && !"MAX_TOKENS".equals(reason)) {
            throw new RuntimeException("Gemini API blocked response: finishReason=" + reason);
        }

        if (!(candidateMap.get("content") instanceof Map<?, ?> contentMap)) {
            throw new RuntimeException("Missing 'content' in Gemini API candidate");
        }

        if (!(contentMap.get("parts") instanceof List<?> partsList) || partsList.isEmpty()) {
            throw new RuntimeException("Empty 'parts' in Gemini API content");
        }

        if (!(partsList.get(0) instanceof Map<?, ?> partMap)
                || !(partMap.get("text") instanceof String text)) {
            throw new RuntimeException("Missing 'text' in Gemini API part");
        }

        return text;
    }

    /**
     * Extracts the outermost JSON array from text that may contain surrounding prose.
     * Uses bracket depth tracking so nested arrays inside question options are handled correctly.
     */
    private String extractJsonArray(String text) {
        int start = -1;
        int depth = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '[') {
                if (depth == 0) start = i;
                depth++;
            } else if (c == ']') {
                depth--;
                if (depth == 0 && start != -1) {
                    return text.substring(start, i + 1);
                }
            }
        }
        log.error("[AI] No JSON array found in response: {}", text);
        throw new RuntimeException("AI response did not contain a valid JSON array");
    }

    /** Public so other providers (e.g. Bedrock DeepSeek) can reuse the prompt. */
    public String buildQuestionPrompt(String book, int chapter, int verseStart, int verseEnd,
                                      String difficulty, String type, String language, int count,
                                      String scriptureText, String customPrompt) {
        return buildPrompt(book, chapter, chapter, verseStart, verseEnd,
                difficulty, type, language, count, scriptureText, customPrompt);
    }

    /** Range-aware overload: chapterEnd > chapter signals a multi-chapter span. */
    public String buildQuestionPrompt(String book, int chapter, int chapterEnd,
                                      int verseStart, int verseEnd,
                                      String difficulty, String type, String language, int count,
                                      String scriptureText, String customPrompt) {
        return buildPrompt(book, chapter, Math.max(chapter, chapterEnd), verseStart, verseEnd,
                difficulty, type, language, count, scriptureText, customPrompt);
    }

    /** Public so other providers can reuse the JSON-array extraction. */
    public String extractJsonArrayPublic(String text) {
        return extractJsonArray(text);
    }

    private String buildPrompt(String book, int chapter, int verseStart, int verseEnd,
                                String difficulty, String type, String language, int count,
                                String scriptureText, String customPrompt) {
        return buildPrompt(book, chapter, chapter, verseStart, verseEnd,
                difficulty, type, language, count, scriptureText, customPrompt);
    }

    private String buildPrompt(String book, int chapter, int chapterEnd,
                                int verseStart, int verseEnd,
                                String difficulty, String type, String language, int count,
                                String scriptureText, String customPrompt) {
        boolean isVi = "vi".equals(language);
        // "ALL" sentinel = generate across the whole Bible (topic-driven), each
        // question self-declares its own book/chapter/verse.
        boolean isAllBooks = "ALL".equalsIgnoreCase(book);
        boolean isRange = !isAllBooks && chapterEnd > chapter;
        String ref = isAllBooks
                ? (isVi ? "toàn bộ Kinh Thánh (66 sách Tin Lành)" : "the whole Bible (66 Protestant books)")
                : isRange
                    ? book + " " + chapter + "-" + chapterEnd
                    : book + " " + chapter + ":" + verseStart
                        + (verseEnd != verseStart ? "-" + verseEnd : "");
        String langName = isVi ? "Vietnamese (Tiếng Việt)" : "English";

        String typeInstruction = switch (type) {
            case "true_false" -> isVi
                    ? "true_false: options phải là [\"Đúng\", \"Sai\"], correctAnswer là 0 (Đúng) hoặc 1 (Sai)"
                    : "true_false: options must be [\"True\", \"False\"], correctAnswer is 0 (True) or 1 (False)";
            case "fill_in_blank" -> isVi
                    ? "fill_in_blank: options là [], correctAnswer là 0, câu hỏi có ___ là chỗ điền"
                    : "fill_in_blank: options is [], correctAnswer is 0, question has ___ as the blank";
            case "multiple_choice_multi" -> isVi
                    ? "multiple_choice_multi: 4 options, correctAnswer là mảng các index đúng, VD [0,2]"
                    : "multiple_choice_multi: 4 options, correctAnswer is array of correct indices e.g. [0,2]";
            default -> isVi
                    ? "multiple_choice_single: 4 options (A,B,C,D), correctAnswer là index 0-3 của đáp án đúng"
                    : "multiple_choice_single: 4 options (A,B,C,D), correctAnswer is 0-based index of correct answer";
        };

        String difficultyNote = switch (difficulty) {
            case "hard"   -> isVi ? "đòi hỏi hiểu sâu, chi tiết cụ thể, bối cảnh lịch sử"
                                  : "deep understanding, specific details, historical context";
            case "medium" -> isVi ? "nội dung chính, nhân vật, sự kiện quan trọng"
                                  : "main content, key characters, important events";
            default       -> isVi ? "ý nghĩa cơ bản, nội dung rõ ràng trong đoạn"
                                  : "basic meaning, clear content in the passage";
        };

        StringBuilder sb = new StringBuilder();

        sb.append("Bạn là chuyên gia tạo câu hỏi trắc nghiệm Kinh Thánh. ");
        sb.append("Hãy tạo đúng ").append(count).append(" câu hỏi dựa trên ").append(ref).append(".\n");
        if (isAllBooks) {
            sb.append(isVi
                ? "Phạm vi là TOÀN BỘ Kinh Thánh — chọn câu hỏi từ NHIỀU sách khác nhau, đa dạng cả Cựu Ước lẫn Tân Ước, KHÔNG dồn vào một sách duy nhất. Nếu có chủ đề/yêu cầu bên dưới, bám sát chủ đề đó (vd: một nhân vật có thể xuất hiện ở nhiều sách).\n"
                : "The scope is the WHOLE Bible — draw questions from MANY different books, spanning both Old and New Testament, do NOT cluster in a single book. If a topic/requirement is given below, follow it (e.g. a figure may appear across several books).\n");
            sb.append(isVi
                ? "BẮT BUỘC: mỗi câu hỏi PHẢI tự khai báo chính xác sách (book — tên tiếng Anh trong 66 sách Tin Lành), chapter, verseStart, verseEnd của riêng câu đó.\n"
                : "REQUIRED: each question MUST self-declare its exact book (English name among the 66 Protestant books), chapter, verseStart, verseEnd.\n");
        } else if (isRange) {
            sb.append("Phạm vi là MỘT KHOẢNG CHƯƠNG (").append(chapter).append("-").append(chapterEnd)
              .append("). Phân bố câu hỏi đều giữa các chương, không dồn vào một chương duy nhất. ")
              .append("Mỗi câu hỏi có thể trích từ bất kỳ chương nào trong khoảng này — ưu tiên đa dạng.\n");
        }
        sb.append("\n");

        if (customPrompt != null && !customPrompt.isBlank()) {
            // Place the user-provided directive AS PART OF the task description (not as a
            // background note), with strong wording, so the model treats it as a hard
            // constraint rather than optional context.
            sb.append("⚠️ YÊU CẦU BẮT BUỘC (mọi câu hỏi đều phải tuân thủ):\n");
            sb.append(customPrompt).append("\n\n");
        }

        sb.append("Ngôn ngữ: ").append(langName).append("\n");
        sb.append("Độ khó: ").append(difficulty).append(" — ").append(difficultyNote).append("\n");
        sb.append("Loại câu hỏi: ").append(typeInstruction).append("\n\n");

        if (scriptureText != null && !scriptureText.isBlank()) {
            sb.append("Nội dung đoạn Kinh Thánh:\n").append(scriptureText).append("\n\n");
        }

        // Anti-guessing rules for MCQ. Seed audit (2026-06-16) showed 80% of
        // questions had the correct answer as the longest option (avg 2.4x the
        // distractors) — a test-wise player could score ~76% by always picking
        // the longest. These rules kill that tell at the source.
        boolean isMc = type.startsWith("multiple_choice");
        if (isMc) {
            if (isVi) {
                sb.append("Quy tắc viết đáp án trắc nghiệm Kinh Thánh (chuẩn Haladyna/NBME — BẮT BUỘC):\n");
                sb.append("MỤC TIÊU: câu hỏi test người ĐỌC KỸ văn bản, KHÔNG phải người đoán \"đáp án nào nghe đạo đức/đầy đủ nhất\". Mỗi distractor phải dụ được một người đọc lướt.\n");
                sb.append("A. SELF-CHECK (mọi câu phải pass hết, nếu fail thì viết lại):\n");
                sb.append("   - Che câu hỏi đi mà vẫn đoán ra đáp án → loại.\n");
                sb.append("   - Người có nền tảng Cơ Đốc cơ bản (chưa đọc đoạn này) loại được distractor chỉ bằng kiến thức chung → distractor yếu, viết lại.\n");
                sb.append("   - Đáp án đúng là phương án DUY NHẤT \"tích cực/đầy đủ\" → hỏng, sửa lại.\n");
                sb.append("B. MỖI DISTRACTOR = MỘT LOẠI LỖI KHÁC NHAU. Chọn 3 loại KHÁC nhau (KHÔNG lặp) từ:\n");
                sb.append("   1) Nhầm passage gần — trộn chi tiết từ chương/đoạn kế bên.\n");
                sb.append("   2) Sai chi tiết — đổi người nói / con số / ngày thứ mấy / thứ tự (vd \"tốt lành\" vs \"rất tốt lành\").\n");
                sb.append("   3) Sai phạm vi — gán một mô tả đúng cho sai đối tượng.\n");
                sb.append("   4) Hiểu lầm phổ biến (common misconception) trong cộng đồng.\n");
                sb.append("   5) Đúng văn bản nhưng lạc câu hỏi — chi tiết CÓ thật nhưng không trả lời đúng điều được hỏi.\n");
                sb.append("   Nếu 2 distractor trùng loại lỗi → coi như hỏng, phải viết lại.\n");
                sb.append("C. PHẢI có ÍT NHẤT 1 đáp án \"gần đúng\" (almost-right): đúng ~90%, chỉ sai đúng 1 chi tiết then chốt (một con số, một cái tên, một mệnh đề). Đây là bẫy giá trị nhất.\n");
                sb.append("D. ĐỒNG NHẤT (homogeneous): 4 phương án cùng độ dài, cùng giọng văn, cùng cấu trúc ngữ pháp. Đáp án đúng TUYỆT ĐỐI không dài/đầy đủ hơn rõ rệt — đó là tell dễ đoán nhất.\n");
                sb.append("E. KHÔNG cue lộ liễu: tránh để riêng đáp án sai chứa từ tuyệt đối (\"luôn luôn\", \"không bao giờ\", \"ngay từ đầu\", \"hoàn toàn\", \"đầy dẫy\").\n");
                sb.append("F. THEO ĐỘ KHÓ: dễ = distractor sai rõ về thần học cơ bản; trung bình = ≥1 almost-right; khó = ≥2 almost-right, loại trừ phải nhớ chính xác câu chữ.\n");
                sb.append("G. Vị trí đáp án đúng NGẪU NHIÊN giữa A/B/C/D — không luôn đặt ở A.\n");
                sb.append("H. explanation: trích câu/đoạn cụ thể, nêu vì sao đáp án đúng đúng VÀ chỉ rõ TỪNG distractor sai ở đâu kèm loại lỗi của nó.\n");
                sb.append("I. KHAI BÁO loại lỗi: mỗi câu PHẢI kèm field \"distractors\" — mảng object cho TỪNG phương án SAI, dạng {\"index\": <vị trí 0-3 của phương án đó trong options>, \"errorType\": <một trong: nearby_passage | wrong_detail | wrong_scope | common_misconception | true_but_off>, \"almostRight\": true/false}. Map loại lỗi → key: nhầm passage gần=nearby_passage, sai chi tiết=wrong_detail, sai phạm vi=wrong_scope, hiểu lầm phổ biến=common_misconception, đúng-văn-bản-lạc-câu-hỏi=true_but_off. 3 errorType PHẢI KHÁC nhau; KHÔNG liệt kê phương án đúng trong \"distractors\".\n\n");
            } else {
                sb.append("Bible MCQ answer-writing rules (Haladyna/NBME standard — REQUIRED):\n");
                sb.append("GOAL: the question must test someone who READ the text carefully, NOT someone guessing \"which option sounds most pious/complete\". Each distractor must lure a skim-reader.\n");
                sb.append("A. SELF-CHECK (every item must pass; rewrite if it fails):\n");
                sb.append("   - If the answer is guessable with the question hidden → reject.\n");
                sb.append("   - If someone with basic Christian background (who hasn't read this passage) can eliminate a distractor by general knowledge → weak distractor, rewrite.\n");
                sb.append("   - If the correct answer is the ONLY \"positive/complete\" option → broken, fix it.\n");
                sb.append("B. EACH DISTRACTOR = A DIFFERENT ERROR TYPE. Pick 3 DISTINCT types (no repeats) from:\n");
                sb.append("   1) Nearby-passage mixup — blend details from an adjacent chapter/passage.\n");
                sb.append("   2) Wrong detail — change the speaker / a number / which day / the order (e.g. \"good\" vs \"very good\").\n");
                sb.append("   3) Wrong scope — attribute a correct description to the wrong subject.\n");
                sb.append("   4) Common misconception held in the community.\n");
                sb.append("   5) True-but-off-question — a detail that is real in the text but does not answer what was asked.\n");
                sb.append("   If two distractors share an error type → broken, rewrite.\n");
                sb.append("C. MUST include AT LEAST ONE \"almost-right\" option: ~90% correct, wrong in exactly one decisive detail (a number, a name, a clause). The most valuable trap.\n");
                sb.append("D. HOMOGENEOUS: all 4 options share length, tone and grammatical form. The correct answer must NEVER be noticeably longer/more complete — the most obvious giveaway.\n");
                sb.append("E. NO telltale cues: do not put absolute words (\"always\", \"never\", \"from the very beginning\", \"completely\") only in the wrong options.\n");
                sb.append("F. BY DIFFICULTY: easy = distractors clearly wrong on basic theology; medium = ≥1 almost-right; hard = ≥2 almost-right, elimination requires recalling the exact wording.\n");
                sb.append("G. Randomize the correct answer's position across A/B/C/D — do not always put it at A.\n");
                sb.append("H. explanation: cite the specific verse, say why the correct answer is right AND pinpoint where EACH distractor goes wrong with its error type.\n");
                sb.append("I. DECLARE error types: every item MUST include a \"distractors\" field — an array of objects for EACH wrong option: {\"index\": <0-3 position of that option in options>, \"errorType\": <one of: nearby_passage | wrong_detail | wrong_scope | common_misconception | true_but_off>, \"almostRight\": true/false}. The 3 errorType values MUST be DISTINCT; do NOT list the correct option in \"distractors\".\n\n");
            }
        }

        sb.append("Trả về ONLY một mảng JSON hợp lệ (không markdown, không text thừa) với đúng ")
          .append(count).append(" object:\n");
        sb.append("[\n  {\n");
        sb.append("    \"content\": \"nội dung câu hỏi bằng ").append(langName).append("\",\n");
        sb.append("    \"type\": \"").append(type).append("\",\n");
        sb.append("    \"difficulty\": \"").append(difficulty).append("\",\n");
        sb.append("    \"language\": \"").append(language).append("\",\n");
        sb.append("    \"options\": [\"Lựa chọn A\", \"Lựa chọn B\", \"Lựa chọn C\", \"Lựa chọn D\"],\n");
        // Example index is deliberately non-zero so the model doesn't anchor on A.
        sb.append("    \"correctAnswer\": 2,\n");
        sb.append("    \"explanation\": \"giải thích ngắn gọn bằng ").append(langName).append("\",\n");
        if (isMc) {
            // Example uses correctAnswer=2, so the wrong options are at indices 0, 1, 3.
            sb.append("    \"distractors\": [{\"index\": 0, \"errorType\": \"nearby_passage\", \"almostRight\": false}, ")
              .append("{\"index\": 1, \"errorType\": \"wrong_detail\", \"almostRight\": true}, ")
              .append("{\"index\": 3, \"errorType\": \"true_but_off\", \"almostRight\": false}],\n");
        }
        // In all-books mode the book/chapter are placeholders — the model fills the
        // real reference per question; show a concrete sample so the JSON shape is clear.
        String tplBook = isAllBooks ? "Psalms" : book;
        int    tplChapter = isAllBooks ? 23 : chapter;
        sb.append("    \"book\": \"").append(tplBook).append("\",\n");
        sb.append("    \"chapter\": ").append(tplChapter).append(",\n");
        sb.append("    \"verseStart\": ").append(verseStart).append(",\n");
        sb.append("    \"verseEnd\": ").append(verseEnd).append(",\n");
        sb.append("    \"tags\": [\"").append(tplBook.toLowerCase().replace(" ", ""))
          .append("\", \"chapter").append(tplChapter).append("\"],\n");
        sb.append("    \"source\": \"").append(isVi ? "Kinh Thánh" : "Holy Bible").append("\"\n");
        sb.append("  }\n]\n\n");
        sb.append("Quan trọng: mỗi câu hỏi phải chính xác về mặt Kinh Thánh, dựa trên nội dung thực của ").append(ref).append(".");

        return sb.toString();
    }

    /**
     * AEQ-2: attach a {@code _quality} block to every MCQ question based on its
     * declared {@code distractors} error types. Enforces the Haladyna/NBME rule
     * that each distractor uses a DISTINCT error type and the difficulty-scaled
     * minimum of "almost-right" traps. Non-MCQ questions are left untouched (the
     * FE treats an absent {@code _quality} as valid). Mutates the maps in place.
     */
    public void annotateQuality(List<Map<String, Object>> questions) {
        if (questions == null) return;
        for (Map<String, Object> q : questions) {
            if (q == null) continue;
            if (q.get("type") instanceof String type && type.startsWith("multiple_choice")) {
                q.put("_quality", evaluateQuality(q));
            }
        }
    }

    private Map<String, Object> evaluateQuality(Map<String, Object> q) {
        List<String> reasons = new ArrayList<>();
        List<String> errorTypes = new ArrayList<>();
        int almostRight = 0;

        if (q.get("distractors") instanceof List<?> list && !list.isEmpty()) {
            for (Object o : list) {
                if (!(o instanceof Map<?, ?> m)) continue;
                if (m.get("errorType") instanceof String s && !s.isBlank()) errorTypes.add(s);
                if (Boolean.TRUE.equals(m.get("almostRight"))) almostRight++;
            }
        } else {
            reasons.add("missing_distractors");
        }

        boolean duplicate = errorTypes.size() != new HashSet<>(errorTypes).size();
        if (duplicate) reasons.add("duplicate_error_type");

        int required = switch (String.valueOf(q.get("difficulty"))) {
            case "hard"   -> 2;
            case "medium" -> 1;
            default        -> 0;
        };
        if (almostRight < required) reasons.add("insufficient_almost_right");

        Map<String, Object> quality = new LinkedHashMap<>();
        quality.put("valid", reasons.isEmpty());
        quality.put("duplicateErrorType", duplicate);
        quality.put("almostRightCount", almostRight);
        quality.put("requiredAlmostRight", required);
        quality.put("reasons", reasons);
        return quality;
    }
}
