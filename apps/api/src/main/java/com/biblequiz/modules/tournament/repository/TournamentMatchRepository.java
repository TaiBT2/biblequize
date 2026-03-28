package com.biblequiz.modules.tournament.repository;

import com.biblequiz.modules.tournament.entity.TournamentMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentMatchRepository extends JpaRepository<TournamentMatch, String> {

    List<TournamentMatch> findByTournamentId(String tournamentId);

    List<TournamentMatch> findByTournamentIdAndRoundNumber(String tournamentId, int roundNumber);

    Optional<TournamentMatch> findByTournamentIdAndRoundNumberAndMatchIndex(String tournamentId, int roundNumber, int matchIndex);
}
