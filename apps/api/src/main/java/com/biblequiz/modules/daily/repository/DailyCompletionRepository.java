package com.biblequiz.modules.daily.repository;

import com.biblequiz.modules.daily.entity.DailyCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyCompletionRepository extends JpaRepository<DailyCompletion, String> {

    Optional<DailyCompletion> findByUserIdAndCompletionDate(String userId, LocalDate completionDate);

    @Query("SELECT dc FROM DailyCompletion dc WHERE dc.user.id = :userId " +
            "AND dc.completionDate BETWEEN :startDate AND :endDate " +
            "ORDER BY dc.completionDate ASC")
    List<DailyCompletion> findByUserIdAndDateRange(@Param("userId") String userId,
                                                    @Param("startDate") LocalDate startDate,
                                                    @Param("endDate") LocalDate endDate);
}
