package com.biblequiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_session_questions")
public class QuizSessionQuestion {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private QuizSession session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
    
    @Column(name = "reveal_at")
    private LocalDateTime revealAt;
    
    @Column(name = "time_limit_sec")
    private Integer timeLimitSec = 30;
    
    @Column(name = "answered_at")
    private LocalDateTime answeredAt;
    
    @Column(name = "is_correct")
    private Boolean isCorrect;
    
    @Column(name = "score_earned")
    private Integer scoreEarned = 0;
    
    // Constructors
    public QuizSessionQuestion() {}
    
    public QuizSessionQuestion(String id, QuizSession session, Question question, 
                              Integer orderIndex, Integer timeLimitSec) {
        this.id = id;
        this.session = session;
        this.question = question;
        this.orderIndex = orderIndex;
        this.timeLimitSec = timeLimitSec;
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
    
    public Integer getOrderIndex() {
        return orderIndex;
    }
    
    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }
    
    public LocalDateTime getRevealAt() {
        return revealAt;
    }
    
    public void setRevealAt(LocalDateTime revealAt) {
        this.revealAt = revealAt;
    }
    
    public Integer getTimeLimitSec() {
        return timeLimitSec;
    }
    
    public void setTimeLimitSec(Integer timeLimitSec) {
        this.timeLimitSec = timeLimitSec;
    }
    
    public LocalDateTime getAnsweredAt() {
        return answeredAt;
    }
    
    public void setAnsweredAt(LocalDateTime answeredAt) {
        this.answeredAt = answeredAt;
    }
    
    public Boolean getIsCorrect() {
        return isCorrect;
    }
    
    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
    
    public Integer getScoreEarned() {
        return scoreEarned;
    }
    
    public void setScoreEarned(Integer scoreEarned) {
        this.scoreEarned = scoreEarned;
    }
}
