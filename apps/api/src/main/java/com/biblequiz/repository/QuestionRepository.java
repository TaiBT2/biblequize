package com.biblequiz.repository;

import com.biblequiz.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


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
    
    long countByBookAndDifficultyAndIsActiveTrue(String book, Question.Difficulty difficulty);
    
    // Derived queries to support service-side randomization and filtering
    Page<Question> findByBookAndDifficultyAndIsActiveTrue(String book, Question.Difficulty difficulty, Pageable pageable);
    
    // Optimized queries for better performance
    @Query("SELECT q FROM Question q WHERE q.isActive = true AND q.id NOT IN :excludeIds ORDER BY RAND()")
    List<Question> findRandomQuestionsExcludingIds(@Param("excludeIds") List<String> excludeIds, Pageable pageable);
    
    @Query("SELECT q FROM Question q WHERE q.isActive = true AND q.book = :book AND q.id NOT IN :excludeIds ORDER BY RAND()")
    List<Question> findRandomQuestionsByBookExcludingIds(@Param("book") String book, 
                                                         @Param("excludeIds") List<String> excludeIds, 
                                                         Pageable pageable);
    
    @Query("SELECT q FROM Question q WHERE q.isActive = true AND q.difficulty = :difficulty AND q.id NOT IN :excludeIds ORDER BY RAND()")
    List<Question> findRandomQuestionsByDifficultyExcludingIds(@Param("difficulty") Question.Difficulty difficulty,
                                                                @Param("excludeIds") List<String> excludeIds,
                                                                Pageable pageable);
    
    @Query("SELECT q FROM Question q WHERE q.isActive = true AND q.book = :book AND q.difficulty = :difficulty AND q.id NOT IN :excludeIds ORDER BY RAND()")
    List<Question> findRandomQuestionsByBookAndDifficultyExcludingIds(@Param("book") String book,
                                                                      @Param("difficulty") Question.Difficulty difficulty,
                                                                      @Param("excludeIds") List<String> excludeIds,
                                                                      Pageable pageable);
    
    // Performance optimization: Get question count by filters
    @Query("SELECT COUNT(q) FROM Question q WHERE q.isActive = true AND " +
           "(:book IS NULL OR q.book = :book) AND " +
           "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
           "(:type IS NULL OR q.type = :type)")
    long countByFilters(@Param("book") String book, 
                       @Param("difficulty") Question.Difficulty difficulty,
                       @Param("type") Question.Type type);
    
    // Index hints for better performance
    @Query(value = "SELECT * FROM questions q USE INDEX (idx_is_active) WHERE q.is_active = true ORDER BY RAND() LIMIT :limit", 
           nativeQuery = true)
    List<Question> findRandomQuestionsNative(@Param("limit") int limit);
}
