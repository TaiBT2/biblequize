package com.biblequiz.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, String> {
    
    List<AuditEvent> findByUserIdOrderByTimestampDesc(String userId);
    
    Page<AuditEvent> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);
    
    List<AuditEvent> findByUserEmailOrderByTimestampDesc(String userEmail);
    
    List<AuditEvent> findByEventTypeOrderByTimestampDesc(AuditEventType eventType);
    
    List<AuditEvent> findByStatusOrderByTimestampDesc(AuditEventStatus status);
    
    @Query("SELECT a FROM AuditEvent a WHERE a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    List<AuditEvent> findByTimestampBetween(@Param("startDate") LocalDateTime startDate, 
                                          @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT a FROM AuditEvent a WHERE a.userId = :userId AND a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    List<AuditEvent> findByUserIdAndTimestampBetween(@Param("userId") String userId,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
    
    Page<AuditEvent> findByEventType(AuditEventType eventType, Pageable pageable);
    
    @Query("SELECT a FROM AuditEvent a WHERE a.action LIKE %:action% ORDER BY a.timestamp DESC")
    List<AuditEvent> findByActionContaining(@Param("action") String action);
}
