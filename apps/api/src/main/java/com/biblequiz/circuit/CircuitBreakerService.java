package com.biblequiz.circuit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class CircuitBreakerService {
    
    private static final Logger logger = LoggerFactory.getLogger(CircuitBreakerService.class);
    
    private final ConcurrentHashMap<String, CircuitBreaker> circuitBreakers = new ConcurrentHashMap<>();
    
    public CircuitBreaker getCircuitBreaker(String name) {
        return circuitBreakers.computeIfAbsent(name, k -> new CircuitBreaker(name));
    }
    
    public <T> T execute(String circuitName, CircuitBreakerOperation<T> operation) {
        CircuitBreaker circuitBreaker = getCircuitBreaker(circuitName);
        
        if (circuitBreaker.isOpen()) {
            throw new CircuitBreakerOpenException("Circuit breaker is open for: " + circuitName);
        }
        
        try {
            T result = operation.execute();
            circuitBreaker.recordSuccess();
            return result;
        } catch (Exception e) {
            circuitBreaker.recordFailure();
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            } else {
                throw new RuntimeException("Circuit breaker operation failed", e);
            }
        }
    }
    
    public CircuitBreakerStats getStats(String circuitName) {
        CircuitBreaker circuitBreaker = getCircuitBreaker(circuitName);
        return circuitBreaker.getStats();
    }
    
    public void resetCircuitBreaker(String circuitName) {
        CircuitBreaker circuitBreaker = circuitBreakers.get(circuitName);
        if (circuitBreaker != null) {
            circuitBreaker.reset();
            logger.info("Reset circuit breaker: {}", circuitName);
        }
    }
    
    @FunctionalInterface
    public interface CircuitBreakerOperation<T> {
        T execute() throws Exception;
    }
    
    public static class CircuitBreaker {
        private final String name;
        private final AtomicInteger failureCount = new AtomicInteger(0);
        private final AtomicInteger successCount = new AtomicInteger(0);
        private final AtomicLong totalRequests = new AtomicLong(0);
        private final AtomicLong totalFailures = new AtomicLong(0);
        private final AtomicLong totalSuccesses = new AtomicLong(0);
        
        private volatile CircuitState state = CircuitState.CLOSED;
        private volatile Instant lastFailureTime;
        private volatile Instant lastSuccessTime;
        
        private final int failureThreshold = 5;
        private final Duration timeoutDuration = Duration.ofMinutes(1);
        private final Duration halfOpenMaxCalls = Duration.ofSeconds(30);
        
        public CircuitBreaker(String name) {
            this.name = name;
        }
        
        public boolean isOpen() {
            return state == CircuitState.OPEN;
        }
        
        public boolean isClosed() {
            return state == CircuitState.CLOSED;
        }
        
        public boolean isHalfOpen() {
            return state == CircuitState.HALF_OPEN;
        }
        
        public void recordSuccess() {
            totalRequests.incrementAndGet();
            totalSuccesses.incrementAndGet();
            successCount.incrementAndGet();
            lastSuccessTime = Instant.now();
            
            if (state == CircuitState.HALF_OPEN) {
                state = CircuitState.CLOSED;
                failureCount.set(0);
                logger.info("Circuit breaker {} transitioned from HALF_OPEN to CLOSED", name);
            }
        }
        
        public void recordFailure() {
            totalRequests.incrementAndGet();
            totalFailures.incrementAndGet();
            failureCount.incrementAndGet();
            lastFailureTime = Instant.now();
            
            if (state == CircuitState.CLOSED && failureCount.get() >= failureThreshold) {
                state = CircuitState.OPEN;
                logger.warn("Circuit breaker {} transitioned from CLOSED to OPEN", name);
            } else if (state == CircuitState.HALF_OPEN) {
                state = CircuitState.OPEN;
                logger.warn("Circuit breaker {} transitioned from HALF_OPEN to OPEN", name);
            }
        }
        
        public void reset() {
            state = CircuitState.CLOSED;
            failureCount.set(0);
            successCount.set(0);
            lastFailureTime = null;
            lastSuccessTime = null;
        }
        
        public void attemptReset() {
            if (state == CircuitState.OPEN) {
                if (lastFailureTime != null && Duration.between(lastFailureTime, Instant.now()).compareTo(timeoutDuration) > 0) {
                    state = CircuitState.HALF_OPEN;
                    logger.info("Circuit breaker {} transitioned from OPEN to HALF_OPEN", name);
                }
            }
        }
        
        public CircuitBreakerStats getStats() {
            return new CircuitBreakerStats(
                    name,
                    state,
                    totalRequests.get(),
                    totalSuccesses.get(),
                    totalFailures.get(),
                    failureCount.get(),
                    successCount.get(),
                    lastFailureTime,
                    lastSuccessTime
            );
        }
    }
    
    public enum CircuitState {
        CLOSED, OPEN, HALF_OPEN
    }
    
    public static class CircuitBreakerStats {
        private final String name;
        private final CircuitState state;
        private final long totalRequests;
        private final long totalSuccesses;
        private final long totalFailures;
        private final int currentFailureCount;
        private final int currentSuccessCount;
        private final Instant lastFailureTime;
        private final Instant lastSuccessTime;
        
        public CircuitBreakerStats(String name, CircuitState state, long totalRequests, 
                                 long totalSuccesses, long totalFailures, int currentFailureCount, 
                                 int currentSuccessCount, Instant lastFailureTime, Instant lastSuccessTime) {
            this.name = name;
            this.state = state;
            this.totalRequests = totalRequests;
            this.totalSuccesses = totalSuccesses;
            this.totalFailures = totalFailures;
            this.currentFailureCount = currentFailureCount;
            this.currentSuccessCount = currentSuccessCount;
            this.lastFailureTime = lastFailureTime;
            this.lastSuccessTime = lastSuccessTime;
        }
        
        public String getName() { return name; }
        public CircuitState getState() { return state; }
        public long getTotalRequests() { return totalRequests; }
        public long getTotalSuccesses() { return totalSuccesses; }
        public long getTotalFailures() { return totalFailures; }
        public int getCurrentFailureCount() { return currentFailureCount; }
        public int getCurrentSuccessCount() { return currentSuccessCount; }
        public Instant getLastFailureTime() { return lastFailureTime; }
        public Instant getLastSuccessTime() { return lastSuccessTime; }
        
        public double getSuccessRate() {
            return totalRequests > 0 ? (double) totalSuccesses / totalRequests : 0.0;
        }
        
        public double getFailureRate() {
            return totalRequests > 0 ? (double) totalFailures / totalRequests : 0.0;
        }
    }
    
    public static class CircuitBreakerOpenException extends RuntimeException {
        public CircuitBreakerOpenException(String message) {
            super(message);
        }
    }
}
