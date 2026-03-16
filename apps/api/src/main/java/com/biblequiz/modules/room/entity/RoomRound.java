package com.biblequiz.modules.room.entity;

import com.biblequiz.modules.quiz.entity.Question;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    public RoomRound() {}

    public RoomRound(String id, Room room, Integer roundNo, Question question, LocalDateTime startedAt) {
        this.id = id;
        this.room = room;
        this.roundNo = roundNo;
        this.question = question;
        this.startedAt = startedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }

    public Integer getRoundNo() { return roundNo; }
    public void setRoundNo(Integer roundNo) { this.roundNo = roundNo; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}
