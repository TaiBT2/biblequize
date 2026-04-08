package com.biblequiz.modules.quiz.repository;

import com.biblequiz.modules.quiz.entity.DailyMission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DailyMissionRepository extends JpaRepository<DailyMission, String> {

    List<DailyMission> findByUserIdAndDateOrderByMissionSlot(String userId, LocalDate date);

    long countByUserIdAndDateAndCompletedTrue(String userId, LocalDate date);
}
