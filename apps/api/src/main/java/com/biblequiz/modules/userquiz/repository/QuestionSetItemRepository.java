package com.biblequiz.modules.userquiz.repository;

import com.biblequiz.modules.userquiz.entity.QuestionSetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionSetItemRepository extends JpaRepository<QuestionSetItem, String> {

    List<QuestionSetItem> findByQuestionSetIdOrderByOrderIndexAsc(String setId);

    /**
     * Same as {@link #findByQuestionSetIdOrderByOrderIndexAsc} but eagerly
     * fetches the {@code userQuestion} side. Required by callers that consume
     * the items outside the original transaction (e.g. async quiz runners) —
     * accessing the LAZY proxy after the session closes throws
     * {@code LazyInitializationException}.
     */
    @Query("SELECT i FROM QuestionSetItem i JOIN FETCH i.userQuestion " +
           "WHERE i.questionSet.id = :setId ORDER BY i.orderIndex ASC")
    List<QuestionSetItem> findByQuestionSetIdWithUserQuestion(@Param("setId") String setId);

    void deleteByQuestionSetId(String setId);
}
