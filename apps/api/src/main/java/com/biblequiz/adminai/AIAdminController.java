package com.biblequiz.adminai;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(path = "/api/admin/ai", produces = MediaType.APPLICATION_JSON_VALUE)
public class AIAdminController {

    @PostMapping("/generate")
    public Map<String, Object> generate(@RequestBody Map<String, Object> payload) {
        // Mock implementation: echo inputs and return sample questions
        var questions = List.of(
                Map.of(
                        "type", "multiple_choice",
                        "question", "Ai đó xây dựng con tàu trong Sáng thế ký?",
                        "options", List.of("Môi-se", "Nô-ê", "Áp-ra-ham", "Đa-vít"),
                        "answer", "Nô-ê"
                ),
                Map.of(
                        "type", "short_answer",
                        "question", "Chúa Giê-xu sinh tại đâu?",
                        "answer", "Bết-lê-hem"
                )
        );

        return Map.of(
                "input", payload,
                "count", questions.size(),
                "questions", questions
        );
    }
}


