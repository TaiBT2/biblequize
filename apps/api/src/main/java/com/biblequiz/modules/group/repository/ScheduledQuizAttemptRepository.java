package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.ScheduledQuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduledQuizAttemptRepository extends JpaRepository<ScheduledQuizAttempt, String> {

    List<ScheduledQuizAttempt> findByScheduledQuizIdAndUserIdOrderByAttemptNumberAsc(
            String scheduledQuizId, String userId);

    long countByScheduledQuizIdAndUserId(String scheduledQuizId, String userId);

    Optional<ScheduledQuizAttempt> findFirstByScheduledQuizIdAndUserIdOrderByScoreDesc(
            String scheduledQuizId, String userId);

    List<ScheduledQuizAttempt> findByScheduledQuizId(String scheduledQuizId);
}
