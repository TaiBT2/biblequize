package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.ScheduledQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduledQuizRepository extends JpaRepository<ScheduledQuiz, String> {

    List<ScheduledQuiz> findByGroupIdAndStatusOrderByDeadlineAsc(String groupId, ScheduledQuiz.Status status);

    List<ScheduledQuiz> findByGroupIdOrderByCreatedAtDesc(String groupId);

    /** Cron query — sweep ACTIVE quizzes whose deadline has passed. */
    List<ScheduledQuiz> findByStatusAndDeadlineBefore(ScheduledQuiz.Status status, LocalDateTime now);

    /** 24h-remaining cron query — ACTIVE quizzes with deadline in [now, now+24h] and noti not yet sent. */
    List<ScheduledQuiz> findByStatusAndDeadlineBetweenAndNoti24hSentAtIsNull(
            ScheduledQuiz.Status status, LocalDateTime from, LocalDateTime to);

    long countByGroupIdAndStatus(String groupId, ScheduledQuiz.Status status);
}
