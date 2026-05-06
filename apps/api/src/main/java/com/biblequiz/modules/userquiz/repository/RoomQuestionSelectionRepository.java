package com.biblequiz.modules.userquiz.repository;

import com.biblequiz.modules.userquiz.entity.RoomQuestionSelection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomQuestionSelectionRepository extends JpaRepository<RoomQuestionSelection, String> {
    List<RoomQuestionSelection> findByRoomIdOrderByOrderIndex(String roomId);

    /**
     * Like {@link #findByRoomIdOrderByOrderIndex} but eagerly fetches the
     * {@code userQuestion} for callers operating outside the original
     * transaction (e.g. async quiz runners).
     */
    @Query("SELECT s FROM RoomQuestionSelection s JOIN FETCH s.userQuestion " +
           "WHERE s.room.id = :roomId ORDER BY s.orderIndex ASC")
    List<RoomQuestionSelection> findByRoomIdWithUserQuestion(@Param("roomId") String roomId);

    void deleteByRoomId(String roomId);
    long countByRoomId(String roomId);
}
