package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final QuestionRepository questionRepository;

    @GetMapping("/sample-questions")
    public ResponseEntity<?> getSampleQuestions(
            @RequestParam(defaultValue = "vi") String language,
            @RequestParam(defaultValue = "3") int count) {

        if (count < 1 || count > 10) count = 3;

        List<Question> questions = questionRepository.findRandomEasyByLanguage(language, PageRequest.of(0, count));

        List<Map<String, Object>> result = questions.stream().map(q -> Map.<String, Object>of(
                "id", q.getId(),
                "content", q.getContent(),
                "options", q.getOptions(),
                "correctAnswer", q.getCorrectAnswer(),
                "book", q.getBook() != null ? q.getBook() : ""
        )).toList();

        return ResponseEntity.ok(result);
    }
}
