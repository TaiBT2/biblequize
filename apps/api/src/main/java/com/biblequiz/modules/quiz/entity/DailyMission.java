package com.biblequiz.modules.quiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_mission",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "date", "mission_slot"}))
public class DailyMission {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "mission_slot", nullable = false)
    private int missionSlot;

    @Column(name = "mission_type", nullable = false, length = 50)
    private String missionType;

    @Column(nullable = false, columnDefinition = "JSON")
    private String config;

    @Column(nullable = false)
    private int progress = 0;

    @Column(nullable = false)
    private int target;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "bonus_claimed", nullable = false)
    private boolean bonusClaimed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public DailyMission() {}

    public DailyMission(String id, String userId, LocalDate date, int missionSlot,
                        String missionType, String config, int target) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.missionSlot = missionSlot;
        this.missionType = missionType;
        this.config = config;
        this.target = target;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getMissionSlot() { return missionSlot; }
    public void setMissionSlot(int missionSlot) { this.missionSlot = missionSlot; }

    public String getMissionType() { return missionType; }
    public void setMissionType(String missionType) { this.missionType = missionType; }

    public String getConfig() { return config; }
    public void setConfig(String config) { this.config = config; }

    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }

    public int getTarget() { return target; }
    public void setTarget(int target) { this.target = target; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public boolean isBonusClaimed() { return bonusClaimed; }
    public void setBonusClaimed(boolean bonusClaimed) { this.bonusClaimed = bonusClaimed; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
