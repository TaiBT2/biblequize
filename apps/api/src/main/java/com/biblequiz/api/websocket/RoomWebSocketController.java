package com.biblequiz.api.websocket;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.room.entity.RoomAnswer;
import com.biblequiz.modules.room.entity.RoomRound;
import com.biblequiz.modules.room.repository.RoomAnswerRepository;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;
import com.biblequiz.modules.room.repository.RoomRoundRepository;
import com.biblequiz.modules.room.service.RoomService;
import com.biblequiz.modules.room.service.RoomStateService;
import com.biblequiz.modules.room.service.SpeedRaceScoringService;
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
import java.util.UUID;

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
    private RoomAnswerRepository roomAnswerRepository;

    @Autowired
    private RoomRoundRepository roomRoundRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private SpeedRaceScoringService speedRaceScoringService;

    /**
     * Handle player joining room
     */
    @MessageMapping("/room/{roomId}/join")
    public void handlePlayerJoin(@DestinationVariable String roomId, @Payload Map<String, Object> payload,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();

            RoomService.RoomDetailsDTO roomDetails = roomService.getRoomDetails(roomId);

            WebSocketMessage.PlayerJoinedData playerData = new WebSocketMessage.PlayerJoinedData(
                    user.getId(),
                    user.getName(),
                    user.getAvatarUrl(),
                    roomDetails.players.stream()
                            .filter(p -> p.userId.equals(user.getId()))
                            .findFirst()
                            .orElse(null));

            WebSocketMessage.Message message = new WebSocketMessage.Message(
                    WebSocketMessage.MessageTypes.PLAYER_JOINED, playerData);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

            // Re-sync câu hỏi hiện tại nếu game đang chạy
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

            roomService.leaveRoom(roomId, user.getId());

            Map<String, Object> leaveData = Map.of(
                    "playerId", user.getId(),
                    "username", user.getName());

            WebSocketMessage.Message message = new WebSocketMessage.Message(
                    WebSocketMessage.MessageTypes.PLAYER_LEFT, leaveData);
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

            roomService.togglePlayerReady(roomId, user.getId());

            RoomService.RoomDetailsDTO roomDetails = roomService.getRoomDetails(roomId);
            RoomService.PlayerInfoDTO player = roomDetails.players.stream()
                    .filter(p -> p.userId.equals(user.getId()))
                    .findFirst()
                    .orElseThrow();

            WebSocketMessage.PlayerReadyData readyData = new WebSocketMessage.PlayerReadyData(
                    user.getId(), user.getName(), player.isReady);
            WebSocketMessage.Message message = new WebSocketMessage.Message(
                    player.isReady ? WebSocketMessage.MessageTypes.PLAYER_READY
                            : WebSocketMessage.MessageTypes.PLAYER_UNREADY,
                    readyData);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

        } catch (Exception e) {
            sendError(roomId, "READY_ERROR", "Lỗi khi thay đổi trạng thái sẵn sàng: " + e.getMessage());
        }
    }

    /**
     * Handle starting quiz (broadcast only — actual start is done via REST /api/rooms/{id}/start)
     */
    @MessageMapping("/room/{roomId}/start")
    public void handleStartQuiz(@DestinationVariable String roomId, @Payload Map<String, Object> payload,
            Authentication authentication) {
        Map<String, Object> startData = Map.of(
                "roomId", roomId,
                "timestamp", System.currentTimeMillis());
        WebSocketMessage.Message message = new WebSocketMessage.Message(
                WebSocketMessage.MessageTypes.ROOM_STARTING, startData);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }

    /**
     * Handle submitting answer — Speed Race scoring với anti-cheat
     */
    @MessageMapping("/room/{roomId}/answer")
    public void handleAnswerSubmission(@DestinationVariable String roomId, @Payload Map<String, Object> payload,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();

            int questionIndex = ((Number) payload.get("questionIndex")).intValue();
            int answerIndex = ((Number) payload.get("answerIndex")).intValue();
            int reactionTimeMs = ((Number) payload.get("reactionTimeMs")).intValue();

            // Lấy round hiện tại
            String roundId = roomStateService.getCurrentRoundId(roomId).orElse(null);

            // Anti-cheat: mỗi player chỉ được submit 1 lần/round
            if (roundId != null && roomAnswerRepository.existsByRoundIdAndUserId(roundId, user.getId())) {
                return;
            }

            // Battle Royale: chỉ ACTIVE players mới được answer
            var playerOpt = roomPlayerRepository.findByRoomIdAndUserId(roomId, user.getId());
            if (playerOpt.isPresent()) {
                var playerStatus = playerOpt.get().getPlayerStatus();
                if (playerStatus == com.biblequiz.modules.room.entity.RoomPlayer.PlayerStatus.ELIMINATED
                        || playerStatus == com.biblequiz.modules.room.entity.RoomPlayer.PlayerStatus.SPECTATOR) {
                    return;
                }
            }

            // Server-side answer validation
            boolean isCorrect = false;
            int pointsEarned = 0;
            int timeLimit = 30;

            java.util.Optional<WebSocketMessage.QuestionStartData> questionState =
                    roomStateService.getCurrentQuestion(roomId);
            if (questionState.isPresent()) {
                WebSocketMessage.QuestionStartData state = questionState.get();
                timeLimit = state.timeLimit;
                String questionId = extractQuestionId(state.question);
                if (questionId != null) {
                    Question question = questionRepository.findById(questionId).orElse(null);
                    if (question != null && question.getCorrectAnswer() != null
                            && !question.getCorrectAnswer().isEmpty()) {
                        isCorrect = (answerIndex == question.getCorrectAnswer().get(0));
                        // Speed Race scoring
                        pointsEarned = speedRaceScoringService.calculateScore(isCorrect, timeLimit, reactionTimeMs);
                    }
                }
            }

            // Lưu RoomAnswer entity
            if (roundId != null) {
                final int pts = pointsEarned;
                RoomRound round = roomRoundRepository.findById(roundId).orElse(null);
                if (round != null) {
                    RoomAnswer answer = new RoomAnswer(
                            UUID.randomUUID().toString(), round, user.getId(),
                            answerIndex, isCorrect, reactionTimeMs, pts);
                    roomAnswerRepository.save(answer);
                }
            }

            // Update RoomPlayer score
            final boolean answerIsCorrect = isCorrect;
            final int finalPoints = pointsEarned;
            roomPlayerRepository.findByRoomIdAndUserId(roomId, user.getId()).ifPresent(roomPlayer -> {
                // Cập nhật điểm theo Speed Race formula
                roomPlayer.setScore(roomPlayer.getScore() + finalPoints);
                roomPlayer.setTotalAnswered(roomPlayer.getTotalAnswered() + 1);
                if (answerIsCorrect) {
                    roomPlayer.setCorrectAnswers(roomPlayer.getCorrectAnswers() + 1);
                }
                // Cập nhật average reaction time
                int total = roomPlayer.getTotalAnswered();
                double newAvg = (roomPlayer.getAverageReactionTime() * (total - 1) + reactionTimeMs) / total;
                roomPlayer.setAverageReactionTime(newAvg);
                roomPlayerRepository.save(roomPlayer);

                broadcastScoreUpdate(roomId, user.getId(), roomPlayer.getScore(),
                        roomPlayer.getCorrectAnswers(), roomPlayer.getTotalAnswered());
            });

            // Broadcast answer submitted với pointsEarned
            Map<String, Object> answerData = Map.of(
                    "playerId", user.getId(),
                    "username", user.getName(),
                    "questionIndex", questionIndex,
                    "answerIndex", answerIndex,
                    "reactionTimeMs", reactionTimeMs,
                    "isCorrect", isCorrect,
                    "pointsEarned", finalPoints);
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

    private void sendError(String roomId, String errorType, String message) {
        WebSocketMessage.ErrorData errorData = new WebSocketMessage.ErrorData(errorType, message);
        WebSocketMessage.Message errorMessage = new WebSocketMessage.Message(
                WebSocketMessage.MessageTypes.ERROR, errorData);
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
     * Broadcast ROUND_END với correctIndex và leaderboard (sau khi timer hết)
     */
    public void broadcastRoundEnd(String roomId, int correctIndex) {
        try {
            List<RoomService.LeaderboardEntryDTO> leaderboard = roomService.getRoomLeaderboard(roomId);
            WebSocketMessage.RoundEndData roundEndData = new WebSocketMessage.RoundEndData(correctIndex, leaderboard);
            WebSocketMessage.Message message = new WebSocketMessage.Message(
                    WebSocketMessage.MessageTypes.ROUND_END, roundEndData);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
        } catch (Exception e) {
            sendError(roomId, "ROUND_END_ERROR", "Lỗi khi kết thúc câu: " + e.getMessage());
        }
    }

    /**
     * Broadcast score update for a specific player
     */
    public void broadcastScoreUpdate(String roomId, String playerId, int newScore, int correctAnswers,
            int totalAnswered) {
        try {
            RoomService.RoomDetailsDTO roomDetails = roomService.getRoomDetails(roomId);
            String username = roomDetails.players.stream()
                    .filter(p -> p.userId.equals(playerId))
                    .findFirst()
                    .map(p -> p.username)
                    .orElse("Unknown");

            WebSocketMessage.ScoreUpdateData scoreData = new WebSocketMessage.ScoreUpdateData(
                    playerId, username, newScore, correctAnswers, totalAnswered);
            WebSocketMessage.Message message = new WebSocketMessage.Message(
                    WebSocketMessage.MessageTypes.SCORE_UPDATE, scoreData);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
        } catch (Exception e) {
            sendError(roomId, "SCORE_ERROR", "Lỗi khi cập nhật điểm: " + e.getMessage());
        }
    }

    /**
     * Broadcast question start
     */
    public void broadcastQuestionStart(String roomId, int questionIndex, int totalQuestions,
            Object question, int timeLimit) {
        WebSocketMessage.QuestionStartData questionData = new WebSocketMessage.QuestionStartData(
                questionIndex, totalQuestions, question, timeLimit);
        roomStateService.setCurrentQuestion(roomId, questionData);
        WebSocketMessage.Message message = new WebSocketMessage.Message(
                WebSocketMessage.MessageTypes.QUESTION_START, questionData);
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
        WebSocketMessage.Message message = new WebSocketMessage.Message(
                WebSocketMessage.MessageTypes.QUIZ_END, endData);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }

    /**
     * Broadcast player eliminated (Battle Royale)
     */
    public void broadcastPlayerEliminated(String roomId, String userId, String username, int rank, int activeRemaining) {
        WebSocketMessage.PlayerEliminatedData data =
                new WebSocketMessage.PlayerEliminatedData(userId, username, rank, activeRemaining);
        WebSocketMessage.Message msg = new WebSocketMessage.Message(
                WebSocketMessage.MessageTypes.PLAYER_ELIMINATED, data);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, msg);
    }

    /**
     * Broadcast active player count update (Battle Royale)
     */
    public void broadcastBattleRoyaleUpdate(String roomId, int activeCount, int totalCount) {
        WebSocketMessage.BattleRoyaleUpdateData data =
                new WebSocketMessage.BattleRoyaleUpdateData(activeCount, totalCount);
        WebSocketMessage.Message msg = new WebSocketMessage.Message(
                WebSocketMessage.MessageTypes.BATTLE_ROYALE_UPDATE, data);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, msg);
    }

    /**
     * Broadcast team assignment (Team vs Team)
     */
    public void broadcastTeamAssignment(String roomId, java.util.List<WebSocketMessage.TeamAssignmentData.TeamPlayerInfo> players) {
        WebSocketMessage.TeamAssignmentData data = new WebSocketMessage.TeamAssignmentData(players);
        sendToRoom(roomId, new WebSocketMessage.Message(WebSocketMessage.MessageTypes.TEAM_ASSIGNMENT, data));
    }

    /**
     * Broadcast team score update (Team vs Team)
     */
    public void broadcastTeamScoreUpdate(String roomId, int scoreA, int scoreB) {
        WebSocketMessage.TeamScoreUpdateData data = new WebSocketMessage.TeamScoreUpdateData(scoreA, scoreB);
        sendToRoom(roomId, new WebSocketMessage.Message(WebSocketMessage.MessageTypes.TEAM_SCORE_UPDATE, data));
    }

    /**
     * Broadcast perfect round (Team vs Team)
     */
    public void broadcastPerfectRound(String roomId, boolean teamAPerfect, boolean teamBPerfect) {
        WebSocketMessage.PerfectRoundData data = new WebSocketMessage.PerfectRoundData(teamAPerfect, teamBPerfect);
        sendToRoom(roomId, new WebSocketMessage.Message(WebSocketMessage.MessageTypes.PERFECT_ROUND, data));
    }

    /**
     * Broadcast match start (Sudden Death)
     */
    public void broadcastMatchStart(String roomId, String championId, String championName, int championStreak,
                                    String challengerId, String challengerName, int queueRemaining) {
        WebSocketMessage.MatchStartData data = new WebSocketMessage.MatchStartData(
                championId, championName, championStreak, challengerId, challengerName, queueRemaining);
        sendToRoom(roomId, new WebSocketMessage.Message(WebSocketMessage.MessageTypes.MATCH_START, data));
    }

    /**
     * Broadcast match end (Sudden Death)
     */
    public void broadcastMatchEnd(String roomId, String winnerId, String winnerName, int winnerStreak,
                                  String loserId, String loserName) {
        WebSocketMessage.MatchEndData data = new WebSocketMessage.MatchEndData(
                winnerId, winnerName, winnerStreak, loserId, loserName);
        sendToRoom(roomId, new WebSocketMessage.Message(WebSocketMessage.MessageTypes.MATCH_END, data));
    }

    /**
     * Handle real-time reaction (social fun).
     * Rate limited: max 3 reactions per 10 seconds per user (handled by WebSocket rate limiter).
     */
    @MessageMapping("/room/{roomId}/reaction")
    public void handleReaction(@DestinationVariable String roomId,
                                @Payload WebSocketMessage.ReactionData reaction,
                                Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElseThrow();
            reaction.setSenderId(user.getId());
            reaction.setSenderName(user.getName());

            sendToRoom(roomId, new WebSocketMessage.Message(
                    WebSocketMessage.MessageTypes.REACTION, reaction));
        } catch (Exception e) {
            // Silently ignore reaction errors
        }
    }

    /**
     * Send a generic message to a room topic
     */
    public void sendToRoom(String roomId, WebSocketMessage.Message message) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }
}
