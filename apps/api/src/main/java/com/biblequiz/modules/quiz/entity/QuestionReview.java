package com.biblequiz.modules.quiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "question_reviews")
public class QuestionReview {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "question_id", nullable = false, length = 36)
    private String questionId;

    @Column(name = "admin_id", nullable = false, length = 36)
    private String adminId;

    @Column(name = "admin_email", length = 255)
    private String adminEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Action action;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum Action { APPROVE, REJECT }

    public QuestionReview() {}

    public QuestionReview(String id, String questionId, String adminId, String adminEmail, Action action, String comment) {
        this.id = id;
        this.questionId = questionId;
        this.adminId = adminId;
        this.adminEmail = adminEmail;
        this.action = action;
        this.comment = comment;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }

    public Action getAction() { return action; }
    public void setAction(Action action) { this.action = action; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
