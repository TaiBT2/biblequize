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
import java.util.List;
import java.util.Map;

@Service
public class AIGenerationService {

    private static final Logger log = LoggerFactory.getLogger(AIGenerationService.class);
    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    @Value("${anthropic.api-key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-haiku-4-5-20251001}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public List<Map<String, Object>> generate(
            String book, int chapter, int verseStart, int verseEnd,
            String difficulty, String type, String language, int count,
            String scriptureText, String customPrompt) throws Exception {

        String prompt = buildPrompt(book, chapter, verseStart, verseEnd,
                difficulty, type, language, count, scriptureText, customPrompt);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 4096,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        String requestJson = objectMapper.writeValueAsString(requestBody);
        log.info("[AI] Calling Anthropic API: model={}, book={} {}:{}-{}, count={}", model, book, chapter, verseStart, verseEnd, count);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ANTHROPIC_API_URL))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .timeout(Duration.ofSeconds(60))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("[AI] Anthropic API error: status={} body={}", response.statusCode(), response.body());
            throw new RuntimeException("Anthropic API returned " + response.statusCode());
        }

        Map<String, Object> responseBody = objectMapper.readValue(response.body(), new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> contentBlocks = (List<Map<String, Object>>) responseBody.get("content");
        if (contentBlocks == null || contentBlocks.isEmpty()) {
            throw new RuntimeException("Empty response from Anthropic API");
        }

        String text = (String) contentBlocks.get(0).get("text");
        log.debug("[AI] Raw response text: {}", text);

        // Extract JSON array from the response text
        int start = text.indexOf('[');
        int end = text.lastIndexOf(']') + 1;
        if (start == -1 || end <= 0) {
            log.error("[AI] No JSON array found in response: {}", text);
            throw new RuntimeException("AI response did not contain a JSON array");
        }

        String jsonArray = text.substring(start, end);
        List<Map<String, Object>> questions = objectMapper.readValue(jsonArray, new TypeReference<>() {});
        log.info("[AI] Generated {} questions successfully", questions.size());
        return questions;
    }

    private String buildPrompt(String book, int chapter, int verseStart, int verseEnd,
                                String difficulty, String type, String language, int count,
                                String scriptureText, String customPrompt) {
        boolean isVi = "vi".equals(language);
        String ref = book + " " + chapter + ":" + verseStart + (verseEnd != verseStart ? "-" + verseEnd : "");
        String langName = isVi ? "Vietnamese (Tiếng Việt)" : "English";

        String typeInstruction = switch (type) {
            case "true_false" -> isVi
                    ? "true_false (Đúng/Sai): options phải là [\"Đúng\", \"Sai\"], correctAnswer là 0 (Đúng) hoặc 1 (Sai)"
                    : "true_false: options must be [\"True\", \"False\"], correctAnswer is 0 (True) or 1 (False)";
            case "fill_in_blank" -> isVi
                    ? "fill_in_blank (Điền vào chỗ trống): options là mảng rỗng [], correctAnswer là 0, nội dung câu hỏi có ___ là chỗ cần điền"
                    : "fill_in_blank: options is empty array [], correctAnswer is 0, question content has ___ as blank";
            case "multiple_choice_multi" -> isVi
                    ? "multiple_choice_multi (Nhiều đáp án): 4 options, correctAnswer là mảng các index đúng VD [0,2]"
                    : "multiple_choice_multi: 4 options, correctAnswer is array of correct indices e.g. [0,2]";
            default -> isVi
                    ? "multiple_choice_single (Trắc nghiệm 1 đáp án): 4 options (A,B,C,D), correctAnswer là index 0-3 của đáp án đúng"
                    : "multiple_choice_single: 4 options (A,B,C,D), correctAnswer is 0-based index of the correct answer";
        };

        String difficultyNote = switch (difficulty) {
            case "hard" -> isVi ? "Khó: câu hỏi đòi hỏi hiểu sâu, chi tiết cụ thể, bối cảnh lịch sử" : "Hard: requires deep understanding, specific details, historical context";
            case "medium" -> isVi ? "Trung bình: câu hỏi về nội dung chính, nhân vật, sự kiện quan trọng" : "Medium: questions about main content, key characters, important events";
            default -> isVi ? "Dễ: câu hỏi về ý nghĩa cơ bản, nội dung rõ ràng trong đoạn" : "Easy: questions about basic meaning, clear content in the passage";
        };

        StringBuilder sb = new StringBuilder();

        if (customPrompt != null && !customPrompt.isBlank()) {
            sb.append(customPrompt).append("\n\n");
        }

        sb.append("You are a Bible quiz question generator. Generate exactly ").append(count)
                .append(" quiz question(s) based on ").append(ref).append(".\n\n");

        sb.append("Language: ").append(langName).append("\n");
        sb.append("Difficulty: ").append(difficulty).append(" — ").append(difficultyNote).append("\n");
        sb.append("Question type: ").append(typeInstruction).append("\n\n");

        if (scriptureText != null && !scriptureText.isBlank()) {
            sb.append("Scripture text:\n").append(scriptureText).append("\n\n");
        }

        sb.append("Return ONLY a valid JSON array (no markdown, no extra text) with exactly ").append(count).append(" object(s):\n");
        sb.append("[\n  {\n");
        sb.append("    \"content\": \"question text in ").append(langName).append("\",\n");
        sb.append("    \"type\": \"").append(type).append("\",\n");
        sb.append("    \"difficulty\": \"").append(difficulty).append("\",\n");
        sb.append("    \"language\": \"").append(language).append("\",\n");
        sb.append("    \"options\": [\"option A\", \"option B\", \"option C\", \"option D\"],\n");
        sb.append("    \"correctAnswer\": 0,\n");
        sb.append("    \"explanation\": \"brief explanation in ").append(langName).append("\",\n");
        sb.append("    \"book\": \"").append(book).append("\",\n");
        sb.append("    \"chapter\": ").append(chapter).append(",\n");
        sb.append("    \"verseStart\": ").append(verseStart).append(",\n");
        sb.append("    \"verseEnd\": ").append(verseEnd).append(",\n");
        sb.append("    \"tags\": [\"").append(book.toLowerCase().replace(" ", ""))
                .append("\", \"chapter").append(chapter).append("\"],\n");
        sb.append("    \"source\": \"").append(isVi ? "Kinh Thánh" : "Holy Bible").append("\"\n");
        sb.append("  }\n]\n\n");
        sb.append("Make every question biblically accurate. Use the actual content of ").append(ref).append(".");

        return sb.toString();
    }
}
