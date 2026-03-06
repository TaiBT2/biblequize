package com.biblequiz.repository;

import com.biblequiz.entity.Achievement;
import com.biblequiz.entity.UserAchievement;
import com.biblequiz.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, String> {
    List<UserAchievement> findByUserOrderByUnlockedAtDesc(User user);
    List<UserAchievement> findByUserAndIsNotifiedFalse(User user);
    Optional<UserAchievement> findByUserAndAchievement(User user, Achievement achievement);
    boolean existsByUserAndAchievement(User user, Achievement achievement);
    
    @Query("SELECT ua FROM UserAchievement ua WHERE ua.user = :user AND ua.achievement.category = :category ORDER BY ua.unlockedAt DESC")
    List<UserAchievement> findByUserAndAchievementCategory(@Param("user") User user, @Param("category") String category);
}
