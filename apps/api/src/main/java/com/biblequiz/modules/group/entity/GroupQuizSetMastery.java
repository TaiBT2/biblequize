package com.biblequiz.modules.group.entity;

import com.biblequiz.shared.converter.JsonStringListConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Personal Mastery — Q-A SAFE (KHÔNG vào group leaderboard).
 * Track tiến độ ôn tập solo của 1 user với 1 quiz set.
 */
@Entity
@Table(name = "group_quiz_set_mastery", uniqueConstraints =
        @UniqueConstraint(name = "uk_quiz_user", columnNames = {"quiz_set_id", "user_id"}))
public class GroupQuizSetMastery {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "quiz_set_id", length = 36, nullable = false)
    private String quizSetId;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "learned_question_ids", columnDefinition = "JSON", nullable = false)
    private List<String> learnedQuestionIds = new ArrayList<>();

    @Column(name = "questions_learned", nullable = false)
    private Integer questionsLearned = 0;

    @Column(name = "total_attempts", nullable = false)
    private Integer totalAttempts = 0;

    @Column(name = "best_score", nullable = false)
    private Integer bestScore = 0;

    @Column(name = "best_accuracy", precision = 5, scale = 2)
    private BigDecimal bestAccuracy;

    @Column(name = "last_practiced_at")
    private LocalDateTime lastPracticedAt;

    @Column(name = "completed_mastery", nullable = false)
    private Boolean completedMastery = false;

    @Column(name = "completed_mastery_at")
    private LocalDateTime completedMasteryAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getQuizSetId() { return quizSetId; }
    public void setQuizSetId(String quizSetId) { this.quizSetId = quizSetId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public List<String> getLearnedQuestionIds() { return learnedQuestionIds; }
    public void setLearnedQuestionIds(List<String> v) { this.learnedQuestionIds = v; }
    public Integer getQuestionsLearned() { return questionsLearned; }
    public void setQuestionsLearned(Integer v) { this.questionsLearned = v; }
    public Integer getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(Integer v) { this.totalAttempts = v; }
    public Integer getBestScore() { return bestScore; }
    public void setBestScore(Integer v) { this.bestScore = v; }
    public BigDecimal getBestAccuracy() { return bestAccuracy; }
    public void setBestAccuracy(BigDecimal v) { this.bestAccuracy = v; }
    public LocalDateTime getLastPracticedAt() { return lastPracticedAt; }
    public void setLastPracticedAt(LocalDateTime v) { this.lastPracticedAt = v; }
    public Boolean getCompletedMastery() { return completedMastery; }
    public void setCompletedMastery(Boolean v) { this.completedMastery = v; }
    public LocalDateTime getCompletedMasteryAt() { return completedMasteryAt; }
    public void setCompletedMasteryAt(LocalDateTime v) { this.completedMasteryAt = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
