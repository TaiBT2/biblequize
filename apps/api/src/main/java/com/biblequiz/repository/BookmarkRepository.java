package com.biblequiz.repository;

import com.biblequiz.entity.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, String> {
    
    Page<Bookmark> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    @Query("SELECT b FROM Bookmark b WHERE b.user.id = :userId AND b.question.id = :questionId")
    Optional<Bookmark> findByUserIdAndQuestionId(@Param("userId") String userId, @Param("questionId") String questionId);
    
    @Query("SELECT b.question.id FROM Bookmark b WHERE b.user.id = :userId")
    List<String> findQuestionIdsByUserId(@Param("userId") String userId);
    
    boolean existsByUserIdAndQuestionId(String userId, String questionId);
    
    void deleteByUserIdAndQuestionId(String userId, String questionId);
}
