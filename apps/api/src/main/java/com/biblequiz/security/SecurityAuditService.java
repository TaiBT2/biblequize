package com.biblequiz.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class SecurityAuditService {
    
    private static final Logger logger = LoggerFactory.getLogger(SecurityAuditService.class);
    
    // Rate limiting for security events
    private final ConcurrentHashMap<String, AtomicInteger> failedAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LocalDateTime> lastAttempt = new ConcurrentHashMap<>();
    
    // Security thresholds
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 15;
    
    public void logSecurityEvent(String event, String details, HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        String sessionId = request.getSession(false) != null ? request.getSession().getId() : "anonymous";
        
        logger.warn("SECURITY_EVENT: {} - IP: {} - UserAgent: {} - Session: {} - Details: {}", 
                event, clientIp, userAgent, sessionId, details);
        
        // Store security event for analysis
        storeSecurityEvent(event, clientIp, userAgent, sessionId, details);
    }
    
    public void logAuthenticationAttempt(String username, boolean success, HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        
        if (!success) {
            recordFailedAttempt(clientIp);
            logger.warn("FAILED_AUTH_ATTEMPT: {} from IP: {}", username, clientIp);
        } else {
            resetFailedAttempts(clientIp);
            logger.info("SUCCESSFUL_AUTH: {} from IP: {}", username, clientIp);
        }
    }
    
    public void logAuthorizationFailure(String resource, String action, HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";
        
        logger.warn("AUTHORIZATION_FAILURE: User: {} attempted {} on {} from IP: {}", 
                username, action, resource, clientIp);
        
        logSecurityEvent("AUTHORIZATION_FAILURE", 
                String.format("User: %s, Action: %s, Resource: %s", username, action, resource), 
                request);
    }
    
    public void logSuspiciousActivity(String activity, String details, HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        
        logger.error("SUSPICIOUS_ACTIVITY: {} from IP: {} - Details: {}", activity, clientIp, details);
        
        logSecurityEvent("SUSPICIOUS_ACTIVITY", 
                String.format("Activity: %s, Details: %s", activity, details), 
                request);
    }
    
    public boolean isRateLimited(String clientIp) {
        AtomicInteger attempts = failedAttempts.get(clientIp);
        if (attempts == null) {
            return false;
        }
        
        LocalDateTime lastAttemptTime = lastAttempt.get(clientIp);
        if (lastAttemptTime == null) {
            return false;
        }
        
        // Check if we're still in the rate limit window
        if (LocalDateTime.now().minusMinutes(RATE_LIMIT_WINDOW_MINUTES).isAfter(lastAttemptTime)) {
            // Reset if outside window
            resetFailedAttempts(clientIp);
            return false;
        }
        
        return attempts.get() >= MAX_FAILED_ATTEMPTS;
    }
    
    public void logDataAccess(String dataType, String action, String userId, HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        
        logger.info("DATA_ACCESS: User: {} performed {} on {} from IP: {}", 
                userId, action, dataType, clientIp);
    }
    
    public void logAPIUsage(String endpoint, String method, int statusCode, long responseTime, HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";
        
        logger.info("API_USAGE: {} {} - Status: {} - Time: {}ms - User: {} - IP: {}", 
                method, endpoint, statusCode, responseTime, username, clientIp);
        
        // Log suspicious patterns
        if (statusCode >= 400) {
            logSecurityEvent("API_ERROR", 
                    String.format("Endpoint: %s, Status: %d, User: %s", endpoint, statusCode, username), 
                    request);
        }
    }
    
    private void recordFailedAttempt(String clientIp) {
        failedAttempts.computeIfAbsent(clientIp, k -> new AtomicInteger(0)).incrementAndGet();
        lastAttempt.put(clientIp, LocalDateTime.now());
    }
    
    private void resetFailedAttempts(String clientIp) {
        failedAttempts.remove(clientIp);
        lastAttempt.remove(clientIp);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    private void storeSecurityEvent(String event, String clientIp, String userAgent, String sessionId, String details) {
        // In a real application, this would store to a security database
        // For now, we'll just log it
        logger.info("SECURITY_EVENT_STORED: {} - IP: {} - Time: {}", event, clientIp, LocalDateTime.now());
    }
    
    // Security metrics
    public SecurityMetrics getSecurityMetrics() {
        int totalFailedAttempts = failedAttempts.values().stream()
                .mapToInt(AtomicInteger::get)
                .sum();
        
        int blockedIPs = (int) failedAttempts.entrySet().stream()
                .filter(entry -> entry.getValue().get() >= MAX_FAILED_ATTEMPTS)
                .count();
        
        return new SecurityMetrics(totalFailedAttempts, blockedIPs, LocalDateTime.now());
    }
    
    public static class SecurityMetrics {
        private final int totalFailedAttempts;
        private final int blockedIPs;
        private final LocalDateTime timestamp;
        
        public SecurityMetrics(int totalFailedAttempts, int blockedIPs, LocalDateTime timestamp) {
            this.totalFailedAttempts = totalFailedAttempts;
            this.blockedIPs = blockedIPs;
            this.timestamp = timestamp;
        }
        
        public int getTotalFailedAttempts() { return totalFailedAttempts; }
        public int getBlockedIPs() { return blockedIPs; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
