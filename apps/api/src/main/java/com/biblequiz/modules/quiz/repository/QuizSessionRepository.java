package com.biblequiz.modules.quiz.repository;

import com.biblequiz.modules.quiz.entity.QuizSession;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    @Query("SELECT qs FROM QuizSession qs WHERE qs.status = com.biblequiz.modules.quiz.entity.QuizSession.Status.in_progress AND qs.mode = com.biblequiz.modules.quiz.entity.QuizSession.Mode.ranked AND qs.lastActivityAt < :cutoff")
    List<QuizSession> findAbandonedRankedSessions(@Param("cutoff") LocalDateTime cutoff);

    /**
     * Practice/single in_progress sessions inactive past cutoff. Includes rows
     * where lastActivityAt is NULL (never touched) but createdAt < cutoff —
     * covers orphans from before the lifecycle fix.
     */
    @Query("SELECT qs FROM QuizSession qs WHERE qs.status = com.biblequiz.modules.quiz.entity.QuizSession.Status.in_progress AND qs.mode IN (com.biblequiz.modules.quiz.entity.QuizSession.Mode.practice, com.biblequiz.modules.quiz.entity.QuizSession.Mode.single) AND ((qs.lastActivityAt IS NOT NULL AND qs.lastActivityAt < :cutoff) OR (qs.lastActivityAt IS NULL AND qs.createdAt < :cutoff))")
    List<QuizSession> findAbandonedPracticeSessions(@Param("cutoff") LocalDateTime cutoff);
    
    @Query("SELECT COUNT(qs) FROM QuizSession qs WHERE qs.owner.id = :ownerId AND qs.mode = 'ranked' AND qs.createdAt >= :since")
    long countRankedSessionsByOwnerIdAndCreatedAtAfter(@Param("ownerId") String ownerId, @Param("since") LocalDateTime since);

    long countByCreatedAtAfter(LocalDateTime since);

    /**
     * Delete practice/single sessions in terminal status whose endedAt is older than cutoff.
     * Children (answers, lifeline_usage, quiz_session_questions) cascade via FK.
     * Ranked sessions intentionally excluded — they are part of leaderboard audit trail.
     */
    @Modifying
    @Query("DELETE FROM QuizSession qs WHERE qs.mode IN (com.biblequiz.modules.quiz.entity.QuizSession.Mode.practice, com.biblequiz.modules.quiz.entity.QuizSession.Mode.single) AND qs.status IN (com.biblequiz.modules.quiz.entity.QuizSession.Status.completed, com.biblequiz.modules.quiz.entity.QuizSession.Status.abandoned) AND qs.endedAt < :cutoff")
    int deleteOldPracticeSessions(@Param("cutoff") LocalDateTime cutoff);
}
