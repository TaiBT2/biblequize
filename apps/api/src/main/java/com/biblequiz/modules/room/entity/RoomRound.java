package com.biblequiz.modules.room.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_rounds")
public class RoomRound {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "round_no", nullable = false)
    private Integer roundNo;

    /**
     * Soft reference to either {@code questions(id)} (built-in question bank)
     * or {@code user_questions(id)} (custom QuestionSet items used by
     * multiplayer rooms with questionSource=CUSTOM). Stored as a plain
     * column instead of a JPA @ManyToOne so Hibernate (with ddl-auto=update
     * in dev) does not auto-create an FK constraint to {@code questions}
     * that would block inserts of UserQuestion ids.
     */
    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    public RoomRound() {}

    public RoomRound(String id, Room room, Integer roundNo, String questionId, LocalDateTime startedAt) {
        this.id = id;
        this.room = room;
        this.roundNo = roundNo;
        this.questionId = questionId;
        this.startedAt = startedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }

    public Integer getRoundNo() { return roundNo; }
    public void setRoundNo(Integer roundNo) { this.roundNo = roundNo; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}
