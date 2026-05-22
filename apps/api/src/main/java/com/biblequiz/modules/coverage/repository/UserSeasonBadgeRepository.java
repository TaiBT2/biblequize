package com.biblequiz.modules.coverage.repository;

import com.biblequiz.modules.coverage.entity.UserSeasonBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSeasonBadgeRepository extends JpaRepository<UserSeasonBadge, String> {

    boolean existsByUserIdAndSeasonId(String userId, String seasonId);

    Optional<UserSeasonBadge> findByUserIdAndSeasonId(String userId, String seasonId);

    /** Most recent badge the user has not yet seen — drives BadgeAwardModal trigger. */
    Optional<UserSeasonBadge> findFirstByUserIdAndShownToUserAtIsNullOrderByAwardedAtDesc(String userId);
}
