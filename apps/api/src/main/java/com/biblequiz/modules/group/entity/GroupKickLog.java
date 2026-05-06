package com.biblequiz.modules.group.entity;

import com.biblequiz.modules.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Audit row written every time a leader/mod kicks a member. Used to enforce
 * the 7-day re-join cooldown (SPEC v1.1 §12.2 + Phụ lục A) and as input for
 * moderation history. Rows are kept past the cooldown — they're cheap and
 * useful for admin investigations.
 */
@Entity
@Table(name = "group_kick_log")
public class GroupKickLog {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ChurchGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kicked_user_id", nullable = false)
    private User kickedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kicked_by_id", nullable = false)
    private User kickedBy;

    @Column(length = 500)
    private String reason;

    @CreationTimestamp
    @Column(name = "kicked_at", nullable = false, updatable = false)
    private LocalDateTime kickedAt;

    public GroupKickLog() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ChurchGroup getGroup() { return group; }
    public void setGroup(ChurchGroup group) { this.group = group; }
    public User getKickedUser() { return kickedUser; }
    public void setKickedUser(User kickedUser) { this.kickedUser = kickedUser; }
    public User getKickedBy() { return kickedBy; }
    public void setKickedBy(User kickedBy) { this.kickedBy = kickedBy; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getKickedAt() { return kickedAt; }
    public void setKickedAt(LocalDateTime kickedAt) { this.kickedAt = kickedAt; }
}
