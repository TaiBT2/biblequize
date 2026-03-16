package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/questions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuestionController {

    private static final Logger log = LoggerFactory.getLogger(AdminQuestionController.class);

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        log.info("[ADMIN] Questions ping OK");
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String book,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String reviewStatus,
            @RequestParam(required = false) String search) {

        Question.Difficulty diff = null;
        if (difficulty != null && !difficulty.isBlank()) {
            try { diff = Question.Difficulty.valueOf(difficulty); } catch (Exception ignored) {}
        }
        Question.Type qType = null;
        if (type != null && !type.isBlank()) {
            try { qType = Question.Type.valueOf(type.replace("-", "_")); } catch (Exception ignored) {}
        }
        Question.ReviewStatus rs = null;
        if (reviewStatus != null && !reviewStatus.isBlank()) {
            try { rs = Question.ReviewStatus.valueOf(reviewStatus); } catch (Exception ignored) {}
        }
        String searchParam = (search != null && !search.isBlank())
                ? "%" + search.toLowerCase() + "%" : null;
        String bookParam = (book != null && !book.isBlank()) ? book : null;

        var pageable = org.springframework.data.domain.PageRequest.of(
                page, Math.min(size, 200),
                org.springframework.data.domain.Sort.by("createdAt").descending());

        var result = questionRepository.findWithAdminFilters(
                bookParam, diff, qType, rs, searchParam, pageable);

        return ResponseEntity.ok(Map.of(
                "questions", result.getContent(),
                "total", result.getTotalElements(),
                "page", page,
                "size", size,
                "totalPages", result.getTotalPages()
        ));
    }

    @PostMapping
    public ResponseEntity<Question> create(
            @RequestBody Question q,
            @RequestParam(value = "pending", defaultValue = "false") boolean pending) {
        q.setId(UUID.randomUUID().toString());
        if (pending) {
            q.setIsActive(false);
            q.setReviewStatus(Question.ReviewStatus.PENDING);
            q.setApprovalsCount(0);
        } else {
            q.setReviewStatus(Question.ReviewStatus.ACTIVE);
            q.setApprovalsCount(2);
        }
        return ResponseEntity.ok(questionRepository.save(q));
    }

    @PutMapping(path = "/{id}")
    public ResponseEntity<?> update(@PathVariable("id") String id, @RequestBody Question body) {
        try {
            log.info("[ADMIN] Update question id={} payload received", id);
            Optional<Question> opt = questionRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            Question q = opt.get();
            if (body.getBook() != null) q.setBook(body.getBook());
            if (body.getChapter() != null) q.setChapter(body.getChapter());
            if (body.getVerseStart() != null) q.setVerseStart(body.getVerseStart());
            if (body.getVerseEnd() != null) q.setVerseEnd(body.getVerseEnd());
            if (body.getDifficulty() != null) q.setDifficulty(body.getDifficulty());
            if (body.getType() != null) q.setType(body.getType());
            if (body.getContent() != null) q.setContent(body.getContent());
            if (body.getOptions() != null) q.setOptions(body.getOptions());
            if (body.getCorrectAnswer() != null) q.setCorrectAnswer(body.getCorrectAnswer());
            if (body.getExplanation() != null) q.setExplanation(body.getExplanation());
            if (body.getTags() != null) q.setTags(body.getTags());
            if (body.getLanguage() != null) q.setLanguage(body.getLanguage());
            if (body.getIsActive() != null) q.setIsActive(body.getIsActive());
            if (body.getCorrectAnswerText() != null) q.setCorrectAnswerText(body.getCorrectAnswerText());
            if (body.getReviewStatus() != null) {
                q.setReviewStatus(body.getReviewStatus());
                if (body.getReviewStatus() == Question.ReviewStatus.ACTIVE) {
                    q.setIsActive(true);
                    if (q.getApprovalsCount() < 2) q.setApprovalsCount(2);
                } else {
                    q.setIsActive(false);
                }
            }
            Question saved = questionRepository.save(q);
            log.info("[ADMIN] Update question id={} success", id);
            return ResponseEntity.ok(saved);
        } catch (Exception ex) {
            log.error("[ADMIN] Update question id={} failed: {}", id, ex.getMessage(), ex);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "UPDATE_FAILED",
                    "message", ex.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!questionRepository.existsById(id)) return ResponseEntity.notFound().build();
        questionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> bulkDelete(@RequestBody Map<String, List<String>> payload) {
        List<String> ids = payload.get("ids");
        if (ids == null || ids.isEmpty()) return ResponseEntity.badRequest().build();
        questionRepository.deleteAllById(ids);
        return ResponseEntity.ok(Map.of("deleted", ids.size()));
    }

    // ── Import ───────────────────────────────────────────────────────────────

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> importQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

            List<Question> toSave = new ArrayList<>();
            List<Map<String, Object>> errors = new ArrayList<>();

            if (filename.endsWith(".json") || contentType.contains("json")) {
                parseJson(file, toSave, errors);
            } else if (filename.endsWith(".csv") || contentType.contains("csv") || contentType.contains("text/plain")) {
                parseCsv(file, toSave, errors);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file type. Use .json or .csv"));
            }

            if (dryRun) {
                log.info("[ADMIN] Import dry-run: willImport={}, errors={}", toSave.size(), errors.size());
                return ResponseEntity.ok(Map.of(
                        "dryRun", true,
                        "willImport", toSave.size(),
                        "errors", errors
                ));
            }

            // Save in batches of 100
            int saved = 0;
            for (int i = 0; i < toSave.size(); i += 100) {
                List<Question> batch = toSave.subList(i, Math.min(i + 100, toSave.size()));
                questionRepository.saveAll(batch);
                saved += batch.size();
            }
            log.info("[ADMIN] Import done: saved={}, errors={}", saved, errors.size());
            return ResponseEntity.ok(Map.of(
                    "imported", saved,
                    "errors", errors
            ));
        } catch (Exception e) {
            log.error("[ADMIN] Import failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Import helpers ───────────────────────────────────────────────────────

    private void parseJson(MultipartFile file, List<Question> out, List<Map<String, Object>> errors) throws Exception {
        List<Map<String, Object>> records = objectMapper.readValue(
                file.getInputStream(), new TypeReference<>() {
                });
        for (int i = 0; i < records.size(); i++) {
            try {
                out.add(buildFromJsonRecord(records.get(i), i + 1));
            } catch (Exception e) {
                errors.add(Map.of("index", i + 1, "error", e.getMessage()));
            }
        }
    }

    private void parseCsv(MultipartFile file, List<Question> out, List<Map<String, Object>> errors) throws Exception {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));

        List<String> headers = null;
        int lineNumber = 0;

        String line;
        while ((line = reader.readLine()) != null) {
            lineNumber++;
            if (line.isBlank() || line.startsWith("#")) continue;

            List<String> fields = parseCsvLine(line);
            if (headers == null) {
                headers = fields.stream().map(String::trim).collect(Collectors.toList());
                continue;
            }

            Map<String, String> record = new LinkedHashMap<>();
            for (int i = 0; i < headers.size(); i++) {
                record.put(headers.get(i), i < fields.size() ? fields.get(i) : "");
            }
            try {
                out.add(buildFromCsvRecord(record, lineNumber));
            } catch (Exception e) {
                errors.add(Map.of("line", lineNumber, "error", e.getMessage()));
            }
        }
    }

    private List<String> parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuote = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (inQuote) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        sb.append('"');
                        i++;
                    } else {
                        inQuote = false;
                    }
                } else {
                    sb.append(c);
                }
            } else {
                if (c == '"') {
                    inQuote = true;
                } else if (c == ',') {
                    fields.add(sb.toString().trim());
                    sb.setLength(0);
                } else {
                    sb.append(c);
                }
            }
        }
        fields.add(sb.toString().trim());
        return fields;
    }

    private Question buildFromCsvRecord(Map<String, String> r, int line) throws Exception {
        String book = req(r, "book", "line " + line);
        String typeStr = req(r, "type", "line " + line);
        String text = req(r, "text", "line " + line);
        String correctAnswerStr = req(r, "correctAnswer", "line " + line);
        String difficultyStr = req(r, "difficulty", "line " + line);

        Question q = new Question();
        q.setId(UUID.randomUUID().toString());
        q.setBook(book);
        q.setType(normalizeType(typeStr));
        q.setContent(text);
        q.setDifficulty(Question.Difficulty.valueOf(difficultyStr.toLowerCase()));

        // Options: optionA–D (skip blanks)
        List<String> options = new ArrayList<>();
        for (String key : List.of("optionA", "optionB", "optionC", "optionD")) {
            String v = r.getOrDefault(key, "").trim();
            if (!v.isEmpty()) options.add(v);
        }
        if (!options.isEmpty()) q.setOptions(options);

        // correctAnswer: "0" or "0,1"
        List<Integer> ca = Arrays.stream(correctAnswerStr.split(","))
                .map(s -> Integer.parseInt(s.trim()))
                .collect(Collectors.toList());
        q.setCorrectAnswer(ca);

        String chap = r.getOrDefault("chapter", "").trim();
        if (!chap.isEmpty()) q.setChapter(Integer.parseInt(chap));

        q.setExplanation(r.getOrDefault("explanation", "").trim());
        return q;
    }

    private Question buildFromJsonRecord(Map<String, Object> r, int index) throws Exception {
        String book = reqJson(r, "book", "record " + index);
        String typeStr = reqJson(r, "type", "record " + index);
        String difficultyStr = reqJson(r, "difficulty", "record " + index);

        // Accept "text" or "content" as question text
        String text = str(r, "text");
        if (text == null || text.isBlank()) text = str(r, "content");
        if (text == null || text.isBlank())
            throw new Exception("record " + index + ": 'text' or 'content' is required");

        Object caObj = r.get("correctAnswer");
        if (caObj == null) throw new Exception("record " + index + ": 'correctAnswer' is required");

        List<Integer> ca;
        if (caObj instanceof List<?> list) {
            ca = list.stream().map(x -> ((Number) x).intValue()).collect(Collectors.toList());
        } else if (caObj instanceof Number n) {
            ca = List.of(n.intValue());
        } else {
            throw new Exception("record " + index + ": 'correctAnswer' must be array or number");
        }

        Question q = new Question();
        q.setId(UUID.randomUUID().toString());
        q.setBook(book);
        q.setType(normalizeType(typeStr));
        q.setContent(text);
        q.setDifficulty(Question.Difficulty.valueOf(difficultyStr.toLowerCase()));
        q.setCorrectAnswer(ca);

        Object optionsObj = r.get("options");
        if (optionsObj instanceof List<?> list) {
            q.setOptions(list.stream().map(Object::toString).collect(Collectors.toList()));
        }

        if (r.get("chapter") instanceof Number n) q.setChapter(n.intValue());
        if (r.get("verseStart") instanceof Number n) q.setVerseStart(n.intValue());
        if (r.get("verseEnd") instanceof Number n) q.setVerseEnd(n.intValue());

        String explanation = str(r, "explanation");
        if (explanation != null) q.setExplanation(explanation);

        return q;
    }

    private String req(Map<String, String> r, String key, String ctx) throws Exception {
        String v = r.getOrDefault(key, "").trim();
        if (v.isEmpty()) throw new Exception(ctx + ": '" + key + "' is required");
        return v;
    }

    private String reqJson(Map<String, Object> r, String key, String ctx) throws Exception {
        Object v = r.get(key);
        if (v == null || v.toString().isBlank()) throw new Exception(ctx + ": '" + key + "' is required");
        return v.toString().trim();
    }

    private String str(Map<String, Object> r, String key) {
        Object v = r.get(key);
        return v != null ? v.toString().trim() : null;
    }

    private Question.Type normalizeType(String raw) {
        return switch (raw.toLowerCase().replace("-", "_")) {
            case "multiple_choice", "multiple_choice_single" -> Question.Type.multiple_choice_single;
            case "multiple_choice_multi" -> Question.Type.multiple_choice_multi;
            case "true_false" -> Question.Type.true_false;
            case "fill_in_blank" -> Question.Type.fill_in_blank;
            default -> throw new IllegalArgumentException("Unknown type: " + raw);
        };
    }
}
