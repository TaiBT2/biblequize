package com.biblequiz.modules.lifeline.entity;

import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.user.entity.User;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Records each invocation of a lifeline during a quiz session.
 *
 * <p>For {@link LifelineType#HINT}, a user can invoke multiple times on the
 * same question (until all wrong options are eliminated). Each invocation
 * stores the {@code eliminatedOptionIndex} it chose so repeated calls are
 * idempotent and the frontend can rehydrate the eliminated set after a
 * page reload.
 *
 * <p>The unique constraint
 * {@code (session_id, question_id, user_id, type, eliminated_option_index)}
 * prevents exact duplicates but allows multiple HINT rows per question
 * (each eliminating a different option).
 */
@Entity
@Table(name = "lifeline_usage")
public class LifelineUsage {

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private LifelineType type;

    /**
     * For HINT: index of the wrong answer option that was eliminated.
     * For ASK_OPINION (v2): {@code null}.
     */
    @Column(name = "eliminated_option_index")
    private Integer eliminatedOptionIndex;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Constructors ──
    public LifelineUsage() {}

    public LifelineUsage(String id, QuizSession session, Question question, User user,
                         LifelineType type, Integer eliminatedOptionIndex) {
        this.id = id;
        this.session = session;
        this.question = question;
        this.user = user;
        this.type = type;
        this.eliminatedOptionIndex = eliminatedOptionIndex;
    }

    // ── Getters / Setters ──
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public QuizSession getSession() { return session; }
    public void setSession(QuizSession session) { this.session = session; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LifelineType getType() { return type; }
    public void setType(LifelineType type) { this.type = type; }

    public Integer getEliminatedOptionIndex() { return eliminatedOptionIndex; }
    public void setEliminatedOptionIndex(Integer eliminatedOptionIndex) {
        this.eliminatedOptionIndex = eliminatedOptionIndex;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
