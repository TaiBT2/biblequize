package com.biblequiz.repository;

import com.biblequiz.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {
    
    Page<Question> findByIsActiveTrue(Pageable pageable);
    
    Page<Question> findByBookAndIsActiveTrue(String book, Pageable pageable);
    
    Page<Question> findByBookAndChapterAndIsActiveTrue(String book, Integer chapter, Pageable pageable);
    
    Page<Question> findByDifficultyAndIsActiveTrue(Question.Difficulty difficulty, Pageable pageable);
    
    Page<Question> findByTypeAndIsActiveTrue(Question.Type type, Pageable pageable);
    
    Page<Question> findByLanguageAndIsActiveTrue(String language, Pageable pageable);
    
    @Query("SELECT q FROM Question q WHERE q.isActive = true AND " +
           "(:book IS NULL OR q.book = :book) AND " +
           "(:chapter IS NULL OR q.chapter = :chapter) AND " +
           "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
           "(:type IS NULL OR q.type = :type) AND " +
           "(:language IS NULL OR q.language = :language)")
    Page<Question> findWithFilters(@Param("book") String book,
                                  @Param("chapter") Integer chapter,
                                  @Param("difficulty") Question.Difficulty difficulty,
                                  @Param("type") Question.Type type,
                                  @Param("language") String language,
                                  Pageable pageable);
    
    // Random selection will be implemented in service layer using count + random page
    
    long countByIsActiveTrue();
    
    long countByBookAndIsActiveTrue(String book);
    
    long countByDifficultyAndIsActiveTrue(Question.Difficulty difficulty);
    
    // Derived queries to support service-side randomization and filtering
    Page<Question> findByBookAndDifficultyAndIsActiveTrue(String book, Question.Difficulty difficulty, Pageable pageable);
}
