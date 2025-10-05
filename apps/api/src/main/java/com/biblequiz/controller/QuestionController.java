package com.biblequiz.controller;

import com.biblequiz.entity.Question;
import com.biblequiz.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @GetMapping("/questions")
    public List<Question> getQuestions(
            @RequestParam(required = false) String book,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        
        return questionService.getRandomQuestions(book, difficulty, limit);
    }
}