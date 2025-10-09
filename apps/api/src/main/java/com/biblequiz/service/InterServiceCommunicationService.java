package com.biblequiz.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class InterServiceCommunicationService {
    
    private static final Logger logger = LoggerFactory.getLogger(InterServiceCommunicationService.class);
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private PerformanceMonitoringService performanceMonitoringService;
    
    // Circuit breaker pattern implementation
    private final Map<String, CircuitBreakerState> circuitBreakers = new java.util.concurrent.ConcurrentHashMap<>();
    
    public <T> T callService(String serviceName, String endpoint, HttpMethod method, Object requestBody, Class<T> responseType) {
        return callService(serviceName, endpoint, method, requestBody, responseType, 5000);
    }
    
    public <T> T callService(String serviceName, String endpoint, HttpMethod method, Object requestBody, Class<T> responseType, int timeoutMs) {
        String url = buildServiceUrl(serviceName, endpoint);
        
        // Check circuit breaker
        if (isCircuitOpen(serviceName)) {
            throw new ServiceUnavailableException("Circuit breaker is open for service: " + serviceName);
        }
        
        Instant start = Instant.now();
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("X-Service-Caller", "biblequiz-api");
            
            HttpEntity<Object> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<T> response = restTemplate.exchange(
                url, 
                method, 
                entity, 
                responseType
            );
            
            Duration executionTime = Duration.between(start, Instant.now());
            performanceMonitoringService.recordMethodExecution(
                "INTER_SERVICE:" + serviceName + "." + endpoint, 
                executionTime
            );
            
            // Reset circuit breaker on success
            resetCircuitBreaker(serviceName);
            
            return response.getBody();
            
        } catch (Exception e) {
            Duration executionTime = Duration.between(start, Instant.now());
            performanceMonitoringService.recordMethodExecution(
                "INTER_SERVICE:" + serviceName + "." + endpoint, 
                executionTime, 
                "ERROR: " + e.getMessage()
            );
            
            // Record failure in circuit breaker
            recordFailure(serviceName);
            
            logger.error("Failed to call service {} at endpoint {}: {}", serviceName, endpoint, e.getMessage());
            throw new ServiceCommunicationException("Failed to communicate with service: " + serviceName, e);
        }
    }
    
    public <T> CompletableFuture<T> callServiceAsync(String serviceName, String endpoint, HttpMethod method, Object requestBody, Class<T> responseType) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return callService(serviceName, endpoint, method, requestBody, responseType);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }
    
    public <T> T callServiceWithRetry(String serviceName, String endpoint, HttpMethod method, Object requestBody, Class<T> responseType, int maxRetries) {
        Exception lastException = null;
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return callService(serviceName, endpoint, method, requestBody, responseType);
            } catch (Exception e) {
                lastException = e;
                logger.warn("Attempt {} failed for service {}: {}", attempt, serviceName, e.getMessage());
                
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(1000 * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(ie);
                    }
                }
            }
        }
        
        throw new ServiceCommunicationException("All retry attempts failed for service: " + serviceName, lastException);
    }
    
    private String buildServiceUrl(String serviceName, String endpoint) {
        // In a real microservices environment, this would use service discovery
        // For now, we'll use environment variables or configuration
        String baseUrl = System.getenv(serviceName.toUpperCase() + "_SERVICE_URL");
        if (baseUrl == null) {
            baseUrl = "http://localhost:8080"; // Default to local
        }
        
        return baseUrl + endpoint;
    }
    
    private boolean isCircuitOpen(String serviceName) {
        CircuitBreakerState state = circuitBreakers.get(serviceName);
        if (state == null) {
            return false;
        }
        
        if (state.isOpen() && Duration.between(state.getLastFailureTime(), Instant.now()).toSeconds() > 60) {
            // Try to reset after 60 seconds
            resetCircuitBreaker(serviceName);
            return false;
        }
        
        return state.isOpen();
    }
    
    private void recordFailure(String serviceName) {
        circuitBreakers.computeIfAbsent(serviceName, k -> new CircuitBreakerState())
                .recordFailure();
    }
    
    private void resetCircuitBreaker(String serviceName) {
        circuitBreakers.computeIfAbsent(serviceName, k -> new CircuitBreakerState())
                .reset();
    }
    
    // Circuit Breaker State
    private static class CircuitBreakerState {
        private int failureCount = 0;
        private Instant lastFailureTime;
        private boolean open = false;
        
        public void recordFailure() {
            failureCount++;
            lastFailureTime = Instant.now();
            
            if (failureCount >= 5) { // Open circuit after 5 failures
                open = true;
            }
        }
        
        public void reset() {
            failureCount = 0;
            open = false;
        }
        
        public boolean isOpen() {
            return open;
        }
        
        public Instant getLastFailureTime() {
            return lastFailureTime;
        }
    }
    
    // Custom Exceptions
    public static class ServiceCommunicationException extends RuntimeException {
        public ServiceCommunicationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    public static class ServiceUnavailableException extends RuntimeException {
        public ServiceUnavailableException(String message) {
            super(message);
        }
    }
}
