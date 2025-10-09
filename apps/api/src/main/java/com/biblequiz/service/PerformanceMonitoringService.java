package com.biblequiz.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PerformanceMonitoringService {
    
    private static final Logger logger = LoggerFactory.getLogger("com.biblequiz.performance");
    private static final Logger appLogger = LoggerFactory.getLogger(PerformanceMonitoringService.class);
    
    private final ConcurrentHashMap<String, AtomicLong> methodCallCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> methodTotalTime = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> methodMaxTime = new ConcurrentHashMap<>();
    
    public void recordMethodExecution(String methodName, Duration executionTime) {
        recordMethodExecution(methodName, executionTime, null);
    }
    
    public void recordMethodExecution(String methodName, Duration executionTime, String additionalInfo) {
        long executionTimeMs = executionTime.toMillis();
        
        // Update counters
        methodCallCounts.computeIfAbsent(methodName, k -> new AtomicLong(0)).incrementAndGet();
        methodTotalTime.computeIfAbsent(methodName, k -> new AtomicLong(0)).addAndGet(executionTimeMs);
        methodMaxTime.computeIfAbsent(methodName, k -> new AtomicLong(0))
                .updateAndGet(current -> Math.max(current, executionTimeMs));
        
        // Log performance metrics
        String logMessage = String.format("PERF: %s executed in %dms", methodName, executionTimeMs);
        if (additionalInfo != null) {
            logMessage += " - " + additionalInfo;
        }
        
        if (executionTimeMs > 1000) { // Log slow operations
            logger.warn("SLOW_OPERATION: {}", logMessage);
        } else if (executionTimeMs > 500) {
            logger.info("MEDIUM_OPERATION: {}", logMessage);
        } else {
            logger.debug("FAST_OPERATION: {}", logMessage);
        }
    }
    
    public void logDatabaseQuery(String query, Duration executionTime, int resultCount) {
        long executionTimeMs = executionTime.toMillis();
        String logMessage = String.format("DB_QUERY: %s executed in %dms, returned %d results", 
                query.length() > 100 ? query.substring(0, 100) + "..." : query, 
                executionTimeMs, resultCount);
        
        if (executionTimeMs > 1000) {
            logger.warn("SLOW_DB_QUERY: {}", logMessage);
        } else {
            logger.debug("DB_QUERY: {}", logMessage);
        }
    }
    
    public void logApiCall(String endpoint, String method, Duration executionTime, int statusCode) {
        long executionTimeMs = executionTime.toMillis();
        String logMessage = String.format("API_CALL: %s %s - %dms - Status: %d", 
                method, endpoint, executionTimeMs, statusCode);
        
        if (executionTimeMs > 2000) {
            logger.warn("SLOW_API_CALL: {}", logMessage);
        } else if (executionTimeMs > 1000) {
            logger.info("MEDIUM_API_CALL: {}", logMessage);
        } else {
            logger.debug("API_CALL: {}", logMessage);
        }
    }
    
    public void logMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory();
        
        double usedPercentage = (double) usedMemory / maxMemory * 100;
        
        String logMessage = String.format("MEMORY: Used: %dMB (%.1f%%), Free: %dMB, Max: %dMB", 
                usedMemory / 1024 / 1024, usedPercentage, 
                freeMemory / 1024 / 1024, maxMemory / 1024 / 1024);
        
        if (usedPercentage > 80) {
            logger.warn("HIGH_MEMORY_USAGE: {}", logMessage);
        } else {
            logger.debug("MEMORY_USAGE: {}", logMessage);
        }
    }
    
    public void logPerformanceStats() {
        appLogger.info("=== Performance Statistics ===");
        
        methodCallCounts.forEach((methodName, callCount) -> {
            long totalTime = methodTotalTime.getOrDefault(methodName, new AtomicLong(0)).get();
            long maxTime = methodMaxTime.getOrDefault(methodName, new AtomicLong(0)).get();
            double avgTime = callCount.get() > 0 ? (double) totalTime / callCount.get() : 0;
            
            appLogger.info("Method: {} - Calls: {}, Total: {}ms, Avg: {:.2f}ms, Max: {}ms", 
                    methodName, callCount.get(), totalTime, avgTime, maxTime);
        });
        
        logMemoryUsage();
    }
    
    public void resetStats() {
        methodCallCounts.clear();
        methodTotalTime.clear();
        methodMaxTime.clear();
        appLogger.info("Performance statistics reset");
    }
}
