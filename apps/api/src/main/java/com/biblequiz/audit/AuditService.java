package com.biblequiz.audit;

import com.biblequiz.entity.User;
import com.biblequiz.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuditService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);
    
    @Autowired
    private AuditEventRepository auditEventRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public void logAdminAction(String action, String resource, String details, 
                              HttpServletRequest request, AuditEventStatus status) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Attempted to log admin action without authentication");
                return;
            }
            
            String userEmail = auth.getName();
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                logger.warn("User not found for audit logging: {}", userEmail);
                return;
            }
            
            User user = userOpt.get();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            AuditEvent auditEvent = new AuditEvent(
                user.getId(),
                user.getEmail(),
                action,
                resource,
                details,
                ipAddress,
                userAgent,
                AuditEventType.ADMIN_ACTION,
                status
            );
            
            auditEventRepository.save(auditEvent);
            
            logger.info("Audit event logged: {} by {} ({})", action, user.getEmail(), status);
            
        } catch (Exception e) {
            logger.error("Failed to log audit event: {}", e.getMessage(), e);
        }
    }
    
    public void logUserAction(String action, String resource, String details, 
                             HttpServletRequest request, AuditEventStatus status) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return;
            }
            
            String userEmail = auth.getName();
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                return;
            }
            
            User user = userOpt.get();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            AuditEvent auditEvent = new AuditEvent(
                user.getId(),
                user.getEmail(),
                action,
                resource,
                details,
                ipAddress,
                userAgent,
                AuditEventType.USER_UPDATE,
                status
            );
            
            auditEventRepository.save(auditEvent);
            
        } catch (Exception e) {
            logger.error("Failed to log user action: {}", e.getMessage(), e);
        }
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
}
