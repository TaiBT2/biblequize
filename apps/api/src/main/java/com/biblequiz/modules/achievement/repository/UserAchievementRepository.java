package com.biblequiz.modules.achievement.repository;

import com.biblequiz.modules.achievement.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, String> {

    List<UserAchievement> findByUserId(String userId);

    boolean existsByUserIdAndAchievementId(String userId, String achievementId);

    boolean existsByUserIdAndAchievementKeyName(String userId, String keyName);

    /**
     * MPP-2 — Count achievements earned in a category within a time window.
     * Used by the weekly multiplayer-stats widget to surface MVP count.
     */
    @Query("SELECT COUNT(ua) FROM UserAchievement ua " +
           "WHERE ua.user.id = :userId " +
           "AND ua.achievement.category = :category " +
           "AND ua.earnedAt >= :from " +
           "AND ua.earnedAt < :to")
    long countByUserIdAndCategoryAndEarnedAtBetween(
            @Param("userId") String userId,
            @Param("category") String category,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
