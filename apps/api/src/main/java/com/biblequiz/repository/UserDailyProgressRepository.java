package com.biblequiz.repository;

import com.biblequiz.entity.UserDailyProgress;
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
    
    @Query("SELECT udp FROM UserDailyProgress udp WHERE udp.date = :date ORDER BY udp.pointsCounted DESC")
    List<UserDailyProgress> findByDateOrderByPointsCountedDesc(@Param("date") LocalDate date);
    
    @Query("SELECT udp FROM UserDailyProgress udp WHERE udp.date BETWEEN :startDate AND :endDate ORDER BY udp.pointsCounted DESC")
    List<UserDailyProgress> findByDateBetweenOrderByPointsCountedDesc(@Param("startDate") LocalDate startDate, 
                                                                     @Param("endDate") LocalDate endDate);
    
    @Query("SELECT udp FROM UserDailyProgress udp WHERE udp.user.id = :userId ORDER BY udp.date DESC")
    List<UserDailyProgress> findByUserIdOrderByDateDesc(@Param("userId") String userId);
    
    boolean existsByUserIdAndDate(String userId, LocalDate date);
}
