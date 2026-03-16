package com.biblequiz.modules.room.repository;

import com.biblequiz.modules.room.entity.RoomAnswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomAnswerRepository extends JpaRepository<RoomAnswer, String> {

    List<RoomAnswer> findByRoundId(String roundId);

    Optional<RoomAnswer> findByRoundIdAndUserId(String roundId, String userId);

    boolean existsByRoundIdAndUserId(String roundId, String userId);

    long countByRoundId(String roundId);
}
