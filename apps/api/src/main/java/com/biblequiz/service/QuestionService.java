package com.biblequiz.service;

import com.biblequiz.entity.Question;
import com.biblequiz.repository.QuestionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final Random random;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
        this.random = new Random();
    }

    public List<Question> getRandomQuestions(String book, String difficultyStr, int limit) {
        Question.Difficulty difficulty = null;
        if (difficultyStr != null && !difficultyStr.isEmpty() && !"all".equalsIgnoreCase(difficultyStr)) {
            try {
                difficulty = Question.Difficulty.valueOf(difficultyStr);
            } catch (IllegalArgumentException ignored) {
                // fall back to no difficulty filter
            }
        }

        if (limit <= 0) {
            return Collections.emptyList();
        }

        // Compute total count based on filters
        long total;
        if (book != null && !book.isEmpty() && difficulty != null) {
            total = questionRepository.countByDifficultyAndIsActiveTrue(difficulty) // rough upper bound
                    ;
        } else if (book != null && !book.isEmpty()) {
            total = questionRepository.countByBookAndIsActiveTrue(book);
        } else if (difficulty != null) {
            total = questionRepository.countByDifficultyAndIsActiveTrue(difficulty);
        } else {
            total = questionRepository.countByIsActiveTrue();
        }

        if (total == 0) {
            return Collections.emptyList();
        }

        // Choose a random page and collect results until we reach limit
        int pageSize = Math.min(Math.max(limit, 10), 50);
        int totalPages = (int) Math.max(1, Math.ceil(total / (double) pageSize));
        int startPage = random.nextInt(totalPages);

        List<Question> result = new ArrayList<>(limit);
        int pageIndex = startPage;
        while (result.size() < limit) {
            Page<Question> page;
            if (book != null && !book.isEmpty() && difficulty != null) {
                page = questionRepository.findByBookAndDifficultyAndIsActiveTrue(book, difficulty, PageRequest.of(pageIndex, pageSize));
            } else if (book != null && !book.isEmpty()) {
                page = questionRepository.findByBookAndIsActiveTrue(book, PageRequest.of(pageIndex, pageSize));
            } else if (difficulty != null) {
                page = questionRepository.findByDifficultyAndIsActiveTrue(difficulty, PageRequest.of(pageIndex, pageSize));
            } else {
                page = questionRepository.findByIsActiveTrue(PageRequest.of(pageIndex, pageSize));
            }
            for (Question q : page.getContent()) {
                if (result.size() >= limit) break;
                result.add(q);
            }
            if (totalPages <= 1) break;
            pageIndex = (pageIndex + 1) % totalPages;
            if (pageIndex == startPage) break; // full cycle
        }

        // Shuffle to approximate randomness within collected window
        Collections.shuffle(result, random);
        if (result.size() > limit) {
            return new ArrayList<>(result.subList(0, limit));
        }
        return result;
    }
}


