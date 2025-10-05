package com.biblequiz.websocket;

import com.biblequiz.entity.Room;
import com.biblequiz.entity.RoomPlayer;
import com.biblequiz.entity.User;
import com.biblequiz.repository.UserRepository;
import com.biblequiz.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
public class RoomWebSocketController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private RoomService roomService;
    
    @Autowired
    private UserRepository userRepository;

    // Lưu câu hỏi hiện tại của mỗi phòng để client vào sau có thể đồng bộ
    private final java.util.concurrent.ConcurrentHashMap<String, WebSocketMessage.QuestionStartData> roomCurrentQuestion = new java.util.concurrent.ConcurrentHashMap<>();
    
    /**
     * Handle player joining room
     */
    @MessageMapping("/room/{roomId}/join")
    public void handlePlayerJoin(@DestinationVariable String roomId, @Payload Map<String, Object> payload, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();
            
            // Get updated room details
            RoomService.RoomDetailsDTO roomDetails = roomService.getRoomDetails(roomId);
            
            // Create player joined message
            WebSocketMessage.PlayerJoinedData playerData = new WebSocketMessage.PlayerJoinedData(
                user.getId(),
                user.getName(),
                user.getAvatarUrl(),
                roomDetails.players.stream()
                    .filter(p -> p.username.equals(user.getName()))
                    .findFirst()
                    .get()
            );
            
            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.PLAYER_JOINED, playerData);
            
            // Broadcast to room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

            // Gửi lại câu hiện tại (nếu có) cho người vừa vào phòng
            WebSocketMessage.QuestionStartData current = roomCurrentQuestion.get(roomId);
            if (current != null) {
                WebSocketMessage.Message syncMsg = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.QUESTION_START, current);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, syncMsg);
            }
            
        } catch (Exception e) {
            sendError(roomId, "JOIN_ERROR", "Lỗi khi tham gia phòng: " + e.getMessage());
        }
    }
    
    /**
     * Handle player leaving room
     */
    @MessageMapping("/room/{roomId}/leave")
    public void handlePlayerLeave(@DestinationVariable String roomId, @Payload Map<String, Object> payload, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();
            
            // Remove player
            roomService.leaveRoom(roomId, user.getId());
            
            // Create player left message
            Map<String, Object> leaveData = Map.of(
                "playerId", user.getId(),
                "username", user.getName()
            );
            
            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.PLAYER_LEFT, leaveData);
            
            // Broadcast to room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
            
        } catch (Exception e) {
            sendError(roomId, "LEAVE_ERROR", "Lỗi khi rời phòng: " + e.getMessage());
        }
    }
    
    /**
     * Handle toggling ready status
     */
    @MessageMapping("/room/{roomId}/ready")
    public void handlePlayerReady(@DestinationVariable String roomId, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();
            
            // Toggle ready status
            roomService.togglePlayerReady(roomId, user.getId());
            
            // Get current room玩家 details
            RoomService.RoomDetailsDTO roomDetails = roomService.getRoomDetails(roomId);
            RoomService.PlayerInfoDTO player = roomDetails.players.stream()
                .filter(p -> p.username.equals(user.getName()))
                .findFirst()
                .get();
            
            // Create ready message
            WebSocketMessage.PlayerReadyData readyData = new WebSocketMessage.PlayerReadyData(user.getId(), user.getName(), player.isReady);
            WebSocketMessage.Message message = new WebSocketMessage.Message(
                player.isReady ? WebSocketMessage.MessageTypes.PLAYER_READY : WebSocketMessage.MessageTypes.PLAYER_UNREADY,
                readyData
            );
            
            // Broadcast to room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
            
        } catch (Exception e) {
            sendError(roomId, "READY_ERROR", "Lỗi khi thay đổi trạng thái sẵn sàng: " + e.getMessage());
        }
    }
    
    /**
     * Handle starting quiz
     */
    @MessageMapping("/room/{roomId}/start")
    public void handleStartQuiz(@DestinationVariable String roomId, @Payload Map<String, Object> payload, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();
            
            // Start the room
            roomService.startRoom(roomId, user.getId());
            
            // Create room starting message
            Map<String, Object> startData = Map.of(
                "roomId", roomId,
                "startedBy", username,
                "timestamp", System.currentTimeMillis()
            );
            
            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.ROOM_STARTING, startData);
            
            // Broadcast to room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

            // Thực tế: việc phát câu hỏi sẽ do luồng quiz điều phối từ RoomService/SessionService
            // Ở đây chỉ báo bắt đầu để client chuyển trạng thái
            
        } catch (Exception e) {
            sendError(roomId, "START_ERROR", "Lỗi khi bắt đầu quiz: " + e.getMessage());
        }
    }
    
    /**
     * Handle submitting answer
     */
    @MessageMapping("/room/{roomId}/answer")
    public void handleAnswerSubmission(@DestinationVariable String roomId, @Payload Map<String, Object> payload, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();
            
            int questionIndex = (Integer) payload.get("questionIndex");
            int answerIndex = (Integer) payload.get("answerIndex");
            long reactionTimeMs = ((Number) payload.get("reactionTimeMs")).longValue();
            
            // ToDo: Validate answer and update score in database
            // This would involve checking the answer, updating RoomPlayer score, etc.
            
            // Create answer submitted message
            WebSocketMessage.AnswerSubmittedData answerData = new WebSocketMessage.AnswerSubmittedData(
                user.getId(),
                user.getName(),
                questionIndex,
                answerIndex,
                reactionTimeMs
            );
            
            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.ANSWER_SUBMITTED, answerData);
            
            // Broadcast to room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
            
        } catch (Exception e) {
            sendError(roomId, "ANSWER_ERROR", "Lỗi khi nộp câu trả lời: " + e.getMessage());
        }
    }
    
    /**
     * Send error message to room
     */
    private void sendError(String roomId, String errorType, String message) {
        WebSocketMessage.ErrorData errorData = new WebSocketMessage.ErrorData(errorType, message);
        WebSocketMessage.Message errorMessage = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.ERROR, errorData);
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId, errorMessage);
    }
    
    /**
     * Broadcast leaderboard update
     */
    public void broadcastLeaderboardUpdate(String roomId) {
        try {
            List<RoomService.LeaderboardEntryDTO> leaderboard = roomService.getRoomLeaderboard(roomId);
            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.LEADERBOARD_UPDATE, leaderboard);
            
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
            
        } catch (Exception e) {
            sendError(roomId, "LEADERBOARD_ERROR", "Lỗi khi cập nhật bảng xếp hạng: " + e.getMessage());
        }
    }
    
    /**
     * Broadcast score update for a specific player
     */
    public void broadcastScoreUpdate(String roomId, String playerId, int newScore, int correctAnswers, int totalAnswered) {
        try {
            // Get player username
            RoomService.RoomDetailsDTO roomDetails = roomService.getRoomDetails(roomId);
            String username = roomDetails.players.stream()
                .filter(p -> p.id.equals(playerId))
                .findFirst()
                .map(p -> p.username)
                .orElse("Unknown");
            
            WebSocketMessage.ScoreUpdateData scoreData = new WebSocketMessage.ScoreUpdateData(playerId, username, newScore, correctAnswers, totalAnswered);
            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.SCORE_UPDATE, scoreData);
            
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
            
        } catch (Exception e) {
            sendError(roomId, "SCORE_ERROR", "Lỗi khi cập nhật điểm: " + e.getMessage());
        }
    }
    
    /**
     * Broadcast question start
     */
    public void broadcastQuestionStart(String roomId, int questionIndex, int totalQuestions, Object question, int timeLimit) {
        WebSocketMessage.QuestionStartData questionData = new WebSocketMessage.QuestionStartData(questionIndex, totalQuestions, question, timeLimit);
        roomCurrentQuestion.put(roomId, questionData);
        WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.QUESTION_START, questionData);
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }
    
    /**
     * Broadcast quiz end
     */
    public void broadcastQuizEnd(String roomId, Object finalResults) {
        Map<String, Object> endData = Map.of(
            "roomId", roomId,
            "timestamp", System.currentTimeMillis(),
            "finalResults", finalResults
        );
        
        WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.QUIZ_END, endData);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }
}
