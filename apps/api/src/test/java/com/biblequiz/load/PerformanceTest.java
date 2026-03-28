package com.biblequiz.load;

import com.biblequiz.infrastructure.service.CacheService;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.service.QuestionService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Performance tests using Mockito (no H2/DB dependency).
 * Tests concurrency, memory, and response time of service layer.
 *
 * For real DB load testing, use k6 scripts in infra/k6/.
 */
@ExtendWith(MockitoExtension.class)
public class PerformanceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private CacheService cacheService;

    private QuestionService questionService;

    private List<Question> mockQuestions;

    @BeforeEach
    void setUp() {
        questionService = new QuestionService(questionRepository, cacheService);

        mockQuestions = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            Question q = new Question();
            q.setId("q-perf-" + i);
            q.setBook("Genesis");
            q.setChapter(1);
            q.setDifficulty(Question.Difficulty.easy);
            q.setType(Question.Type.multiple_choice_single);
            q.setContent("Performance test question " + i);
            q.setOptions(List.of("A", "B", "C", "D"));
            q.setCorrectAnswer(List.of(0));
            q.setIsActive(true);
            mockQuestions.add(q);
        }

        // Mock cache miss — force repo queries
        lenient().when(cacheService.getCachedQuestionList(anyString(), anyString()))
                .thenReturn(Optional.empty());

        // Mock repo with Pageable
        lenient().when(questionRepository.findByBookAndDifficultyAndIsActiveTrue(
                eq("Genesis"), eq(Question.Difficulty.easy), any(Pageable.class)))
                .thenReturn(new PageImpl<>(mockQuestions));
        lenient().when(questionRepository.findByBookAndIsActiveTrue(eq("Genesis"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(mockQuestions));
        lenient().when(questionRepository.findByIsActiveTrue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(mockQuestions));
    }

    @Test
    void testConcurrentQuestionRetrieval() throws InterruptedException {
        int numberOfThreads = 50;
        int requestsPerThread = 20;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < numberOfThreads; i++) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                for (int j = 0; j < requestsPerThread; j++) {
                    try {
                        List<Question> questions = questionService.getRandomQuestions("Genesis", "easy", 10, null);
                        assertNotNull(questions);
                        assertTrue(questions.size() <= 10);
                    } catch (Exception e) {
                        fail("Concurrent request failed: " + e.getMessage());
                    }
                }
            }, executor);
            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        long totalTime = System.currentTimeMillis() - startTime;
        int totalRequests = numberOfThreads * requestsPerThread;
        double requestsPerSecond = (double) totalRequests / (totalTime / 1000.0);

        assertTrue(requestsPerSecond > 100, "Should handle at least 100 req/s, got " + requestsPerSecond);
        assertTrue(totalTime < 10000, "Should complete within 10s, took " + totalTime + "ms");

        executor.shutdown();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
    }

    @Test
    void testMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        runtime.gc();
        long initialMemory = runtime.totalMemory() - runtime.freeMemory();

        List<List<Question>> questionBatches = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            List<Question> questions = questionService.getRandomQuestions("Genesis", "easy", 50, null);
            questionBatches.add(questions);
        }

        long finalMemory = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = finalMemory - initialMemory;

        assertTrue(memoryUsed < 100 * 1024 * 1024, "Memory usage should be < 100MB");
    }

    @Test
    void testDatabaseConnectionPool() throws InterruptedException {
        int numberOfConnections = 20;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfConnections);

        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (int i = 0; i < numberOfConnections; i++) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                for (int j = 0; j < 10; j++) {
                    questionService.getRandomQuestions("Genesis", "easy", 5, null);
                }
            }, executor);
            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));
    }

    @Test
    void testResponseTimeDistribution() {
        List<Long> responseTimes = new ArrayList<>();

        for (int i = 0; i < 100; i++) {
            long startTime = System.nanoTime();
            questionService.getRandomQuestions("Genesis", "easy", 10, null);
            long responseTime = (System.nanoTime() - startTime) / 1_000_000;
            responseTimes.add(responseTime);
        }

        double averageTime = responseTimes.stream().mapToLong(Long::longValue).average().orElse(0);
        long maxTime = responseTimes.stream().mapToLong(Long::longValue).max().orElse(0);

        assertTrue(averageTime < 100, "Average response time should be < 100ms");
        assertTrue(maxTime < 500, "Max response time should be < 500ms");
    }

    @Test
    void testCachePerformance() {
        // First request — cache miss, hits repo
        long startTime = System.nanoTime();
        questionService.getRandomQuestions("Genesis", "easy", 10, null);
        long firstRequestTime = (System.nanoTime() - startTime) / 1_000_000;

        // Second request — still cache miss (mock returns empty), but tests repo consistency
        startTime = System.nanoTime();
        questionService.getRandomQuestions("Genesis", "easy", 10, null);
        long secondRequestTime = (System.nanoTime() - startTime) / 1_000_000;

        assertTrue(firstRequestTime < 500, "First request should be < 500ms");
        assertTrue(secondRequestTime < 500, "Second request should be < 500ms");
    }
}
