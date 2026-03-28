package com.biblequiz.modules.group.entity;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.shared.converter.JsonListConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "group_quiz_sets")
public class GroupQuizSet {

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

    public GroupQuizSet() {
    }

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
}
