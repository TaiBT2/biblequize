package com.biblequiz.repository;

import com.biblequiz.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, String> {
    List<Achievement> findByIsActiveTrueOrderByCategoryAscPointsAsc();
    List<Achievement> findByCategoryAndIsActiveTrue(String category);
}
