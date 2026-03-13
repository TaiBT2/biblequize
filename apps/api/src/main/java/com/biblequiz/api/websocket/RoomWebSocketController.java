package com.biblequiz.api.websocket;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.service.SessionService;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;
import com.biblequiz.modules.room.service.RoomService;
import com.biblequiz.modules.room.service.RoomStateService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

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

    @Autowired
    private RoomStateService roomStateService;

    @Autowired
    private RoomPlayerRepository roomPlayerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    /**
     * Handle player joining room
     */
    @MessageMapping("/room/{roomId}/join")
    public void handlePlayerJoin(@DestinationVariable String roomId, @Payload Map<String, Object> payload,
            Authentication authentication) {
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
                            .get());

            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.PLAYER_JOINED,
                    playerData);

            // Broadcast to room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

            // Gửi lại câu hiện tại (nếu có) cho người vừa vào phòng (Re-sync)
            roomStateService.getCurrentQuestion(roomId).ifPresent(current -> {
                WebSocketMessage.Message syncMsg = new WebSocketMessage.Message(
                        WebSocketMessage.MessageTypes.QUESTION_START, current);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, syncMsg);
            });

        } catch (Exception e) {
            sendError(roomId, "JOIN_ERROR", "Lỗi khi tham gia phòng: " + e.getMessage());
        }
    }

    /**
     * Handle player leaving room
     */
    @MessageMapping("/room/{roomId}/leave")
    public void handlePlayerLeave(@DestinationVariable String roomId, @Payload Map<String, Object> payload,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();

            // Remove player
            roomService.leaveRoom(roomId, user.getId());

            // Create player left message
            Map<String, Object> leaveData = Map.of(
                    "playerId", user.getId(),
                    "username", user.getName());

            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.PLAYER_LEFT,
                    leaveData);

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
            WebSocketMessage.PlayerReadyData readyData = new WebSocketMessage.PlayerReadyData(user.getId(),
                    user.getName(), player.isReady);
            WebSocketMessage.Message message = new WebSocketMessage.Message(
                    player.isReady ? WebSocketMessage.MessageTypes.PLAYER_READY
                            : WebSocketMessage.MessageTypes.PLAYER_UNREADY,
                    readyData);

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
    public void handleStartQuiz(@DestinationVariable String roomId, @Payload Map<String, Object> payload,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();

            // Start the room
            roomService.startRoom(roomId, user.getId());

            // Create room starting message
            Map<String, Object> startData = Map.of(
                    "roomId", roomId,
                    "startedBy", username,
                    "timestamp", System.currentTimeMillis());

            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.ROOM_STARTING,
                    startData);

            // Broadcast to room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

            // Thực tế: việc phát câu hỏi sẽ do luồng quiz điều phối từ
            // RoomService/SessionService
            // Ở đây chỉ báo bắt đầu để client chuyển trạng thái

        } catch (Exception e) {
            sendError(roomId, "START_ERROR", "Lỗi khi bắt đầu quiz: " + e.getMessage());
        }
    }

    /**
     * Handle submitting answer
     */
    @MessageMapping("/room/{roomId}/answer")
    public void handleAnswerSubmission(@DestinationVariable String roomId, @Payload Map<String, Object> payload,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();

            int questionIndex = ((Number) payload.get("questionIndex")).intValue();
            int answerIndex = ((Number) payload.get("answerIndex")).intValue();
            long reactionTimeMs = ((Number) payload.get("reactionTimeMs")).longValue();

            // Server-side answer validation
            boolean isCorrect = false;
            int timeBonus = 0;

            java.util.Optional<WebSocketMessage.QuestionStartData> questionState = roomStateService
                    .getCurrentQuestion(roomId);
            if (questionState.isPresent()) {
                WebSocketMessage.QuestionStartData state = questionState.get();
                String questionId = extractQuestionId(state.question);
                if (questionId != null) {
                    Question question = questionRepository.findById(questionId).orElse(null);
                    if (question != null && question.getCorrectAnswer() != null
                            && !question.getCorrectAnswer().isEmpty()) {
                        isCorrect = (answerIndex == question.getCorrectAnswer().get(0));
                        if (isCorrect && state.timeLimit > 0) {
                            long timeLeftMs = (state.timeLimit * 1000L) - reactionTimeMs;
                            timeBonus = (int) Math.max(0, timeLeftMs / 1000);
                        }
                    }
                }
            }

            // Update RoomPlayer score in database
            final boolean answerIsCorrect = isCorrect;
            final int bonus = timeBonus;
            roomPlayerRepository.findByRoomIdAndUserId(roomId, user.getId()).ifPresent(roomPlayer -> {
                String answerJson = String.format(
                        "{\"questionIndex\":%d,\"answerIndex\":%d,\"isCorrect\":%b,\"reactionTimeMs\":%d}",
                        questionIndex, answerIndex, answerIsCorrect, reactionTimeMs);
                roomPlayer.addAnswer(questionIndex, answerJson);
                if (answerIsCorrect && bonus > 0) {
                    roomPlayer.setScore(roomPlayer.getScore() + bonus);
                }
                roomPlayerRepository.save(roomPlayer);
                broadcastScoreUpdate(roomId, user.getId(), roomPlayer.getScore(),
                        roomPlayer.getCorrectAnswers(), roomPlayer.getTotalAnswered());
            });

            // Broadcast answer submitted with server-validated result
            WebSocketMessage.AnswerSubmittedData answerData = new WebSocketMessage.AnswerSubmittedData(
                    user.getId(), user.getName(), questionIndex, answerIndex, reactionTimeMs, isCorrect);
            WebSocketMessage.Message message = new WebSocketMessage.Message(
                    WebSocketMessage.MessageTypes.ANSWER_SUBMITTED, answerData);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

        } catch (Exception e) {
            sendError(roomId, "ANSWER_ERROR", "Lỗi khi nộp câu trả lời: " + e.getMessage());
        }
    }

    /**
     * Extract question ID from question object stored in Redis (may be deserialized as Map)
     */
    private String extractQuestionId(Object questionObj) {
        if (questionObj instanceof Map<?, ?> map) {
            Object id = map.get("id");
            return id != null ? id.toString() : null;
        }
        if (questionObj instanceof Question q) {
            return q.getId();
        }
        return null;
    }

    /**
     * Send error message to room
     */
    private void sendError(String roomId, String errorType, String message) {
        WebSocketMessage.ErrorData errorData = new WebSocketMessage.ErrorData(errorType, message);
        WebSocketMessage.Message errorMessage = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.ERROR,
                errorData);

        messagingTemplate.convertAndSend("/topic/room/" + roomId, errorMessage);
    }

    /**
     * Broadcast leaderboard update
     */
    public void broadcastLeaderboardUpdate(String roomId) {
        try {
            List<RoomService.LeaderboardEntryDTO> leaderboard = roomService.getRoomLeaderboard(roomId);
            WebSocketMessage.Message message = new WebSocketMessage.Message(
                    WebSocketMessage.MessageTypes.LEADERBOARD_UPDATE, leaderboard);

            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

        } catch (Exception e) {
            sendError(roomId, "LEADERBOARD_ERROR", "Lỗi khi cập nhật bảng xếp hạng: " + e.getMessage());
        }
    }

    /**
     * Broadcast score update for a specific player
     */
    public void broadcastScoreUpdate(String roomId, String playerId, int newScore, int correctAnswers,
            int totalAnswered) {
        try {
            // Get player username
            RoomService.RoomDetailsDTO roomDetails = roomService.getRoomDetails(roomId);
            String username = roomDetails.players.stream()
                    .filter(p -> p.id.equals(playerId))
                    .findFirst()
                    .map(p -> p.username)
                    .orElse("Unknown");

            WebSocketMessage.ScoreUpdateData scoreData = new WebSocketMessage.ScoreUpdateData(playerId, username,
                    newScore, correctAnswers, totalAnswered);
            WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.SCORE_UPDATE,
                    scoreData);

            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

        } catch (Exception e) {
            sendError(roomId, "SCORE_ERROR", "Lỗi khi cập nhật điểm: " + e.getMessage());
        }
    }

    /**
     * Broadcast question start
     */
    public void broadcastQuestionStart(String roomId, int questionIndex, int totalQuestions, Object question,
            int timeLimit) {
        WebSocketMessage.QuestionStartData questionData = new WebSocketMessage.QuestionStartData(questionIndex,
                totalQuestions, question, timeLimit);
        roomStateService.setCurrentQuestion(roomId, questionData);
        WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.QUESTION_START,
                questionData);

        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }

    /**
     * Broadcast quiz end
     */
    public void broadcastQuizEnd(String roomId, Object finalResults) {
        roomStateService.clearRoomState(roomId);
        Map<String, Object> endData = Map.of(
                "roomId", roomId,
                "timestamp", System.currentTimeMillis(),
                "finalResults", finalResults);

        WebSocketMessage.Message message = new WebSocketMessage.Message(WebSocketMessage.MessageTypes.QUIZ_END,
                endData);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }
}
