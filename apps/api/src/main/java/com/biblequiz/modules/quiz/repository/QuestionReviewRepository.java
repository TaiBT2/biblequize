package com.biblequiz.modules.quiz.repository;

import com.biblequiz.modules.quiz.entity.QuestionReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface QuestionReviewRepository extends JpaRepository<QuestionReview, String> {

    List<QuestionReview> findByQuestionId(String questionId);

    Optional<QuestionReview> findByQuestionIdAndAdminId(String questionId, String adminId);

    boolean existsByQuestionIdAndAdminId(String questionId, String adminId);

    long countByQuestionIdAndAction(String questionId, QuestionReview.Action action);

    @Query("SELECT r.questionId FROM QuestionReview r WHERE r.adminId = :adminId")
    List<String> findQuestionIdsReviewedByAdmin(@Param("adminId") String adminId);

    Page<QuestionReview> findByAdminIdOrderByCreatedAtDesc(String adminId, Pageable pageable);

    long countByAdminIdAndCreatedAtAfter(String adminId, LocalDateTime after);
}
