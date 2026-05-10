package com.biblequiz.modules.group.entity;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.shared.converter.JsonListConverter;
import com.biblequiz.shared.converter.JsonStringListConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "group_quiz_sets")
public class GroupQuizSet {

    public enum PublishStatus { DRAFT, PUBLISHED, ARCHIVED, SOFT_DELETED }
    public enum Difficulty { EASY, MEDIUM, HARD, MIXED }

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ChurchGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false)
    private String name;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "question_ids", columnDefinition = "JSON")
    private List<?> questionIds;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ── Sprint 5 baseline cols (V50 drift fix) ─────────────────────────────

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions = 0;

    @Column(length = 2, nullable = false)
    private String language = "VI";

    // ── Sprint 5 metadata (15 cols) ────────────────────────────────────────

    @Column(length = 500)
    private String description;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> tags = new ArrayList<>();

    @Column(name = "cover_scripture", length = 100)
    private String coverScripture;

    @Column(name = "author_note", length = 1000)
    private String authorNote;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Column(name = "estimated_duration_min")
    private Integer estimatedDurationMin;

    @Column(name = "suggested_mode", length = 50)
    private String suggestedMode;

    @Column(name = "play_count", nullable = false)
    private Integer playCount = 0;

    @Column(name = "average_rating", precision = 3, scale = 2)
    private BigDecimal averageRating;

    @Column(name = "total_ratings", nullable = false)
    private Integer totalRatings = 0;

    @Column(name = "last_played_at")
    private LocalDateTime lastPlayedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "publish_status", nullable = false)
    private PublishStatus publishStatus = PublishStatus.PUBLISHED;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "folder_id", length = 36)
    private String folderId;

    public GroupQuizSet() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ChurchGroup getGroup() { return group; }
    public void setGroup(ChurchGroup group) { this.group = group; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<?> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<?> questionIds) { this.questionIds = questionIds; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public String getCoverScripture() { return coverScripture; }
    public void setCoverScripture(String coverScripture) { this.coverScripture = coverScripture; }

    public String getAuthorNote() { return authorNote; }
    public void setAuthorNote(String authorNote) { this.authorNote = authorNote; }

    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }

    public Integer getEstimatedDurationMin() { return estimatedDurationMin; }
    public void setEstimatedDurationMin(Integer estimatedDurationMin) { this.estimatedDurationMin = estimatedDurationMin; }

    public String getSuggestedMode() { return suggestedMode; }
    public void setSuggestedMode(String suggestedMode) { this.suggestedMode = suggestedMode; }

    public Integer getPlayCount() { return playCount; }
    public void setPlayCount(Integer playCount) { this.playCount = playCount; }

    public BigDecimal getAverageRating() { return averageRating; }
    public void setAverageRating(BigDecimal averageRating) { this.averageRating = averageRating; }

    public Integer getTotalRatings() { return totalRatings; }
    public void setTotalRatings(Integer totalRatings) { this.totalRatings = totalRatings; }

    public LocalDateTime getLastPlayedAt() { return lastPlayedAt; }
    public void setLastPlayedAt(LocalDateTime lastPlayedAt) { this.lastPlayedAt = lastPlayedAt; }

    public PublishStatus getPublishStatus() { return publishStatus; }
    public void setPublishStatus(PublishStatus publishStatus) { this.publishStatus = publishStatus; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public String getFolderId() { return folderId; }
    public void setFolderId(String folderId) { this.folderId = folderId; }
}
