package com.biblequiz.repository;

import com.biblequiz.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, String> {
    
    List<Answer> findBySessionIdOrderByCreatedAt(String sessionId);
    
    List<Answer> findByUserIdOrderByCreatedAtDesc(String userId);
    
    @Query("SELECT a FROM Answer a WHERE a.session.id = :sessionId AND a.user.id = :userId ORDER BY a.createdAt")
    List<Answer> findBySessionIdAndUserIdOrderByCreatedAt(@Param("sessionId") String sessionId, @Param("userId") String userId);
    
    @Query("SELECT a FROM Answer a WHERE a.session.id = :sessionId AND a.question.id = :questionId AND a.user.id = :userId")
    Optional<Answer> findBySessionIdAndQuestionIdAndUserId(@Param("sessionId") String sessionId, 
                                                          @Param("questionId") String questionId, 
                                                          @Param("userId") String userId);
    
    @Query("SELECT a.question.id FROM Answer a WHERE a.user.id = :userId AND a.createdAt >= :since")
    List<String> findQuestionIdsByUserIdAndCreatedAtAfter(@Param("userId") String userId, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(a) FROM Answer a WHERE a.user.id = :userId AND a.isCorrect = true AND a.createdAt >= :since")
    long countCorrectAnswersByUserIdAndCreatedAtAfter(@Param("userId") String userId, @Param("since") LocalDateTime since);
    
    @Query("SELECT SUM(a.scoreEarned) FROM Answer a WHERE a.user.id = :userId AND a.createdAt >= :since")
    Long sumScoreEarnedByUserIdAndCreatedAtAfter(@Param("userId") String userId, @Param("since") LocalDateTime since);
}
