package com.biblequiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Entity
@Table(name = "room_room_players")
public class RoomPlayer {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "username", nullable = false, length = 50)
    private String username;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column(name = "is_ready", nullable = false)
    private Boolean isReady = false;
    
    @Column(name = "score", nullable = false)
    private Integer score = 0;
    
    @Column(name = "total_answered", nullable = false)
    private Integer totalAnswered = 0;
    
    @Column(name = "correct_answers", nullable = false)
    private Integer correctAnswers = 0;
    
    @Column(name = "average_reaction_time", nullable = false)
    private Double averageReactionTime = 0.0;
    
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "room_player_answers", joinColumns = @JoinColumn(name = "room_player_id"))
    @MapKeyColumn(name = "question_index")
    @Column(name = "answer_data")
    private Map<Integer, String> answers = new HashMap<>();
    
    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;
    
    // Constructors
    public RoomPlayer() {}
    
    public RoomPlayer(String id, Room room, User user, String username) {
        this.id = id;
        this.room = room;
        this.user = user;
        this.username = username;
        this.avatarUrl = user.getAvatarUrl();
    }
    
    // Add answer and update stats
    public void addAnswer(int questionIndex, String answerData) {
        answers.put(questionIndex, answerData);
        totalAnswered++;
        
        // Parse answer data to check correctness and update stats
        // This is a simplified version - in real implementation, you'd parse JSON
        if (answerData.contains("\"isCorrect\":true")) {
            correctAnswers++;
            score += 10; // Base score per correct answer
        }
    }
    
    // Calculate accuracy percentage
    public double getAccuracy() {
        return totalAnswered > 0 ? (double) correctAnswers / totalAnswered * 100 : 0.0;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    
    public Boolean getIsReady() { return isReady; }
    public void setIsReady(Boolean isReady) { this.isReady = isReady; }
    
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    
    public Integer getTotalAnswered() { return totalAnswered; }
    public void setTotalAnswered(Integer totalAnswered) { this.totalAnswered = totalAnswered; }
    
    public Integer getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(Integer correctAnswers) { this.correctAnswers = correctAnswers; }
    
    public Double getAverageReactionTime() { return averageReactionTime; }
    public void setAverageReactionTime(Double averageReactionTime) { this.averageReactionTime = averageReactionTime; }
    
    public Map<Integer, String> getAnswers() { return answers; }
    public void setAnswers(Map<Integer, String> answers) { this.answers = answers; }
    
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
