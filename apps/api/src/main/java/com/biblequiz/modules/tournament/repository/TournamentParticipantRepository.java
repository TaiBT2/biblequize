package com.biblequiz.modules.tournament.repository;

import com.biblequiz.modules.tournament.entity.TournamentParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentParticipantRepository extends JpaRepository<TournamentParticipant, String> {

    List<TournamentParticipant> findByTournamentId(String tournamentId);

    Optional<TournamentParticipant> findByTournamentIdAndUserId(String tournamentId, String userId);

    long countByTournamentId(String tournamentId);
}
