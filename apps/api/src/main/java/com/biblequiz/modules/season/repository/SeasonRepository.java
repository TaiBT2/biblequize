package com.biblequiz.modules.season.repository;

import com.biblequiz.modules.season.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SeasonRepository extends JpaRepository<Season, String> {

    Optional<Season> findByIsActiveTrue();

    List<Season> findAllByOrderByStartDateDesc();

    /**
     * Find the season covering {@code date1..date2} (intended use:
     * {@code findFor(today, today)}). Uses {@code findTop...OrderByIsActiveDescStartDateDesc}
     * to guarantee at most one row even when multiple Seasons overlap the date.
     * Tie-break: prefer {@code is_active=true} first (canonical seeded current
     * quarter), then most recent {@code startDate}. Protects against test/legacy
     * data leak (e.g. a stray "Season E2E Test" row with startDate later than
     * the canonical {@code season-YYYY-qN} would have won under pure-startDate
     * ordering — see incident 2026-05-14).
     */
    Optional<Season> findTopByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByIsActiveDescStartDateDesc(LocalDate date1, LocalDate date2);

    boolean existsByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate date1, LocalDate date2);
}
