package com.biblequiz.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_achievements")
public class UserAchievement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;
    
    @Column(nullable = false)
    private LocalDateTime unlockedAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private Boolean isNotified = false;
    
    // Constructors
    public UserAchievement() {}
    
    public UserAchievement(User user, Achievement achievement) {
        this.user = user;
        this.achievement = achievement;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public Achievement getAchievement() { return achievement; }
    public void setAchievement(Achievement achievement) { this.achievement = achievement; }
    
    public LocalDateTime getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; }
    
    public Boolean getIsNotified() { return isNotified; }
    public void setIsNotified(Boolean isNotified) { this.isNotified = isNotified; }
}
