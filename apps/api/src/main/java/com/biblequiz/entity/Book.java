package com.biblequiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "books")
public class Book {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(name = "name_vi", length = 100)
    private String nameVi;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Testament testament;
    
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public enum Testament {
        OLD, NEW
    }
    
    // Constructors
    public Book() {}
    
    public Book(String id, String name, String nameVi, Testament testament, Integer orderIndex) {
        this.id = id;
        this.name = name;
        this.nameVi = nameVi;
        this.testament = testament;
        this.orderIndex = orderIndex;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getNameVi() {
        return nameVi;
    }
    
    public void setNameVi(String nameVi) {
        this.nameVi = nameVi;
    }
    
    public Testament getTestament() {
        return testament;
    }
    
    public void setTestament(Testament testament) {
        this.testament = testament;
    }
    
    public Integer getOrderIndex() {
        return orderIndex;
    }
    
    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
