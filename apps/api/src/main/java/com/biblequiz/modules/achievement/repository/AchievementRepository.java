package com.biblequiz.modules.achievement.repository;

import com.biblequiz.modules.achievement.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, String> {
    Optional<Achievement> findByKeyName(String keyName);
}
