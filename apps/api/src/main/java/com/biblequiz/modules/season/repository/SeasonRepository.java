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

    Optional<Season> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate date1, LocalDate date2);
}
