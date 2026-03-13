package com.biblequiz.modules.quiz.repository;

import com.biblequiz.modules.quiz.entity.UserDailyProgress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserDailyProgressRepository extends JpaRepository<UserDailyProgress, String> {
    
    @Query("SELECT udp FROM UserDailyProgress udp WHERE udp.user.id = :userId AND udp.date = :date")
    Optional<UserDailyProgress> findByUserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);
    
    @Query("SELECT udp FROM UserDailyProgress udp JOIN FETCH udp.user WHERE udp.date = :date ORDER BY COALESCE(udp.pointsCounted, 0) DESC, udp.user.id ASC")
    List<UserDailyProgress> findByDateOrderByPointsCountedDesc(@Param("date") LocalDate date);
    
    @Query("SELECT udp FROM UserDailyProgress udp JOIN FETCH udp.user WHERE udp.date BETWEEN :startDate AND :endDate ORDER BY COALESCE(udp.pointsCounted, 0) DESC, udp.user.id ASC")
    List<UserDailyProgress> findByDateBetweenOrderByPointsCountedDesc(@Param("startDate") LocalDate startDate, 
                                                                     @Param("endDate") LocalDate endDate);
    
    @Query("SELECT udp FROM UserDailyProgress udp WHERE udp.user.id = :userId ORDER BY udp.date DESC")
    List<UserDailyProgress> findByUserIdOrderByDateDesc(@Param("userId") String userId);
    
    boolean existsByUserIdAndDate(String userId, LocalDate date);

    @Query("SELECT udp FROM UserDailyProgress udp WHERE udp.user.id = :userId AND udp.date BETWEEN :startDate AND :endDate")
    List<UserDailyProgress> findByUserIdAndDateBetween(@Param("userId") String userId,
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Count users with strictly more points on a given date (for daily rank)
    @Query("SELECT COUNT(DISTINCT udp.user.id) FROM UserDailyProgress udp WHERE udp.date = :date AND COALESCE(udp.pointsCounted, 0) > :points")
    long countUsersAheadOnDate(@Param("date") LocalDate date, @Param("points") int points);

    // Count users with strictly more total points in a date range (for weekly rank)
    @Query(value = "SELECT COUNT(*) FROM (SELECT SUM(COALESCE(points_counted, 0)) AS total FROM user_daily_progress WHERE date BETWEEN :startDate AND :endDate GROUP BY user_id HAVING total > :points) t", nativeQuery = true)
    long countUsersAheadInDateRange(@Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate, @Param("points") int points);

    // Count users with strictly more total points all time (for all-time rank)
    @Query(value = "SELECT COUNT(*) FROM (SELECT SUM(COALESCE(points_counted, 0)) AS total FROM user_daily_progress GROUP BY user_id HAVING total > :points) t", nativeQuery = true)
    long countUsersAheadAllTime(@Param("points") int points);
}
