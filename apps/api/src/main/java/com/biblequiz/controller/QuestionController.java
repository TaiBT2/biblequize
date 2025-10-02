package com.biblequiz.controller;

import com.biblequiz.entity.Question;
import com.biblequiz.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @GetMapping("/questions")
    public List<Question> getQuestions(
            @RequestParam(required = false) String book,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        
        if (book != null && !book.isEmpty()) {
            if (difficulty != null && !difficulty.isEmpty()) {
                return questionRepository.findByBookAndDifficulty(book, difficulty, limit);
            } else {
                return questionRepository.findByBook(book, limit);
            }
        } else if (difficulty != null && !difficulty.isEmpty()) {
            return questionRepository.findByDifficulty(difficulty, limit);
        } else {
            return questionRepository.findRandomQuestions(limit);
        }
    }
}