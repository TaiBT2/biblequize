package com.biblequiz.modules.tournament.repository;

import com.biblequiz.modules.tournament.entity.TournamentMatchParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentMatchParticipantRepository extends JpaRepository<TournamentMatchParticipant, String> {

    List<TournamentMatchParticipant> findByMatchId(String matchId);

    Optional<TournamentMatchParticipant> findByMatchIdAndUserId(String matchId, String userId);
}
