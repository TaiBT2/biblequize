package com.biblequiz.modules.coverage.entity;

import com.biblequiz.shared.converter.JsonListConverter;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Pre-computed weekly book pairing for the Liturgical Coverage System (§7.7.1).
 * 1 row per (season, week_number) — total 4 mùa × 13 weeks = 52 rows.
 *
 * <p>Phase enum drives Foundation (weeks 1-4) / Acceleration (5-8) /
 * Climax (9-11, focus books reserve) / Mastery (12-13, runtime-computed,
 * empty book_codes).</p>
 */
@Entity
@Table(name = "weekly_pairings",
       uniqueConstraints = @UniqueConstraint(name = "uk_season_week",
                                             columnNames = {"season_id", "week_number"}))
public class WeeklyPairing {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "season_id", nullable = false, length = 36)
    private String seasonId;

    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Phase phase;

    @Column(name = "book_codes", columnDefinition = "JSON", nullable = false)
    @Convert(converter = JsonListConverter.class)
    private List<String> bookCodes = new ArrayList<>();

    @Column(name = "is_admin_override", nullable = false)
    private Boolean isAdminOverride = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Phase { FOUNDATION, ACCELERATION, CLIMAX, MASTERY }

    public WeeklyPairing() {}

    public WeeklyPairing(String id, String seasonId, Integer weekNumber, Phase phase, List<String> bookCodes) {
        this.id = id;
        this.seasonId = seasonId;
        this.weekNumber = weekNumber;
        this.phase = phase;
        this.bookCodes = bookCodes;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSeasonId() { return seasonId; }
    public void setSeasonId(String seasonId) { this.seasonId = seasonId; }
    public Integer getWeekNumber() { return weekNumber; }
    public void setWeekNumber(Integer weekNumber) { this.weekNumber = weekNumber; }
    public Phase getPhase() { return phase; }
    public void setPhase(Phase phase) { this.phase = phase; }
    public List<String> getBookCodes() { return bookCodes; }
    public void setBookCodes(List<String> bookCodes) { this.bookCodes = bookCodes; }
    public Boolean getIsAdminOverride() { return isAdminOverride; }
    public void setIsAdminOverride(Boolean isAdminOverride) { this.isAdminOverride = isAdminOverride; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
