package com.biblequiz.modules.group.entity;

import com.biblequiz.modules.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * BL-25 — Hành Trình Nhóm. The whole group walking through one book/topic
 * across N weeks (chặng). Differentiator vs multiplayer: async + persistent +
 * leader-guided. Progress is NOT stored here — it is aggregated from
 * {@link ScheduledQuizAttempt} via each {@link GroupJourneyWeek}'s scheduled
 * quiz (see {@code GroupJourneyService.getJourneyWithProgress}).
 */
@Entity
@Table(name = "group_journeys")
public class GroupJourney {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ChurchGroup group;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status = Status.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public enum Status { DRAFT, ACTIVE, COMPLETED }

    public GroupJourney() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ChurchGroup getGroup() { return group; }
    public void setGroup(ChurchGroup group) { this.group = group; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
