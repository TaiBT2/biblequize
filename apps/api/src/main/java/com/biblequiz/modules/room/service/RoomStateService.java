package com.biblequiz.modules.room.service;

import com.biblequiz.api.websocket.WebSocketMessage;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
public class RoomStateService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "room:state:";
    private static final Duration STATE_TTL = Duration.ofHours(2);

    public RoomStateService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Save current question state for a room
     */
    @SuppressWarnings("null")
    public void setCurrentQuestion(String roomId, WebSocketMessage.QuestionStartData data) {
        String key = getQuestionKey(roomId);
        redisTemplate.opsForValue().set(key, data, STATE_TTL);
    }

    /**
     * Get current question state for a room
     */
    @SuppressWarnings("null")
    public Optional<WebSocketMessage.QuestionStartData> getCurrentQuestion(String roomId) {
        String key = getQuestionKey(roomId);
        Object data = redisTemplate.opsForValue().get(key);
        if (data instanceof WebSocketMessage.QuestionStartData) {
            return Optional.of((WebSocketMessage.QuestionStartData) data);
        }
        return Optional.empty();
    }

    /**
     * Clear all state associated with a room
     */
    @SuppressWarnings("null")
    public void clearRoomState(String roomId) {
        redisTemplate.delete(getQuestionKey(roomId));
    }

    private String getQuestionKey(String roomId) {
        return KEY_PREFIX + "current_question:" + roomId;
    }
}
