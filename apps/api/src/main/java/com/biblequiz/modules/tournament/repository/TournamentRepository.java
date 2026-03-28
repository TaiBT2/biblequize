package com.biblequiz.modules.tournament.repository;

import com.biblequiz.modules.tournament.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, String> {

    List<Tournament> findByStatus(Tournament.Status status);

    List<Tournament> findByCreatorId(String creatorId);
}
