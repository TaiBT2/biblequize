package com.biblequiz.modules.coverage.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * End-of-season Liturgical Coverage badge (SPEC_USER_v3.2 §7.1.8).
 * One row per (user, season) — unique constraint prevents re-award.
 *
 * <p>Awarded by {@code BadgeAwardScheduler} after a season's calendar end
 * date, based on the user's final book-coverage count.</p>
 */
@Entity
@Table(name = "user_season_badges",
       uniqueConstraints = @UniqueConstraint(name = "uk_badge_user_season",
                                             columnNames = {"user_id", "season_id"}))
public class UserSeasonBadge {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "season_id", nullable = false, length = 36)
    private String seasonId;

    @Column(name = "badge_tier", nullable = false, length = 20)
    private String badgeTier;

    @Column(name = "books_covered", nullable = false)
    private Integer booksCovered;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "accuracy", nullable = false)
    private Integer accuracy;

    @Column(name = "days_active", nullable = false)
    private Integer daysActive;

    @CreationTimestamp
    @Column(name = "awarded_at", updatable = false)
    private LocalDateTime awardedAt;

    @Column(name = "shown_to_user_at")
    private LocalDateTime shownToUserAt;

    public UserSeasonBadge() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getSeasonId() { return seasonId; }
    public void setSeasonId(String seasonId) { this.seasonId = seasonId; }
    public String getBadgeTier() { return badgeTier; }
    public void setBadgeTier(String badgeTier) { this.badgeTier = badgeTier; }
    public Integer getBooksCovered() { return booksCovered; }
    public void setBooksCovered(Integer booksCovered) { this.booksCovered = booksCovered; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public Integer getAccuracy() { return accuracy; }
    public void setAccuracy(Integer accuracy) { this.accuracy = accuracy; }
    public Integer getDaysActive() { return daysActive; }
    public void setDaysActive(Integer daysActive) { this.daysActive = daysActive; }
    public LocalDateTime getAwardedAt() { return awardedAt; }
    public LocalDateTime getShownToUserAt() { return shownToUserAt; }
    public void setShownToUserAt(LocalDateTime shownToUserAt) { this.shownToUserAt = shownToUserAt; }
}
