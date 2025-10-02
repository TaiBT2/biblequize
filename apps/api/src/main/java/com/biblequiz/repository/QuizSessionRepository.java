package com.biblequiz.repository;

import com.biblequiz.entity.QuizSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizSessionRepository extends JpaRepository<QuizSession, String> {
    
    Page<QuizSession> findByOwnerIdOrderByCreatedAtDesc(String ownerId, Pageable pageable);
    
    List<QuizSession> findByOwnerIdAndStatus(String ownerId, QuizSession.Status status);
    
    @Query("SELECT qs FROM QuizSession qs WHERE qs.owner.id = :ownerId AND qs.mode = :mode ORDER BY qs.createdAt DESC")
    Page<QuizSession> findByOwnerIdAndModeOrderByCreatedAtDesc(@Param("ownerId") String ownerId, 
                                                              @Param("mode") QuizSession.Mode mode, 
                                                              Pageable pageable);
    
    @Query("SELECT qs FROM QuizSession qs WHERE qs.owner.id = :ownerId AND qs.status = :status AND qs.createdAt >= :since")
    List<QuizSession> findByOwnerIdAndStatusAndCreatedAtAfter(@Param("ownerId") String ownerId,
                                                             @Param("status") QuizSession.Status status,
                                                             @Param("since") LocalDateTime since);
    
    long countByOwnerIdAndStatus(String ownerId, QuizSession.Status status);
    
    @Query("SELECT COUNT(qs) FROM QuizSession qs WHERE qs.owner.id = :ownerId AND qs.mode = 'ranked' AND qs.createdAt >= :since")
    long countRankedSessionsByOwnerIdAndCreatedAtAfter(@Param("ownerId") String ownerId, @Param("since") LocalDateTime since);
}
