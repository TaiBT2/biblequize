package com.biblequiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
public class Room {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @Column(name = "room_code", unique = true, nullable = false, length = 8)
    private String roomCode;
    
    @Column(name = "room_name", nullable = false, length = 100)
    private String roomName;
    
    @Column(name = "max_players", nullable = false)
    private Integer maxPlayers = 4;
    
    @Column(name = "current_players", nullable = false)
    private Integer currentPlayers = 0;
    
    @Column(name = "question_count", nullable = false)
    private Integer questionCount = 10;
    
    @Column(name = "time_per_question", nullable = false)
    private Integer timePerQuestion = 30; // seconds
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private RoomStatus status = RoomStatus.LOBBY;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;
    
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "room_players", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "player_id")
    private List<String> players = new ArrayList<>();
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum RoomStatus {
        LOBBY,           // Đang chờ players join
        IN_PROGRESS,     // Quiz đang chạy
        ENDED,           // Quiz đã kết thúc
        CANCELLED        // Room bị hủy
    }
    
    // Constructors
    public Room() {}
    
    public Room(String id, String roomCode, String roomName, User host) {
        this.id = id;
        this.roomCode = roomCode;
        this.roomName = roomName;
        this.host = host;
    }
    
    // Add player to room
    public void addPlayer(String playerId) {
        if (!players.contains(playerId) && currentPlayers < maxPlayers) {
            players.add(playerId);
            currentPlayers++;
        }
    }
    
    // Remove player from room
    public void removePlayer(String playerId) {
        if (players.remove(playerId)) {
            currentPlayers = Math.max(0, currentPlayers - 1);
        }
    }
    
    // Check if room is full
    public boolean isFull() {
        return currentPlayers >= maxPlayers;
    }
    
    // Check if room can start
    public boolean canStart() {
        return status == RoomStatus.LOBBY && currentPlayers > 1;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    
    public Integer getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }
    
    public Integer getCurrentPlayers() { return currentPlayers; }
    public void setCurrentPlayers(Integer currentPlayers) { this.currentPlayers = currentPlayers; }
    
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    
    public Integer getTimePerQuestion() { return timePerQuestion; }
    public void setTimePerQuestion(Integer timePerQuestion) { this.timePerQuestion = timePerQuestion; }
    
    public RoomStatus getStatus() { return status; }
    public void setStatus(RoomStatus status) { this.status = status; }
    
    public User getHost() { return host; }
    public void setHost(User host) { this.host = host; }
    
    public List<String> getPlayers() { return players; }
    public void setPlayers(List<String> players) { this.players = players; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
