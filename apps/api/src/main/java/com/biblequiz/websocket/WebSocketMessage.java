package com.biblequiz.websocket;

import com.biblequiz.service.RoomService;

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
        public static final String QUESTION_START = "QUESTION_START";
        public static final String ANSWER_SUBMITTED = "ANSWER_SUBMITTED";
        public static final String QUESTION_END = "QUESTION_END";
        public static final String QUIZ_END = "QUIZ_END";
        
        // Scoreboard events
        public static final String SCORE_UPDATE = "SCORE_UPDATE";
        public static final String LEADERBOARD_UPDATE = "LEADERBOARD_UPDATE";
        
        // Error events
        public static final String ERROR = "ERROR";
    }
    
    /**
     * Generic message wrapper
     */
    public static class Message {
        private String type;
        private Object data;
        private String timestamp;
        
        public Message() {}
        
        public Message(String type, Object data) {
            this.type = type;
            this.data = data;
            this.timestamp = String.valueOf(System.currentTimeMillis());
        }
        
        // Getters and Setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
        
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
    
    /**
     * Player join event data
     */
    public static class PlayerJoinedData {
        public final String playerId;
        public final String username;
        public final String avatarUrl;
        public final RoomService.PlayerInfoDTO playerInfo;
        
        public PlayerJoinedData(String playerId, String username, String avatarUrl, RoomService.PlayerInfoDTO playerInfo) {
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
    public static class QuestionStartData {
        public final int questionIndex;
        public final int totalQuestions;
        public final Object question; // Question from database
        public final int timeLimit;
        
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
        
        public AnswerSubmittedData(String playerId, String username, int questionIndex, int answerIndex, long reactionTimeMs) {
            this.playerId = playerId;
            this.username = username;
            this.questionIndex = questionIndex;
            this.answerIndex = answerIndex;
            this.reactionTimeMs = reactionTimeMs;
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
