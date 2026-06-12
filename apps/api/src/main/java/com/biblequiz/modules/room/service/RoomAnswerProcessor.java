package com.biblequiz.modules.room.service;

import com.biblequiz.api.websocket.WebSocketMessage;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.entity.RoomAnswer;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.entity.RoomRound;
import com.biblequiz.modules.room.repository.RoomAnswerRepository;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;
import com.biblequiz.modules.room.repository.RoomRepository;
import com.biblequiz.modules.room.repository.RoomRoundRepository;
import com.biblequiz.modules.room.service.mode.RoomModeRegistry;
import com.biblequiz.modules.room.service.mode.RoomModeStrategy;
import com.biblequiz.modules.user.entity.User;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Answer-submission pipeline extracted from
 * {@code RoomWebSocketController.handleAnswerSubmission}: anti-cheat
 * validation → server-side correctness check → scoring (via the mode
 * strategy) → RoomAnswer/RoomPlayer persistence. The controller keeps the
 * STOMP concerns (principal extraction + broadcasts) and consumes the
 * returned {@link AnswerResult}.
 *
 * <p>Frozen invariants (do not change): 1 answer/player/round; host
 * silent-reject in Quản trò mode; only ACTIVE players answer; answerIndex
 * validated against correctAnswer[0].
 */
@Service
public class RoomAnswerProcessor {

    private final RoomStateService roomStateService;
    private final RoomAnswerRepository roomAnswerRepository;
    private final RoomRoundRepository roomRoundRepository;
    private final RoomPlayerRepository roomPlayerRepository;
    private final QuestionRepository questionRepository;
    private final RoomRepository roomRepository;
    private final RoomModeRegistry modeRegistry;

    public RoomAnswerProcessor(RoomStateService roomStateService,
                               RoomAnswerRepository roomAnswerRepository,
                               RoomRoundRepository roomRoundRepository,
                               RoomPlayerRepository roomPlayerRepository,
                               QuestionRepository questionRepository,
                               RoomRepository roomRepository,
                               RoomModeRegistry modeRegistry) {
        this.roomStateService = roomStateService;
        this.roomAnswerRepository = roomAnswerRepository;
        this.roomRoundRepository = roomRoundRepository;
        this.roomPlayerRepository = roomPlayerRepository;
        this.questionRepository = questionRepository;
        this.roomRepository = roomRepository;
        this.modeRegistry = modeRegistry;
    }

    public AnswerResult process(String roomId, User user, int answerIndex, int reactionTimeMs) {
        // Lấy round hiện tại
        String roundId = roomStateService.getCurrentRoundId(roomId).orElse(null);

        // Anti-cheat: mỗi player chỉ được submit 1 lần/round
        if (roundId != null && roomAnswerRepository.existsByRoundIdAndUserId(roundId, user.getId())) {
            return AnswerResult.rejected();
        }

        // Sprint 4: in Quản trò mode the host orchestrates only — rejecting
        // their answer here keeps stray RoomAnswer rows from being written
        // under the host's userId (which would skew analytics + leak into
        // the early-end watcher's "expected answers" math).
        Room currentRoom = roomRepository.findById(roomId).orElse(null);
        if (currentRoom != null && !currentRoom.isHostPlaysGame()
                && currentRoom.getHost() != null
                && currentRoom.getHost().getId().equals(user.getId())) {
            return AnswerResult.rejected();
        }

        // Chỉ ACTIVE players mới được answer. LEFT cũng bị chặn (2026-06-12):
        // player bị grace-handler đánh dấu LEFT nhưng STOMP còn sống (tab ngủ
        // rồi tỉnh) trước đây vẫn ghi được answer → cộng correctAnswers, vốn
        // là tie-break của BR assignFinalRanks. Rejoin không vỡ: joinRoom flip
        // LEFT→ACTIVE trước khi họ có thể trả lời.
        Optional<RoomPlayer> playerOpt = roomPlayerRepository.findByRoomIdAndUserId(roomId, user.getId());
        if (playerOpt.isPresent()
                && playerOpt.get().getPlayerStatus() != RoomPlayer.PlayerStatus.ACTIVE) {
            return AnswerResult.rejected();
        }

        // Server-side answer validation
        boolean isCorrect = false;
        int pointsEarned = 0;
        int timeLimit = 30;

        Room.RoomMode mode = currentRoom != null ? currentRoom.getMode() : Room.RoomMode.SPEED_RACE;
        RoomModeStrategy strategy = modeRegistry.get(mode);

        Optional<WebSocketMessage.QuestionStartData> questionState =
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
                    pointsEarned = strategy.calculateScore(isCorrect, timeLimit, reactionTimeMs);
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
        ScoreSnapshot[] snapshot = new ScoreSnapshot[1];
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

            snapshot[0] = new ScoreSnapshot(roomPlayer.getScore(),
                    roomPlayer.getCorrectAnswers(), roomPlayer.getTotalAnswered());
        });

        // Sequential mode: hide isCorrect/points from the ANSWER_SUBMITTED
        // broadcast — chỉ reveal sau khi all-answered.
        boolean defer = strategy.defersAnswerFeedback();
        boolean broadcastIsCorrect = !defer && isCorrect;
        int broadcastPoints = defer ? 0 : finalPoints;

        // BUG FIX 2026-05-23: Map.of throws NPE nếu user.getName() null,
        // khiến ANSWER_SUBMITTED không broadcast → host UI "Tình trạng trả
        // lời" mãi 0/N. Dùng fallback rõ ràng (controller builds a
        // null-tolerant HashMap payload).
        String displayName = user.getName() != null ? user.getName()
                : playerOpt.map(RoomPlayer::getUsername).orElse("Unknown");

        return AnswerResult.accepted(displayName, broadcastIsCorrect, broadcastPoints, defer, snapshot[0]);
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

    // ── Result DTOs ──

    /** Post-save player counters for the SCORE_UPDATE broadcast. */
    public static class ScoreSnapshot {
        public final int newScore;
        public final int correctAnswers;
        public final int totalAnswered;

        public ScoreSnapshot(int newScore, int correctAnswers, int totalAnswered) {
            this.newScore = newScore;
            this.correctAnswers = correctAnswers;
            this.totalAnswered = totalAnswered;
        }
    }

    public static class AnswerResult {
        /** False = anti-cheat silent reject (no broadcast at all). */
        public final boolean accepted;
        public final String displayName;
        public final boolean broadcastIsCorrect;
        public final int broadcastPoints;
        /** True for GROUP_LIVE_SEQUENTIAL — triggers progress coordination. */
        public final boolean deferredFeedback;
        /** Null when the submitter has no RoomPlayer row (no SCORE_UPDATE). */
        public final ScoreSnapshot scoreUpdate;

        private AnswerResult(boolean accepted, String displayName, boolean broadcastIsCorrect,
                             int broadcastPoints, boolean deferredFeedback, ScoreSnapshot scoreUpdate) {
            this.accepted = accepted;
            this.displayName = displayName;
            this.broadcastIsCorrect = broadcastIsCorrect;
            this.broadcastPoints = broadcastPoints;
            this.deferredFeedback = deferredFeedback;
            this.scoreUpdate = scoreUpdate;
        }

        static AnswerResult rejected() {
            return new AnswerResult(false, null, false, 0, false, null);
        }

        static AnswerResult accepted(String displayName, boolean broadcastIsCorrect,
                                     int broadcastPoints, boolean deferredFeedback,
                                     ScoreSnapshot scoreUpdate) {
            return new AnswerResult(true, displayName, broadcastIsCorrect,
                    broadcastPoints, deferredFeedback, scoreUpdate);
        }
    }
}
