package com.biblequiz.modules.coverage.entity;

import com.biblequiz.shared.converter.JsonListConverter;
import com.biblequiz.shared.converter.JsonMapStringIntegerConverter;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Per-user Liturgical Coverage tracking record (§7.7.2). One row per
 * (user_id, season_id). Tracks current week pointer, completed weeks list,
 * and per-book answered count for the season.
 *
 * <p>Coverage threshold = 4 answered questions per book (§7.1.4). A week is
 * "completed" when all 6 of its books reach ≥4. End-of-season badge tier
 * derived from total covered count (§7.1.8 / §7.14.2).</p>
 */
@Entity
@Table(name = "user_season_coverage",
       uniqueConstraints = @UniqueConstraint(name = "uk_user_season",
                                             columnNames = {"user_id", "season_id"}))
public class UserSeasonCoverage {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "season_id", nullable = false, length = 36)
    private String seasonId;

    @Column(name = "current_week", nullable = false)
    private Integer currentWeek = 1;

    @Column(name = "weeks_completed", columnDefinition = "JSON", nullable = false)
    @Convert(converter = JsonListConverter.class)
    @SuppressWarnings("unchecked")
    private List<Integer> weeksCompleted = new ArrayList<>();

    @Column(name = "book_coverage", columnDefinition = "JSON", nullable = false)
    @Convert(converter = JsonMapStringIntegerConverter.class)
    private Map<String, Integer> bookCoverage = new HashMap<>();

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @UpdateTimestamp
    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public UserSeasonCoverage() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getSeasonId() { return seasonId; }
    public void setSeasonId(String seasonId) { this.seasonId = seasonId; }
    public Integer getCurrentWeek() { return currentWeek; }
    public void setCurrentWeek(Integer currentWeek) { this.currentWeek = currentWeek; }
    public List<Integer> getWeeksCompleted() { return weeksCompleted; }
    public void setWeeksCompleted(List<Integer> weeksCompleted) { this.weeksCompleted = weeksCompleted; }
    public Map<String, Integer> getBookCoverage() { return bookCoverage; }
    public void setBookCoverage(Map<String, Integer> bookCoverage) { this.bookCoverage = bookCoverage; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
