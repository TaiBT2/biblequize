package com.biblequiz.modules.user.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.biblequiz.modules.auth.entity.AuthIdentity;
import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.entity.Answer;
import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.feedback.entity.Feedback;
import com.biblequiz.modules.quiz.entity.Bookmark;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String provider = "local";

    // FIX #8: Use enum for type safety instead of raw String
    public enum Role {
        USER, ADMIN
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    // SPEC-v2: Streak system
    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    private Integer longestStreak = 0;

    @Column(name = "last_played_at")
    private LocalDateTime lastPlayedAt;

    @Column(name = "streak_freeze_used_this_week", nullable = false)
    private Boolean streakFreezeUsedThisWeek = false;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AuthIdentity> authIdentities = new ArrayList<>();

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuizSession> quizSessions = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Answer> answers = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UserDailyProgress> dailyProgress = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Feedback> feedback = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Bookmark> bookmarks = new ArrayList<>();

    // Constructors
    public User() {
    }

    public User(String id, String name, String email, String provider) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.provider = provider;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    /** Returns the role name as a plain String (e.g. "USER", "ADMIN"). */
    public String getRole() {
        return role != null ? role.name() : Role.USER.name();
    }

    /**
     * Sets role from a String. Accepts "USER" or "ADMIN" (case-insensitive).
     * Falls back to USER for unknown values.
     */
    public void setRole(String role) {
        try {
            this.role = Role.valueOf(role != null ? role.toUpperCase() : "USER");
        } catch (IllegalArgumentException e) {
            this.role = Role.USER;
        }
    }

    /** Type-safe setter for internal use. */
    public void setRole(Role role) {
        this.role = role != null ? role : Role.USER;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<AuthIdentity> getAuthIdentities() {
        return authIdentities;
    }

    public void setAuthIdentities(List<AuthIdentity> authIdentities) {
        this.authIdentities = authIdentities;
    }

    public List<QuizSession> getQuizSessions() {
        return quizSessions;
    }

    public void setQuizSessions(List<QuizSession> quizSessions) {
        this.quizSessions = quizSessions;
    }

    public List<Answer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<Answer> answers) {
        this.answers = answers;
    }

    public List<UserDailyProgress> getDailyProgress() {
        return dailyProgress;
    }

    public void setDailyProgress(List<UserDailyProgress> dailyProgress) {
        this.dailyProgress = dailyProgress;
    }

    public List<Feedback> getFeedback() {
        return feedback;
    }

    public void setFeedback(List<Feedback> feedback) {
        this.feedback = feedback;
    }

    public List<Bookmark> getBookmarks() {
        return bookmarks;
    }

    public void setBookmarks(List<Bookmark> bookmarks) {
        this.bookmarks = bookmarks;
    }

    // SPEC-v2: Streak getters/setters
    public Integer getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }

    public Integer getLongestStreak() { return longestStreak; }
    public void setLongestStreak(Integer longestStreak) { this.longestStreak = longestStreak; }

    public LocalDateTime getLastPlayedAt() { return lastPlayedAt; }
    public void setLastPlayedAt(LocalDateTime lastPlayedAt) { this.lastPlayedAt = lastPlayedAt; }

    public Boolean getStreakFreezeUsedThisWeek() { return streakFreezeUsedThisWeek; }
    public void setStreakFreezeUsedThisWeek(Boolean used) { this.streakFreezeUsedThisWeek = used; }
}
