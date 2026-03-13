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
    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

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

    public String getModel() {
        return model;
    }

    public List<Map<String, Object>> generate(
            String book, int chapter, int verseStart, int verseEnd,
            String difficulty, String type, String language, int count,
            String scriptureText, String customPrompt) throws Exception {

        String prompt = buildPrompt(book, chapter, verseStart, verseEnd,
                difficulty, type, language, count, scriptureText, customPrompt);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                )
        );

        String requestJson = objectMapper.writeValueAsString(requestBody);
        String url = String.format(GEMINI_API_URL, model, apiKey);

        log.info("[AI] Calling Gemini API: model={}, book={} {}:{}-{}, count={}",
                model, book, chapter, verseStart, verseEnd, count);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .timeout(Duration.ofSeconds(60))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("[AI] Gemini API error: status={} body={}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API returned " + response.statusCode() + ": " + response.body());
        }

        // Parse Gemini response structure
        Map<String, Object> responseBody = objectMapper.readValue(response.body(), new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("Empty candidates from Gemini API");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        String text = (String) parts.get(0).get("text");

        log.debug("[AI] Raw response text: {}", text);

        // Strip markdown code fences if present
        text = text.strip();
        if (text.startsWith("```")) {
            text = text.replaceFirst("```(?:json)?\\s*", "").replaceAll("```\\s*$", "").strip();
        }

        // Extract JSON array
        int start = text.indexOf('[');
        int end   = text.lastIndexOf(']') + 1;
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
        String ref = book + " " + chapter + ":" + verseStart
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

        if (customPrompt != null && !customPrompt.isBlank()) {
            sb.append(customPrompt).append("\n\n");
        }

        sb.append("Bạn là chuyên gia tạo câu hỏi trắc nghiệm Kinh Thánh. ");
        sb.append("Hãy tạo đúng ").append(count).append(" câu hỏi dựa trên ").append(ref).append(".\n\n");

        sb.append("Ngôn ngữ: ").append(langName).append("\n");
        sb.append("Độ khó: ").append(difficulty).append(" — ").append(difficultyNote).append("\n");
        sb.append("Loại câu hỏi: ").append(typeInstruction).append("\n\n");

        if (scriptureText != null && !scriptureText.isBlank()) {
            sb.append("Nội dung đoạn Kinh Thánh:\n").append(scriptureText).append("\n\n");
        }

        sb.append("Trả về ONLY một mảng JSON hợp lệ (không markdown, không text thừa) với đúng ")
          .append(count).append(" object:\n");
        sb.append("[\n  {\n");
        sb.append("    \"content\": \"nội dung câu hỏi bằng ").append(langName).append("\",\n");
        sb.append("    \"type\": \"").append(type).append("\",\n");
        sb.append("    \"difficulty\": \"").append(difficulty).append("\",\n");
        sb.append("    \"language\": \"").append(language).append("\",\n");
        sb.append("    \"options\": [\"Lựa chọn A\", \"Lựa chọn B\", \"Lựa chọn C\", \"Lựa chọn D\"],\n");
        sb.append("    \"correctAnswer\": 0,\n");
        sb.append("    \"explanation\": \"giải thích ngắn gọn bằng ").append(langName).append("\",\n");
        sb.append("    \"book\": \"").append(book).append("\",\n");
        sb.append("    \"chapter\": ").append(chapter).append(",\n");
        sb.append("    \"verseStart\": ").append(verseStart).append(",\n");
        sb.append("    \"verseEnd\": ").append(verseEnd).append(",\n");
        sb.append("    \"tags\": [\"").append(book.toLowerCase().replace(" ", ""))
          .append("\", \"chapter").append(chapter).append("\"],\n");
        sb.append("    \"source\": \"").append(isVi ? "Kinh Thánh" : "Holy Bible").append("\"\n");
        sb.append("  }\n]\n\n");
        sb.append("Quan trọng: mỗi câu hỏi phải chính xác về mặt Kinh Thánh, dựa trên nội dung thực của ").append(ref).append(".");

        return sb.toString();
    }
}
