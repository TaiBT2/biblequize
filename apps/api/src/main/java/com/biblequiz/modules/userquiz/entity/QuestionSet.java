package com.biblequiz.modules.userquiz.entity;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.shared.converter.JsonStringListConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "question_sets")
public class QuestionSet {

    public enum Visibility { PRIVATE, PUBLIC }
    public enum PublishStatus { DRAFT, PUBLISHED, ARCHIVED, SOFT_DELETED }
    public enum Difficulty { EASY, MEDIUM, HARD, MIXED }

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Visibility visibility = Visibility.PRIVATE;

    @Column(name = "question_count", nullable = false)
    private int questionCount = 0;

    @OneToMany(mappedBy = "questionSet", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    private List<QuestionSetItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Phase 1 MVP metadata (V56) ─────────────────────────────────────────────

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

    @Column(length = 2, nullable = false)
    private String language = "VI";

    // Entity-level default = DRAFT for new rows; SQL default = PUBLISHED for back-compat
    // (V56 backfill keeps existing rows playable in CreateRoom).
    @Enumerated(EnumType.STRING)
    @Column(name = "publish_status", nullable = false, length = 20)
    private PublishStatus publishStatus = PublishStatus.DRAFT;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Visibility getVisibility() { return visibility; }
    public void setVisibility(Visibility visibility) { this.visibility = visibility; }

    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }

    public List<QuestionSetItem> getItems() { return items; }
    public void setItems(List<QuestionSetItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

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

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public PublishStatus getPublishStatus() { return publishStatus; }
    public void setPublishStatus(PublishStatus publishStatus) { this.publishStatus = publishStatus; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
}
