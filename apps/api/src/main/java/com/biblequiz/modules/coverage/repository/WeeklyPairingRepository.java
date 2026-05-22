package com.biblequiz.modules.coverage.repository;

import com.biblequiz.modules.coverage.entity.WeeklyPairing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyPairingRepository extends JpaRepository<WeeklyPairing, String> {

    List<WeeklyPairing> findBySeasonIdOrderByWeekNumberAsc(String seasonId);

    Optional<WeeklyPairing> findBySeasonIdAndWeekNumber(String seasonId, Integer weekNumber);

    long countBySeasonId(String seasonId);
}
