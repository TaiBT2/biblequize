package com.biblequiz.modules.room.service;

import com.biblequiz.api.websocket.WebSocketMessage;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class RoomStateService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "room:state:";
    private static final String KEY_ROUND_PREFIX = "room:state:current_round:";
    private static final String KEY_SD_QUEUE_PREFIX = "room:state:sd_queue:";
    private static final String KEY_SD_CHAMPION_PREFIX = "room:state:sd_champion:";
    private static final String KEY_SD_CHALLENGER_PREFIX = "room:state:sd_challenger:";
    private static final Duration STATE_TTL = Duration.ofHours(2);

    public RoomStateService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // ── Question state ──

    @SuppressWarnings("null")
    public void setCurrentQuestion(String roomId, WebSocketMessage.QuestionStartData data) {
        redisTemplate.opsForValue().set(getQuestionKey(roomId), data, STATE_TTL);
    }

    @SuppressWarnings("null")
    public Optional<WebSocketMessage.QuestionStartData> getCurrentQuestion(String roomId) {
        Object data = redisTemplate.opsForValue().get(getQuestionKey(roomId));
        if (data instanceof WebSocketMessage.QuestionStartData q) {
            return Optional.of(q);
        }
        return Optional.empty();
    }

    // ── Round state ──

    @SuppressWarnings("null")
    public void setCurrentRoundId(String roomId, String roundId) {
        redisTemplate.opsForValue().set(KEY_ROUND_PREFIX + roomId, roundId, STATE_TTL);
    }

    @SuppressWarnings("null")
    public Optional<String> getCurrentRoundId(String roomId) {
        Object val = redisTemplate.opsForValue().get(KEY_ROUND_PREFIX + roomId);
        return val != null ? Optional.of(val.toString()) : Optional.empty();
    }

    // ── Sudden Death: queue ──

    @SuppressWarnings("null")
    public void setSdQueue(String roomId, List<String> queue) {
        String value = String.join(",", queue);
        redisTemplate.opsForValue().set(KEY_SD_QUEUE_PREFIX + roomId, value, STATE_TTL);
    }

    @SuppressWarnings("null")
    public List<String> getSdQueue(String roomId) {
        Object val = redisTemplate.opsForValue().get(KEY_SD_QUEUE_PREFIX + roomId);
        if (val == null) return new ArrayList<>();
        String s = val.toString();
        if (s.isBlank()) return new ArrayList<>();
        return new ArrayList<>(Arrays.asList(s.split(",")));
    }

    // ── Sudden Death: champion / challenger ──

    @SuppressWarnings("null")
    public void setSdChampion(String roomId, String userId) {
        redisTemplate.opsForValue().set(KEY_SD_CHAMPION_PREFIX + roomId, userId, STATE_TTL);
    }

    @SuppressWarnings("null")
    public String getSdChampion(String roomId) {
        Object val = redisTemplate.opsForValue().get(KEY_SD_CHAMPION_PREFIX + roomId);
        return val != null ? val.toString() : null;
    }

    @SuppressWarnings("null")
    public void setSdChallenger(String roomId, String userId) {
        redisTemplate.opsForValue().set(KEY_SD_CHALLENGER_PREFIX + roomId, userId, STATE_TTL);
    }

    @SuppressWarnings("null")
    public String getSdChallenger(String roomId) {
        Object val = redisTemplate.opsForValue().get(KEY_SD_CHALLENGER_PREFIX + roomId);
        return val != null ? val.toString() : null;
    }

    @SuppressWarnings("null")
    public void clearSdChallenger(String roomId) {
        redisTemplate.delete(KEY_SD_CHALLENGER_PREFIX + roomId);
    }

    // ── Clear all room state ──

    @SuppressWarnings("null")
    public void clearRoomState(String roomId) {
        redisTemplate.delete(getQuestionKey(roomId));
        redisTemplate.delete(KEY_ROUND_PREFIX + roomId);
        redisTemplate.delete(KEY_SD_QUEUE_PREFIX + roomId);
        redisTemplate.delete(KEY_SD_CHAMPION_PREFIX + roomId);
        redisTemplate.delete(KEY_SD_CHALLENGER_PREFIX + roomId);
    }

    private String getQuestionKey(String roomId) {
        return KEY_PREFIX + "current_question:" + roomId;
    }
}
