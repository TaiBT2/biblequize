package com.biblequiz.modules.group.entity;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.shared.converter.JsonListConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Feature B — Đặt lịch chơi: async group quiz with deadline.
 * Members play up to {@code maxAttempts} times; highest score per user counts
 * on the leaderboard. Scheduler freezes status → ENDED + auto-creates
 * GroupAnnouncement once {@code deadline} has passed.
 *
 * <p>Snapshot of question IDs is taken at create time so source
 * {@link GroupQuizSet} edits/deletions don't break a live quiz.
 */
@Entity
@Table(name = "scheduled_quizzes")
public class ScheduledQuiz {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ChurchGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_set_id", nullable = false)
    private GroupQuizSet quizSet;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "snapshot_question_ids", columnDefinition = "JSON", nullable = false)
    private List<String> snapshotQuestionIds;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 3;

    @Column(name = "is_leaderboard_public", nullable = false)
    private Boolean isLeaderboardPublic = true;

    @Column(name = "send_notifications", nullable = false)
    private Boolean sendNotifications = true;

    @Column(name = "noti_24h_sent_at")
    private LocalDateTime noti24hSentAt;

    @Column(name = "winner_user_id", length = 36)
    private String winnerUserId;

    @Column(name = "winner_score")
    private Integer winnerScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    public enum Status { ACTIVE, ENDED, CANCELLED }

    public ScheduledQuiz() {}

    // Getters / Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ChurchGroup getGroup() { return group; }
    public void setGroup(ChurchGroup group) { this.group = group; }
    public GroupQuizSet getQuizSet() { return quizSet; }
    public void setQuizSet(GroupQuizSet quizSet) { this.quizSet = quizSet; }
    public List<String> getSnapshotQuestionIds() { return snapshotQuestionIds; }
    public void setSnapshotQuestionIds(List<String> snapshotQuestionIds) { this.snapshotQuestionIds = snapshotQuestionIds; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
    public Boolean getIsLeaderboardPublic() { return isLeaderboardPublic; }
    public void setIsLeaderboardPublic(Boolean isLeaderboardPublic) { this.isLeaderboardPublic = isLeaderboardPublic; }
    public Boolean getSendNotifications() { return sendNotifications; }
    public void setSendNotifications(Boolean sendNotifications) { this.sendNotifications = sendNotifications; }
    public LocalDateTime getNoti24hSentAt() { return noti24hSentAt; }
    public void setNoti24hSentAt(LocalDateTime noti24hSentAt) { this.noti24hSentAt = noti24hSentAt; }
    public String getWinnerUserId() { return winnerUserId; }
    public void setWinnerUserId(String winnerUserId) { this.winnerUserId = winnerUserId; }
    public Integer getWinnerScore() { return winnerScore; }
    public void setWinnerScore(Integer winnerScore) { this.winnerScore = winnerScore; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}
