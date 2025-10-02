package com.biblequiz.repository;

import com.biblequiz.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, String> {
    
    Page<Feedback> findByStatusOrderByCreatedAtDesc(Feedback.Status status, Pageable pageable);
    
    Page<Feedback> findByTypeOrderByCreatedAtDesc(Feedback.Type type, Pageable pageable);
    
    Page<Feedback> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    @Query("SELECT f FROM Feedback f WHERE f.status = :status AND f.type = :type ORDER BY f.createdAt DESC")
    Page<Feedback> findByStatusAndTypeOrderByCreatedAtDesc(@Param("status") Feedback.Status status, 
                                                          @Param("type") Feedback.Type type, 
                                                          Pageable pageable);
    
    @Query("SELECT f FROM Feedback f WHERE f.question.id = :questionId ORDER BY f.createdAt DESC")
    List<Feedback> findByQuestionIdOrderByCreatedAtDesc(@Param("questionId") String questionId);
    
    long countByStatus(Feedback.Status status);
    
    long countByType(Feedback.Type type);
}
