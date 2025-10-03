package com.biblequiz.service;

import com.biblequiz.entity.Room;
import com.biblequiz.entity.RoomPlayer;
import com.biblequiz.entity.User;
import com.biblequiz.repository.RoomRepository;
import com.biblequiz.repository.RoomPlayerRepository;
import com.biblequiz.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomService {
    
    @Autowired
    private RoomRepository roomRepository;
    
    @Autowired
    private RoomPlayerRepository roomPlayerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Create a new room
     */
    public Room createRoom(String roomName, User host, Integer maxPlayers, Integer questionCount, Integer timePerQuestion) {
        String roomId = UUID.randomUUID().toString();
        String roomCode = generateRoomCode();
        
        // Ensure room code is unique
        while (roomRepository.findByRoomCode(roomCode).isPresent()) {
            roomCode = generateRoomCode();
        }
        
        Room room = new Room();
        room.setId(roomId);
        room.setRoomCode(roomCode);
        room.setRoomName(roomName);
        room.setHost(host);
        room.setMaxPlayers(maxPlayers != null ? maxPlayers : 4);
        room.setQuestionCount(questionCount != null ? questionCount : 10);
        room.setTimePerQuestion(timePerQuestion != null ? timePerQuestion : 30);
        room.setStatus(Room.RoomStatus.LOBBY);
        
        roomRepository.save(room);
        
        // Automatically add host as first player
        addPlayerToRoom(roomId, host);
        
        return room;
    }
    
    /**
     * Join a room by room code
     */
    public Room joinRoom(String roomCode, User user) throws Exception {
        Room room = roomRepository.findByRoomCode(roomCode)
            .orElseThrow(() -> new Exception("Phòng không tồn tại"));
            
        if (room.getStatus() != Room.RoomStatus.LOBBY) {
            throw new Exception("Phòng đã bắt đầu hoặc kết thúc");
        }
        
        if (room.isFull()) {
            throw new Exception("Phòng có thể người");
        }
        
        // Check if user is already in this room
        if (roomPlayerRepository.findByRoomIdAndUserId(room.getId(), user.getId()).isPresent()) {
            throw new Exception("Bạn đã có mặt trong phòng này");
        }
        
        addPlayerToRoom(room.getId(), user);
        
        return room;
    }
    
    /**
     * Add player to room
     */
    private void addPlayerToRoom(String roomId, User user) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        
        // Add to room player list
        room.addPlayer(user.getId());
        roomRepository.save(room);
        
        // Create RoomPlayer entity
        String playerId = UUID.randomUUID().toString();
        RoomPlayer roomPlayer = new RoomPlayer(playerId, room, user, user.getName());
        roomPlayerRepository.save(roomPlayer);
    }
    
    /**
     * Remove player from room
     */
    public void leaveRoom(String roomId, String userId) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        
        // Remove from room player list
        room.removePlayer(userId);
        roomRepository.save(room);
        
        // Remove RoomPlayer entity
        roomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
            .ifPresent(roomPlayerRepository::delete);
        
        // If room is empty, delete it
        if (room.getCurrentPlayers() == 0) {
            roomRepository.delete(room);
        }
    }
    
    /**
     * Toggle player ready status
     */
    public void togglePlayerReady(String roomId, String userId) throws Exception {
        roomRepository.findById(roomId).orElseThrow(() -> new Exception("Phòng không tồn tại"));
        RoomPlayer roomPlayer = roomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
            .orElseThrow(() -> new Exception("Người chơi không tìm thấy"));
            
        roomPlayer.setIsReady(!roomPlayer.getIsReady());
        
        roomPlayerRepository.save(roomPlayer);
    }
    
    /**
     * Start quiz for room
     */
    public void startRoom(String roomId, String userId) throws Exception {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new Exception("Phòng không tồn tại"));
        
        // Check if user is the host
        if (!room.getHost().getId().equals(userId)) {
            throw new Exception("Chỉ chủ phòng mới có thể bắt đầu");
        }
        
        // Check if room can start
        if (!room.canStart()) {
            throw new Exception("Cần ít nhất 2 người chơi để bắt đầu");
        }
        
        // Check if all players are ready
        List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);
        boolean allReady = players.stream().allMatch(RoomPlayer::getIsReady);
        
        if (!allReady) {
            throw new Exception("Tất cả người chơi phải sẵn sàng");
        }
        
        room.setStatus(Room.RoomStatus.IN_PROGRESS);
        roomRepository.save(room);
    }
    
    /**
     * End quiz for room
     */
    public void endRoom(String roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        room.setStatus(Room.RoomStatus.ENDED);
        roomRepository.save(room);
    }
    
    /**
     * Get room details with players
     */
    public RoomDetailsDTO getRoomDetails(String roomId) throws Exception {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new Exception("Phòng không tồn tại"));
        List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);
        
        return new RoomDetailsDTO(room, players);
    }
    
    /**
     * Get leaderboard for room
     */
    public List<LeaderboardEntryDTO> getRoomLeaderboard(String roomId) {
        List<RoomPlayer> players = roomPlayerRepository.findByRoomIdOrderByScoreDesc(roomId);
        
        return players.stream()
            .map(player -> new LeaderboardEntryDTO(
                player.getId(),
                player.getUsername(),
                player.getAvatarUrl(),
                player.getScore(),
                player.getCorrectAnswers(),
                player.getTotalAnswered(),
                player.getAccuracy()
            ))
            .collect(Collectors.toList());
    }
    
    /**
     * Generate random 6-character room code
     */
    private String generateRoomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        Random random = new Random();
        
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return code.toString();
    }
    
    /**
     * DTO for room details
     */
    public static class RoomDetailsDTO {
        public final String id;
        public final String roomCode;
        public final String roomName;
        public final Room.RoomStatus status;
        public final Integer maxPlayers;
        public final Integer currentPlayers;
        public final Integer questionCount;
        public final Integer timePerQuestion;
        public final String hostId;
        public final String hostName;
        public final List<PlayerInfoDTO> players;
        
        public RoomDetailsDTO(Room room, List<RoomPlayer> roomPlayers) {
            this.id = room.getId();
            this.roomCode = room.getRoomCode();
            this.roomName = room.getRoomName();
            this.status = room.getStatus();
            this.maxPlayers = room.getMaxPlayers();
            this.currentPlayers = room.getCurrentPlayers();
            this.questionCount = room.getQuestionCount();
            this.timePerQuestion = room.getTimePerQuestion();
            this.hostId = room.getHost().getId();
            this.hostName = room.getHost().getName();
            
            this.players = roomPlayers.stream()
                .map(player -> new PlayerInfoDTO(
                    player.getId(),
                    player.getUsername(),
                    player.getAvatarUrl(),
                    player.getIsReady(),
                    player.getScore()
                ))
                .collect(Collectors.toList());
        }
    }
    
    /**
     * DTO for player info
     */
    public static class PlayerInfoDTO {
        public final String id;
        public final String username;
        public final String avatarUrl;
        public final Boolean isReady;
        public final Integer score;
        
        public PlayerInfoDTO(String id, String username, String avatarUrl, Boolean isReady, Integer score) {
            this.id = id;
            this.username = username;
            this.avatarUrl = avatarUrl;
            this.isReady = isReady;
            this.score = score;
        }
    }
    
    /**
     * DTO for leaderboard entry
     */
    public static class LeaderboardEntryDTO {
        public final String playerId;
        public final String username;
        public final String avatarUrl;
        public final Integer score;
        public final Integer correctAnswers;
        public final Integer totalAnswered;
        public final Double accuracy;
        
        public LeaderboardEntryDTO(String playerId, String username, String avatarUrl, 
                                  Integer score, Integer correctAnswers, Integer totalAnswered, Double accuracy) {
            this.playerId = playerId;
            this.username = username;
            this.avatarUrl = avatarUrl;
            this.score = score;
            this.correctAnswers = correctAnswers;
            this.totalAnswered = totalAnswered;
            this.accuracy = accuracy;
        }
    }
}
