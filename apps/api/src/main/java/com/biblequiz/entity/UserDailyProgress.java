package com.biblequiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;
import com.biblequiz.converter.JsonListConverter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "user_daily_progress")
public class UserDailyProgress {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(name = "lives_remaining", nullable = false)
    private Integer livesRemaining = 10;
    
    @Column(name = "questions_counted", nullable = false)
    private Integer questionsCounted = 0;
    
    @Column(name = "points_counted", nullable = false)
    private Integer pointsCounted = 0;
    
    @Column(name = "current_book", nullable = false, length = 100)
    private String currentBook = "Genesis";
    
    @Column(name = "current_book_index", nullable = false)
    private Integer currentBookIndex = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "current_difficulty", nullable = false)
    private Difficulty currentDifficulty = Difficulty.all;
    
    @Column(name = "is_post_cycle", nullable = false)
    private Boolean isPostCycle = false;
    
    @UpdateTimestamp
    @Column(name = "last_updated_at")
    private LocalDateTime lastUpdatedAt;

    @Column(name = "asked_question_ids", columnDefinition = "JSON")
    @Convert(converter = JsonListConverter.class)
    private List<String> askedQuestionIds;
    
    public enum Difficulty {
        easy, medium, hard, all
    }
    
    // Constructors
    public UserDailyProgress() {}
    
    public UserDailyProgress(String id, User user, LocalDate date) {
        this.id = id;
        this.user = user;
        this.date = date;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public Integer getLivesRemaining() {
        return livesRemaining;
    }
    
    public void setLivesRemaining(Integer livesRemaining) {
        this.livesRemaining = livesRemaining;
    }
    
    public Integer getQuestionsCounted() {
        return questionsCounted;
    }
    
    public void setQuestionsCounted(Integer questionsCounted) {
        this.questionsCounted = questionsCounted;
    }
    
    public Integer getPointsCounted() {
        return pointsCounted;
    }
    
    public void setPointsCounted(Integer pointsCounted) {
        this.pointsCounted = pointsCounted;
    }
    
    public String getCurrentBook() {
        return currentBook;
    }
    
    public void setCurrentBook(String currentBook) {
        this.currentBook = currentBook;
    }
    
    public Integer getCurrentBookIndex() {
        return currentBookIndex;
    }
    
    public void setCurrentBookIndex(Integer currentBookIndex) {
        this.currentBookIndex = currentBookIndex;
    }
    
    public Difficulty getCurrentDifficulty() {
        return currentDifficulty;
    }
    
    public void setCurrentDifficulty(Difficulty currentDifficulty) {
        this.currentDifficulty = currentDifficulty;
    }
    
    public Boolean getIsPostCycle() {
        return isPostCycle;
    }
    
    public void setIsPostCycle(Boolean isPostCycle) {
        this.isPostCycle = isPostCycle;
    }
    
    public LocalDateTime getLastUpdatedAt() {
        return lastUpdatedAt;
    }
    
    public void setLastUpdatedAt(LocalDateTime lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt;
    }

    public List<String> getAskedQuestionIds() {
        return askedQuestionIds;
    }

    public void setAskedQuestionIds(List<String> askedQuestionIds) {
        this.askedQuestionIds = askedQuestionIds;
    }
}
