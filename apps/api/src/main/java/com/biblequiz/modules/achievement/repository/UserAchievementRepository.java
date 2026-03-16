package com.biblequiz.modules.achievement.repository;

import com.biblequiz.modules.achievement.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, String> {

    List<UserAchievement> findByUserId(String userId);

    boolean existsByUserIdAndAchievementId(String userId, String achievementId);

    boolean existsByUserIdAndAchievementKeyName(String userId, String keyName);
}
