package com.biblequiz.repository;

import com.biblequiz.entity.RoomPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomPlayerRepository extends JpaRepository<RoomPlayer, String> {
    
    // Find players by room
    List<RoomPlayer> findByRoomId(String roomId);
    
    // Find player by room and user
    Optional<RoomPlayer> findByRoomIdAndUserId(String roomId, String userId);
    
    // Find players by room, ordered by score desc
    @Query("SELECT rp FROM RoomPlayer rp WHERE rp.room.id = :roomId ORDER BY rp.score DESC")
    List<RoomPlayer> findByRoomIdOrderByScoreDesc(@Param("roomId") String roomId);
    
    // Find players ready for quiz
    List<RoomPlayer> findByRoomIdAndIsReady(String roomId, Boolean isReady);
    
    // Count players in room
    @Query("SELECT COUNT(rp) FROM RoomPlayer rp WHERE rp.room.id = :roomId")
    long countByRoomId(@Param("roomId") String roomId);
    
    // Find top players by score
    @Query("SELECT rp FROM RoomPlayer rp WHERE rp.room.id = :roomId ORDER BY rp.score DESC LIMIT :limit")
    List<RoomPlayer> findTopByRoomId(@Param("roomId") String roomId, @Param("limit") int limit);
}
