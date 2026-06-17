package com.biblequiz.modules.quiz.repository;

import com.biblequiz.modules.quiz.entity.UserQuestionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserQuestionHistoryRepository extends JpaRepository<UserQuestionHistory, String> {

    Optional<UserQuestionHistory> findByUserIdAndQuestionId(String userId, String questionId);

    @Query("SELECT h.question.id FROM UserQuestionHistory h WHERE h.user.id = :userId")
    List<String> findQuestionIdsByUserId(@Param("userId") String userId);

    @Query("SELECT h.question.id FROM UserQuestionHistory h " +
           "WHERE h.user.id = :userId " +
           "AND h.timesWrong > h.timesCorrect " +
           "AND (h.nextReviewAt IS NULL OR h.nextReviewAt <= :now)")
    List<String> findNeedReviewQuestionIds(@Param("userId") String userId, @Param("now") LocalDateTime now);

    /**
     * Whole-history projection for {@link com.biblequiz.modules.quiz.service.SmartQuestionSelector}:
     * one query returns every row's classification fields so the selector indexes
     * them in-memory instead of re-running the aggregate queries per difficulty
     * bucket and a per-question lookup (the previous N+1).
     */
    @Query("SELECT new com.biblequiz.modules.quiz.dto.HistoryMeta(" +
           "h.question.id, h.lastSeenAt, h.nextReviewAt, h.timesCorrect, h.timesWrong) " +
           "FROM UserQuestionHistory h WHERE h.user.id = :userId")
    List<com.biblequiz.modules.quiz.dto.HistoryMeta> findHistoryMetaByUserId(@Param("userId") String userId);

    @Query("SELECT h.question.book, COUNT(h) FROM UserQuestionHistory h " +
           "WHERE h.user.id = :userId GROUP BY h.question.book")
    List<Object[]> countSeenByBook(@Param("userId") String userId);

    @Query("SELECT COUNT(h) FROM UserQuestionHistory h WHERE h.user.id = :userId")
    long countByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(h) FROM UserQuestionHistory h " +
           "WHERE h.user.id = :userId AND h.timesCorrect >= 3")
    long countMasteredByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(h) FROM UserQuestionHistory h " +
           "WHERE h.user.id = :userId AND h.question.book = :book AND h.timesCorrect > 0")
    long countCorrectByUserIdAndBook(@Param("userId") String userId, @Param("book") String book);

    /**
     * Get accuracy stats per book: [book, timesSeen, timesCorrect, timesWrong]
     */
    @Query("SELECT h.question.book, SUM(h.timesSeen), SUM(h.timesCorrect), SUM(h.timesWrong) " +
           "FROM UserQuestionHistory h WHERE h.user.id = :userId " +
           "GROUP BY h.question.book")
    List<Object[]> getAccuracyByBook(@Param("userId") String userId);

    /**
     * Lifetime accuracy aggregate across every book: [timesSeen, timesCorrect, timesWrong].
     * Single-row result; SUMs return NULL when the user has no history.
     */
    @Query("SELECT SUM(h.timesSeen), SUM(h.timesCorrect), SUM(h.timesWrong) " +
           "FROM UserQuestionHistory h WHERE h.user.id = :userId")
    Object[] sumOverallAccuracy(@Param("userId") String userId);

    // Spring Data JPA @Modifying DML contract accepts only void / int /
    // Integer return types. `long` threw InvalidDataAccessApiUsageException
    // at call time (surfaced via admin reset-history during e2e setup).
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM UserQuestionHistory h WHERE h.user.id = :userId")
    int deleteAllByUserId(@Param("userId") String userId);
}
