package com.biblequiz.controller;

import com.biblequiz.entity.Question;
import com.biblequiz.repository.QuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/questions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuestionController {

    private static final Logger log = LoggerFactory.getLogger(AdminQuestionController.class);

    @Autowired
    private QuestionRepository questionRepository;

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        log.info("[ADMIN] Questions ping OK");
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping
    public ResponseEntity<Question> create(@RequestBody Question q) {
        q.setId(null);
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
}


