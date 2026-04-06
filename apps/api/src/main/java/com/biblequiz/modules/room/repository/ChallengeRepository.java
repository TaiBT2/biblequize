package com.biblequiz.modules.room.repository;

import com.biblequiz.modules.room.entity.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChallengeRepository extends JpaRepository<Challenge, String> {

    List<Challenge> findByChallengedIdAndStatus(String challengedId, Challenge.Status status);

    @Query("SELECT c FROM Challenge c WHERE c.status = 'PENDING' AND c.expiresAt < :now")
    List<Challenge> findExpiredPending(@Param("now") LocalDateTime now);
}
