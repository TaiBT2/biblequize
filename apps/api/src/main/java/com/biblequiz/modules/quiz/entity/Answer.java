package com.biblequiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "answers")
public class Answer {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private QuizSession session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, columnDefinition = "JSON")
    private String answer;
    
    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;
    
    @Column(name = "elapsed_ms", nullable = false)
    private Integer elapsedMs;
    
    @Column(name = "score_earned")
    private Integer scoreEarned = 0;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Constructors
    public Answer() {}
    
    public Answer(String id, QuizSession session, Question question, User user, 
                  String answer, Boolean isCorrect, Integer elapsedMs, Integer scoreEarned) {
        this.id = id;
        this.session = session;
        this.question = question;
        this.user = user;
        this.answer = answer;
        this.isCorrect = isCorrect;
        this.elapsedMs = elapsedMs;
        this.scoreEarned = scoreEarned;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public QuizSession getSession() {
        return session;
    }
    
    public void setSession(QuizSession session) {
        this.session = session;
    }
    
    public Question getQuestion() {
        return question;
    }
    
    public void setQuestion(Question question) {
        this.question = question;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getAnswer() {
        return answer;
    }
    
    public void setAnswer(String answer) {
        this.answer = answer;
    }
    
    public Boolean getIsCorrect() {
        return isCorrect;
    }
    
    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
    
    public Integer getElapsedMs() {
        return elapsedMs;
    }
    
    public void setElapsedMs(Integer elapsedMs) {
        this.elapsedMs = elapsedMs;
    }
    
    public Integer getScoreEarned() {
        return scoreEarned;
    }
    
    public void setScoreEarned(Integer scoreEarned) {
        this.scoreEarned = scoreEarned;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
