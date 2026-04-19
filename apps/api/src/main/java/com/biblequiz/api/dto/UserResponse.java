package com.biblequiz.api.dto;

import com.biblequiz.modules.user.entity.User;

import java.time.LocalDateTime;

public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String avatarUrl;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer currentStreak;
    private Integer longestStreak;
    private Boolean earlyRankedUnlock;
    private Integer practiceCorrectCount;
    private Integer practiceTotalCount;
    private LocalDateTime earlyRankedUnlockedAt;

    public UserResponse() {}

    public UserResponse(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.avatarUrl = user.getAvatarUrl();
        this.role = user.getRole();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
        this.currentStreak = user.getCurrentStreak();
        this.longestStreak = user.getLongestStreak();
        this.earlyRankedUnlock = user.getEarlyRankedUnlock();
        this.practiceCorrectCount = user.getPracticeCorrectCount();
        this.practiceTotalCount = user.getPracticeTotalCount();
        this.earlyRankedUnlockedAt = user.getEarlyRankedUnlockedAt();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }

    public Integer getLongestStreak() { return longestStreak; }
    public void setLongestStreak(Integer longestStreak) { this.longestStreak = longestStreak; }

    public Boolean getEarlyRankedUnlock() { return earlyRankedUnlock; }
    public void setEarlyRankedUnlock(Boolean earlyRankedUnlock) { this.earlyRankedUnlock = earlyRankedUnlock; }

    public Integer getPracticeCorrectCount() { return practiceCorrectCount; }
    public void setPracticeCorrectCount(Integer practiceCorrectCount) { this.practiceCorrectCount = practiceCorrectCount; }

    public Integer getPracticeTotalCount() { return practiceTotalCount; }
    public void setPracticeTotalCount(Integer practiceTotalCount) { this.practiceTotalCount = practiceTotalCount; }

    public LocalDateTime getEarlyRankedUnlockedAt() { return earlyRankedUnlockedAt; }
    public void setEarlyRankedUnlockedAt(LocalDateTime earlyRankedUnlockedAt) { this.earlyRankedUnlockedAt = earlyRankedUnlockedAt; }
}
