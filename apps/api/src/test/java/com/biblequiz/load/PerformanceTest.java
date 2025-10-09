package com.biblequiz.load;

import com.biblequiz.entity.Question;
import com.biblequiz.service.QuestionService;
import com.biblequiz.service.SessionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ContextConfiguration(classes = LoadTestConfig.class)
@Transactional
public class PerformanceTest {
    
    @Autowired
    private QuestionService questionService;
    
    @Autowired
    private SessionService sessionService;
    
    private List<Question> testQuestions;
    
    @BeforeEach
    void setUp() {
        // Create test questions for performance testing
        testQuestions = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            Question question = new Question();
            question.setId("q" + i);
            question.setBook("Genesis");
            question.setChapter(1);
            question.setDifficulty(Question.Difficulty.easy);
            question.setType(Question.Type.multiple_choice_single);
            question.setContent("Test question " + i);
            question.setOptions(List.of("A", "B", "C", "D"));
            question.setCorrectAnswer(List.of(0));
            question.setIsActive(true);
            testQuestions.add(question);
        }
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
        
        // Wait for all requests to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        
        long endTime = System.currentTimeMillis();
        long totalTime = endTime - startTime;
        int totalRequests = numberOfThreads * requestsPerThread;
        double requestsPerSecond = (double) totalRequests / (totalTime / 1000.0);
        
        System.out.println("Performance Test Results:");
        System.out.println("Total Requests: " + totalRequests);
        System.out.println("Total Time: " + totalTime + "ms");
        System.out.println("Requests per Second: " + String.format("%.2f", requestsPerSecond));
        
        // Performance assertions
        assertTrue(requestsPerSecond > 100, "Should handle at least 100 requests per second");
        assertTrue(totalTime < 10000, "Should complete within 10 seconds");
        
        executor.shutdown();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
    }
    
    @Test
    void testMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long initialMemory = runtime.totalMemory() - runtime.freeMemory();
        
        // Perform memory-intensive operations
        List<List<Question>> questionBatches = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            List<Question> questions = questionService.getRandomQuestions("Genesis", "easy", 50, null);
            questionBatches.add(questions);
        }
        
        long finalMemory = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = finalMemory - initialMemory;
        
        System.out.println("Memory Usage Test:");
        System.out.println("Initial Memory: " + (initialMemory / 1024 / 1024) + "MB");
        System.out.println("Final Memory: " + (finalMemory / 1024 / 1024) + "MB");
        System.out.println("Memory Used: " + (memoryUsed / 1024 / 1024) + "MB");
        
        // Memory usage should be reasonable
        assertTrue(memoryUsed < 100 * 1024 * 1024, "Memory usage should be less than 100MB");
    }
    
    @Test
    void testDatabaseConnectionPool() throws InterruptedException {
        int numberOfConnections = 20;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfConnections);
        
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        
        for (int i = 0; i < numberOfConnections; i++) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    // Simulate database operations
                    for (int j = 0; j < 10; j++) {
                        questionService.getRandomQuestions("Genesis", "easy", 5, null);
                        Thread.sleep(100); // Simulate processing time
                    }
                } catch (Exception e) {
                    fail("Database connection test failed: " + e.getMessage());
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
            long endTime = System.nanoTime();
            
            long responseTime = (endTime - startTime) / 1_000_000; // Convert to milliseconds
            responseTimes.add(responseTime);
        }
        
        // Calculate statistics
        long totalTime = responseTimes.stream().mapToLong(Long::longValue).sum();
        double averageTime = (double) totalTime / responseTimes.size();
        long maxTime = responseTimes.stream().mapToLong(Long::longValue).max().orElse(0);
        long minTime = responseTimes.stream().mapToLong(Long::longValue).min().orElse(0);
        
        System.out.println("Response Time Distribution:");
        System.out.println("Average: " + String.format("%.2f", averageTime) + "ms");
        System.out.println("Min: " + minTime + "ms");
        System.out.println("Max: " + maxTime + "ms");
        
        // Performance assertions
        assertTrue(averageTime < 100, "Average response time should be less than 100ms");
        assertTrue(maxTime < 500, "Maximum response time should be less than 500ms");
    }
    
    @Test
    void testCachePerformance() {
        // First request (cache miss)
        long startTime = System.nanoTime();
        questionService.getRandomQuestions("Genesis", "easy", 10, null);
        long firstRequestTime = (System.nanoTime() - startTime) / 1_000_000;
        
        // Second request (cache hit)
        startTime = System.nanoTime();
        questionService.getRandomQuestions("Genesis", "easy", 10, null);
        long secondRequestTime = (System.nanoTime() - startTime) / 1_000_000;
        
        System.out.println("Cache Performance:");
        System.out.println("First Request (Cache Miss): " + firstRequestTime + "ms");
        System.out.println("Second Request (Cache Hit): " + secondRequestTime + "ms");
        System.out.println("Cache Speedup: " + String.format("%.2fx", (double) firstRequestTime / secondRequestTime));
        
        // Cache should provide significant speedup
        assertTrue(secondRequestTime < firstRequestTime, "Cache hit should be faster than cache miss");
    }
}
