package com.biblequiz.service;

import com.biblequiz.entity.Question;
import com.biblequiz.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final CacheService cacheService;
    private final Random random;

    public QuestionService(QuestionRepository questionRepository, CacheService cacheService) {
        this.questionRepository = questionRepository;
        this.cacheService = cacheService;
        this.random = new Random();
    }

    public List<Question> getRandomQuestions(String book, String difficultyStr, int limit, List<String> excludeIds) {
        // Check cache first
        String cacheKey = buildCacheKey(book, difficultyStr, limit);
        if (excludeIds == null || excludeIds.isEmpty()) {
            Optional<List<Question>> cached = cacheService.getCachedQuestionList(book, difficultyStr);
            if (cached.isPresent()) {
                return cached.get();
            }
        }
        
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
            total = questionRepository.countByBookAndDifficultyAndIsActiveTrue(book, difficulty);
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
        Set<String> excludeSet = excludeIds != null ? new HashSet<>(excludeIds) : new HashSet<>();
        int pageIndex = startPage;
        int attempts = 0;
        int maxAttempts = totalPages * 2; // Prevent infinite loop
        
        while (result.size() < limit && attempts < maxAttempts) {
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
                if (excludeSet.contains(q.getId())) continue;
                if (result.stream().anyMatch(existing -> existing.getId().equals(q.getId()))) continue;
                result.add(q);
                excludeSet.add(q.getId()); // Add to exclude set to prevent duplicates within this call
            }
            
            if (totalPages <= 1) break;
            pageIndex = (pageIndex + 1) % totalPages;
            attempts++;
            if (pageIndex == startPage) break; // full cycle
        }

        // Shuffle to approximate randomness within collected window
        Collections.shuffle(result, random);
        if (result.size() > limit) {
            result = new ArrayList<>(result.subList(0, limit));
        }
        
        // Cache the result if no exclusions
        if (excludeIds == null || excludeIds.isEmpty()) {
            cacheService.cacheQuestions(book, difficultyStr, result);
        }
        
        return result;
    }

    public Question getQuestionOfTheDay(String language) {
        // Check cache first
        Optional<Question> cached = cacheService.getCachedQuestionOfTheDay(language, Question.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        
        long total = questionRepository.countByIsActiveTrue();
        if (total == 0) return null;
        // Deterministic daily index based on date
        long seed = Long.parseLong(java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE));
        Random seeded = new Random(seed);
        int index = seeded.nextInt((int) Math.min(Integer.MAX_VALUE, total));
        Page<Question> page = questionRepository.findByIsActiveTrue(PageRequest.of(index, 1));
        if (page.isEmpty()) {
            return questionRepository.findByIsActiveTrue(PageRequest.of(0, 1)).stream().findFirst().orElse(null);
        }
        
        Question question = page.getContent().get(0);
        
        // Cache the result
        cacheService.cacheQuestionOfTheDay(language, question);
        
        return question;
    }
    
    private String buildCacheKey(String book, String difficulty, int limit) {
        return String.format("%s:%s:%d", book != null ? book : "all", difficulty != null ? difficulty : "all", limit);
    }
}


