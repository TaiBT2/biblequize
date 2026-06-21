package com.biblequiz.modules.group.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * BL-25 — one week (chặng) of a {@link GroupJourney}. Content = a
 * {@code GroupQuizSet} ({@code quizSetId}); the checkpoint = a
 * {@code ScheduledQuiz} created when the leader opens the week
 * ({@code scheduledQuizId}, null while LOCKED).
 *
 * <p>{@code quizSetId} / {@code scheduledQuizId} are stored as loose id
 * references (like {@code ScheduledQuiz.winnerUserId}) — they are only
 * resolved by id at open-time / progress-aggregation time.
 */
@Entity
@Table(name = "group_journey_weeks")
public class GroupJourneyWeek {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journey_id", nullable = false)
    private GroupJourney journey;

    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    @Column(nullable = false)
    private String title;

    @Column(name = "quiz_set_id", length = 36, nullable = false)
    private String quizSetId;

    @Column(name = "scheduled_quiz_id", length = 36)
    private String scheduledQuizId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status = Status.LOCKED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status { LOCKED, OPEN, ENDED }

    public GroupJourneyWeek() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public GroupJourney getJourney() { return journey; }
    public void setJourney(GroupJourney journey) { this.journey = journey; }
    public Integer getWeekNumber() { return weekNumber; }
    public void setWeekNumber(Integer weekNumber) { this.weekNumber = weekNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getQuizSetId() { return quizSetId; }
    public void setQuizSetId(String quizSetId) { this.quizSetId = quizSetId; }
    public String getScheduledQuizId() { return scheduledQuizId; }
    public void setScheduledQuizId(String scheduledQuizId) { this.scheduledQuizId = scheduledQuizId; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
