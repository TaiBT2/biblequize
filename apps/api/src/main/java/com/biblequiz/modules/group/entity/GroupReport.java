package com.biblequiz.modules.group.entity;

import com.biblequiz.modules.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * User-submitted report against a group. Surfaces in the admin moderation
 * queue (SPEC v1.1 §12.4 + §13.9). Status field tracks admin workflow:
 * OPEN → REVIEWED → ACTIONED|DISMISSED.
 */
@Entity
@Table(name = "group_reports")
public class GroupReport {

    public enum Reason {
        SPAM, INAPPROPRIATE, HARASSMENT, OTHER
    }

    public enum Status {
        OPEN, REVIEWED, ACTIONED, DISMISSED
    }

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ChurchGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private User reporter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Reason reason;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by_id", length = 36)
    private String reviewedById;

    public GroupReport() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ChurchGroup getGroup() { return group; }
    public void setGroup(ChurchGroup group) { this.group = group; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public Reason getReason() { return reason; }
    public void setReason(Reason reason) { this.reason = reason; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getReviewedById() { return reviewedById; }
    public void setReviewedById(String reviewedById) { this.reviewedById = reviewedById; }
}
