package com.biblequiz.modules.room.repository;

import com.biblequiz.modules.room.entity.RoomRound;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRoundRepository extends JpaRepository<RoomRound, String> {

    List<RoomRound> findByRoomIdOrderByRoundNoAsc(String roomId);

    Optional<RoomRound> findByRoomIdAndRoundNo(String roomId, int roundNo);

    // Lấy round hiện tại đang chạy (chưa ended)
    Optional<RoomRound> findFirstByRoomIdAndEndedAtIsNullOrderByRoundNoDesc(String roomId);
}
