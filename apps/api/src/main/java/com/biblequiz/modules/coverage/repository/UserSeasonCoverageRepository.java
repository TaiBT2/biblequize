package com.biblequiz.modules.coverage.repository;

import com.biblequiz.modules.coverage.entity.UserSeasonCoverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSeasonCoverageRepository extends JpaRepository<UserSeasonCoverage, String> {

    Optional<UserSeasonCoverage> findByUserIdAndSeasonId(String userId, String seasonId);

    boolean existsByUserIdAndSeasonId(String userId, String seasonId);

    List<UserSeasonCoverage> findBySeasonId(String seasonId);
}
