package com.biblequiz.repository;

import com.biblequiz.entity.QuizSessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizSessionQuestionRepository extends JpaRepository<QuizSessionQuestion, String> {

    List<QuizSessionQuestion> findBySessionIdOrderByOrderIndex(String sessionId);

    @Query("SELECT qsq FROM QuizSessionQuestion qsq WHERE qsq.session.id = :sessionId AND qsq.question.id = :questionId")
    QuizSessionQuestion findBySessionIdAndQuestionId(@Param("sessionId") String sessionId,
                                                     @Param("questionId") String questionId);
}


