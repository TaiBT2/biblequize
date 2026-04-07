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

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM UserQuestionHistory h WHERE h.user.id = :userId")
    long deleteAllByUserId(@Param("userId") String userId);
}
