package com.biblequiz.modules.quiz.repository;

import com.biblequiz.modules.quiz.entity.QuestionReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionReviewRepository extends JpaRepository<QuestionReview, String> {

    List<QuestionReview> findByQuestionId(String questionId);

    Optional<QuestionReview> findByQuestionIdAndAdminId(String questionId, String adminId);

    boolean existsByQuestionIdAndAdminId(String questionId, String adminId);

    long countByQuestionIdAndAction(String questionId, QuestionReview.Action action);
}
