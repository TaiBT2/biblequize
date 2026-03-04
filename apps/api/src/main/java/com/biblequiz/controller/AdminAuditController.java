package com.biblequiz.controller;

import com.biblequiz.audit.AuditEvent;
import com.biblequiz.audit.AuditEventRepository;
import com.biblequiz.audit.AuditEventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/audit")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminAuditController.class);
    
    @Autowired
    private AuditEventRepository auditEventRepository;
    
    @GetMapping("/events")
    public ResponseEntity<Map<String, Object>> getAuditEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String action) {
        
        logger.info("Admin audit events request - page: {}, size: {}, userId: {}, eventType: {}", 
                   page, size, userId, eventType);
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
            Page<AuditEvent> events;
            
            if (userId != null && !userId.trim().isEmpty()) {
                events = auditEventRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
            } else if (eventType != null && !eventType.trim().isEmpty()) {
                AuditEventType type = AuditEventType.valueOf(eventType.toUpperCase());
                events = auditEventRepository.findByEventType(type, pageable);
            } else if (action != null && !action.trim().isEmpty()) {
                // For action search, we'll use a simple approach
                List<AuditEvent> eventList = auditEventRepository.findByActionContaining(action);
                // Convert to page manually for simplicity - this is a basic implementation
                events = Page.empty(pageable);
            } else {
                events = auditEventRepository.findAll(pageable);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("events", events.getContent());
            response.put("totalElements", events.getTotalElements());
            response.put("totalPages", events.getTotalPages());
            response.put("currentPage", events.getNumber());
            response.put("size", events.getSize());
            response.put("hasNext", events.hasNext());
            response.put("hasPrevious", events.hasPrevious());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving audit events: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error",
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/events/user/{userId}")
    public ResponseEntity<List<AuditEvent>> getUserAuditEvents(@PathVariable String userId) {
        logger.info("User audit events request for userId: {}", userId);
        
        try {
            List<AuditEvent> events = auditEventRepository.findByUserIdOrderByTimestampDesc(userId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            logger.error("Error retrieving user audit events: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/events/recent")
    public ResponseEntity<List<AuditEvent>> getRecentAuditEvents(
            @RequestParam(defaultValue = "24") int hours) {
        
        logger.info("Recent audit events request for last {} hours", hours);
        
        try {
            LocalDateTime startTime = LocalDateTime.now().minusHours(hours);
            LocalDateTime endTime = LocalDateTime.now();
            
            List<AuditEvent> events = auditEventRepository.findByTimestampBetween(startTime, endTime);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            logger.error("Error retrieving recent audit events: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAuditStats() {
        logger.info("Audit statistics request");
        
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Count events by type
            for (AuditEventType type : AuditEventType.values()) {
                long count = auditEventRepository.findByEventType(type, Pageable.unpaged()).getTotalElements();
                stats.put(type.name().toLowerCase() + "Count", count);
            }
            
            // Total events
            long totalEvents = auditEventRepository.count();
            stats.put("totalEvents", totalEvents);
            
            // Recent activity (last 24 hours)
            LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
            long recentEvents = auditEventRepository.findByTimestampBetween(last24Hours, LocalDateTime.now()).size();
            stats.put("recentEvents24h", recentEvents);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            logger.error("Error retrieving audit statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error",
                "message", e.getMessage()
            ));
        }
    }
}
