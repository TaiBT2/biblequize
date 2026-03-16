package com.biblequiz.api.websocket;

import com.biblequiz.modules.quiz.entity.Answer;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.service.RoomService;

import java.util.Map;

public class WebSocketMessage {

    /**
     * Message types for different events
     */
    public static class MessageTypes {
        // Room events
        public static final String PLAYER_JOINED = "PLAYER_JOINED";
        public static final String PLAYER_LEFT = "PLAYER_LEFT";
        public static final String PLAYER_READY = "PLAYER_READY";
        public static final String PLAYER_UNREADY = "PLAYER_UNREADY";
        public static final String ROOM_STARTING = "ROOM_STARTING";
        public static final String ROOM_ENDED = "ROOM_ENDED";

        // Quiz events
        public static final String GAME_STARTING = "GAME_STARTING";
        public static final String QUESTION_START = "QUESTION_START";
        public static final String ANSWER_SUBMITTED = "ANSWER_SUBMITTED";
        public static final String ROUND_END = "ROUND_END";
        public static final String QUESTION_END = "QUESTION_END";
        public static final String QUIZ_END = "QUIZ_END";

        // Battle Royale events
        public static final String PLAYER_ELIMINATED = "PLAYER_ELIMINATED";
        public static final String BATTLE_ROYALE_UPDATE = "BATTLE_ROYALE_UPDATE";

        // Scoreboard events
        public static final String SCORE_UPDATE = "SCORE_UPDATE";
        public static final String LEADERBOARD_UPDATE = "LEADERBOARD_UPDATE";

        // Team vs Team events
        public static final String TEAM_ASSIGNMENT = "TEAM_ASSIGNMENT";
        public static final String TEAM_SCORE_UPDATE = "TEAM_SCORE_UPDATE";
        public static final String PERFECT_ROUND = "PERFECT_ROUND";

        // Sudden Death events
        public static final String MATCH_START = "MATCH_START";
        public static final String MATCH_END = "MATCH_END";
        public static final String SD_QUEUE_UPDATE = "SD_QUEUE_UPDATE";

        // Error events
        public static final String ERROR = "ERROR";
    }

    /**
     * Generic message wrapper
     */
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class Message {
        private String type;
        private Object data;
        private String timestamp;

        public Message() {
        }

        public Message(String type, Object data) {
            this.type = type;
            this.data = data;
            this.timestamp = String.valueOf(System.currentTimeMillis());
        }

        // Getters and Setters
        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Object getData() {
            return data;
        }

        public void setData(Object data) {
            this.data = data;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }

    /**
     * Player join event data
     */
    public static class PlayerJoinedData {
        public final String playerId;
        public final String username;
        public final String avatarUrl;
        public final RoomService.PlayerInfoDTO playerInfo;

        public PlayerJoinedData(String playerId, String username, String avatarUrl,
                RoomService.PlayerInfoDTO playerInfo) {
            this.playerId = playerId;
            this.username = username;
            this.avatarUrl = avatarUrl;
            this.playerInfo = playerInfo;
        }
    }

    /**
     * Player ready event data
     */
    public static class PlayerReadyData {
        public final String playerId;
        public final String username;
        public final Boolean isReady;

        public PlayerReadyData(String playerId, String username, Boolean isReady) {
            this.playerId = playerId;
            this.username = username;
            this.isReady = isReady;
        }
    }

    /**
     * Question event data
     */
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class QuestionStartData {
        public int questionIndex;
        public int totalQuestions;
        public Object question; // Question from database
        public int timeLimit;

        public QuestionStartData() {
        }

        public QuestionStartData(int questionIndex, int totalQuestions, Object question, int timeLimit) {
            this.questionIndex = questionIndex;
            this.totalQuestions = totalQuestions;
            this.question = question;
            this.timeLimit = timeLimit;
        }
    }

    /**
     * Answer submission data
     */
    public static class AnswerSubmittedData {
        public final String playerId;
        public final String username;
        public final int questionIndex;
        public final int answerIndex;
        public final long reactionTimeMs;
        public final boolean isCorrect;

        public AnswerSubmittedData(String playerId, String username, int questionIndex, int answerIndex,
                long reactionTimeMs, boolean isCorrect) {
            this.playerId = playerId;
            this.username = username;
            this.questionIndex = questionIndex;
            this.answerIndex = answerIndex;
            this.reactionTimeMs = reactionTimeMs;
            this.isCorrect = isCorrect;
        }
    }

    /**
     * Score update data
     */
    public static class ScoreUpdateData {
        public final String playerId;
        public final String username;
        public final int newScore;
        public final int correctAnswers;
        public final int totalAnswered;

        public ScoreUpdateData(String playerId, String username, int newScore, int correctAnswers, int totalAnswered) {
            this.playerId = playerId;
            this.username = username;
            this.newScore = newScore;
            this.correctAnswers = correctAnswers;
            this.totalAnswered = totalAnswered;
        }
    }

    /**
     * Round end event data (broadcast đáp án đúng + leaderboard sau mỗi câu)
     */
    public static class RoundEndData {
        public final int correctIndex;
        public final Object leaderboard;

        public RoundEndData(int correctIndex, Object leaderboard) {
            this.correctIndex = correctIndex;
            this.leaderboard = leaderboard;
        }
    }

    /**
     * Player eliminated event (Battle Royale)
     */
    public static class PlayerEliminatedData {
        public final String userId;
        public final String username;
        public final int rank;
        public final int activeRemaining;

        public PlayerEliminatedData(String userId, String username, int rank, int activeRemaining) {
            this.userId = userId;
            this.username = username;
            this.rank = rank;
            this.activeRemaining = activeRemaining;
        }
    }

    /**
     * Battle Royale player count update
     */
    public static class BattleRoyaleUpdateData {
        public final int activeCount;
        public final int totalCount;

        public BattleRoyaleUpdateData(int activeCount, int totalCount) {
            this.activeCount = activeCount;
            this.totalCount = totalCount;
        }
    }

    /**
     * Team assignment broadcast (Team vs Team)
     */
    public static class TeamAssignmentData {
        public final java.util.List<TeamPlayerInfo> players;

        public TeamAssignmentData(java.util.List<TeamPlayerInfo> players) {
            this.players = players;
        }

        public static class TeamPlayerInfo {
            public final String userId;
            public final String username;
            public final String team;

            public TeamPlayerInfo(String userId, String username, String team) {
                this.userId = userId;
                this.username = username;
                this.team = team;
            }
        }
    }

    /**
     * Team score update (Team vs Team)
     */
    public static class TeamScoreUpdateData {
        public final int scoreA;
        public final int scoreB;

        public TeamScoreUpdateData(int scoreA, int scoreB) {
            this.scoreA = scoreA;
            this.scoreB = scoreB;
        }
    }

    /**
     * Perfect Round bonus (Team vs Team)
     */
    public static class PerfectRoundData {
        public final boolean teamAPerfect;
        public final boolean teamBPerfect;

        public PerfectRoundData(boolean teamAPerfect, boolean teamBPerfect) {
            this.teamAPerfect = teamAPerfect;
            this.teamBPerfect = teamBPerfect;
        }
    }

    /**
     * Match start (Sudden Death 1v1)
     */
    public static class MatchStartData {
        public final String championId;
        public final String championName;
        public final int championStreak;
        public final String challengerId;
        public final String challengerName;
        public final int queueRemaining;

        public MatchStartData(String championId, String championName, int championStreak,
                              String challengerId, String challengerName, int queueRemaining) {
            this.championId = championId;
            this.championName = championName;
            this.championStreak = championStreak;
            this.challengerId = challengerId;
            this.challengerName = challengerName;
            this.queueRemaining = queueRemaining;
        }
    }

    /**
     * Match end (Sudden Death 1v1)
     */
    public static class MatchEndData {
        public final String winnerId;
        public final String winnerName;
        public final int winnerNewStreak;
        public final String loserId;
        public final String loserName;

        public MatchEndData(String winnerId, String winnerName, int winnerNewStreak,
                            String loserId, String loserName) {
            this.winnerId = winnerId;
            this.winnerName = winnerName;
            this.winnerNewStreak = winnerNewStreak;
            this.loserId = loserId;
            this.loserName = loserName;
        }
    }

    /**
     * Error message data
     */
    public static class ErrorData {
        public final String error;
        public final String message;

        public ErrorData(String error, String message) {
            this.error = error;
            this.message = message;
        }
    }
}
