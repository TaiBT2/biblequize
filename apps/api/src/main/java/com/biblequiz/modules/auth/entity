package com.biblequiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "auth_identities")
public class AuthIdentity {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, length = 50)
    private String provider;
    
    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Constructors
    public AuthIdentity() {}
    
    public AuthIdentity(String id, User user, String provider, String providerUserId) {
        this.id = id;
        this.user = user;
        this.provider = provider;
        this.providerUserId = providerUserId;
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
    
    public String getProvider() {
        return provider;
    }
    
    public void setProvider(String provider) {
        this.provider = provider;
    }
    
    public String getProviderUserId() {
        return providerUserId;
    }
    
    public void setProviderUserId(String providerUserId) {
        this.providerUserId = providerUserId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
