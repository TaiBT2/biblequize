package com.biblequiz.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * FIX-011: WebSocket rate limiter using Redis sliding window counters.
 *
 * Rate limits per user per event type:
 * | Event   | Limit        | Action when exceeded       |
 * |---------|--------------|----------------------------|
 * | answer  | 1 per 2s     | Ignore duplicate           |
 * | chat    | 10 per 60s   | Throttle, send error event |
 * | join    | 5 per 60s    | Reject                     |
 * | ready   | 3 per 60s    | Ignore duplicate           |
 * | total   | 60 per 60s   | Disconnect + ban 5 min     |
 */
@Component
public class WebSocketRateLimitInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketRateLimitInterceptor.class);

    private static final String REDIS_PREFIX = "ws:rl:";

    // Per-event limits
    static final int ANSWER_LIMIT = 1;
    static final int ANSWER_WINDOW_SEC = 2;

    static final int CHAT_LIMIT = 10;
    static final int CHAT_WINDOW_SEC = 60;

    static final int JOIN_LIMIT = 5;
    static final int JOIN_WINDOW_SEC = 60;

    static final int READY_LIMIT = 3;
    static final int READY_WINDOW_SEC = 60;

    static final int TOTAL_LIMIT = 60;
    static final int TOTAL_WINDOW_SEC = 60;

    static final int BAN_DURATION_SEC = 300; // 5 minutes

    private final RedisTemplate<String, Object> redisTemplate;

    public WebSocketRateLimitInterceptor(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // Only rate-limit SEND commands (client → server messages)
        if (accessor.getCommand() != StompCommand.SEND) {
            return message;
        }

        String user = resolveUser(accessor);
        if (user == null) {
            return message;
        }

        String destination = accessor.getDestination();
        if (destination == null) {
            return message;
        }

        // Check ban first
        if (isBanned(user)) {
            log.warn("[WS_RATE_LIMIT] Banned user {} attempted to send to {}", user, destination);
            return null; // drop message
        }

        // Check total rate limit
        if (!checkLimit(user, "total", TOTAL_LIMIT, TOTAL_WINDOW_SEC)) {
            log.warn("[WS_RATE_LIMIT] Total rate limit exceeded for user {}. Banning for {} sec", user, BAN_DURATION_SEC);
            banUser(user);
            return null; // drop message
        }

        // Check per-event rate limit based on destination
        String eventType = extractEventType(destination);
        if (eventType != null && !checkEventLimit(user, eventType)) {
            log.debug("[WS_RATE_LIMIT] {} rate limit exceeded for user {}", eventType, user);
            return null; // drop message
        }

        return message;
    }

    /**
     * Extract event type from STOMP destination.
     * e.g. "/app/room/abc123/answer" → "answer"
     */
    String extractEventType(String destination) {
        if (destination == null) return null;
        // Pattern: /app/room/{roomId}/{event}
        String[] parts = destination.split("/");
        if (parts.length >= 4) {
            return parts[parts.length - 1]; // last segment
        }
        return null;
    }

    private boolean checkEventLimit(String user, String eventType) {
        return switch (eventType) {
            case "answer" -> checkLimit(user, "answer", ANSWER_LIMIT, ANSWER_WINDOW_SEC);
            case "chat" -> checkLimit(user, "chat", CHAT_LIMIT, CHAT_WINDOW_SEC);
            case "join" -> checkLimit(user, "join", JOIN_LIMIT, JOIN_WINDOW_SEC);
            case "ready" -> checkLimit(user, "ready", READY_LIMIT, READY_WINDOW_SEC);
            default -> true; // unknown events pass through
        };
    }

    /**
     * Redis sliding window counter: increment key, check against limit.
     * Key format: ws:rl:{user}:{eventType}
     * TTL = windowSec
     */
    boolean checkLimit(String user, String eventType, int limit, int windowSec) {
        String key = REDIS_PREFIX + user + ":" + eventType;
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                // First request in this window — set expiry
                redisTemplate.expire(key, windowSec, TimeUnit.SECONDS);
            }
            return count != null && count <= limit;
        } catch (Exception e) {
            // Redis unavailable — fail open (allow the message)
            log.warn("[WS_RATE_LIMIT] Redis error, failing open: {}", e.getMessage());
            return true;
        }
    }

    private void banUser(String user) {
        String key = REDIS_PREFIX + user + ":banned";
        try {
            redisTemplate.opsForValue().set(key, "1", BAN_DURATION_SEC, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("[WS_RATE_LIMIT] Failed to ban user {}: {}", user, e.getMessage());
        }
    }

    boolean isBanned(String user) {
        String key = REDIS_PREFIX + user + ":banned";
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            return false; // fail open
        }
    }

    private String resolveUser(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return accessor.getUser().getName();
        }
        String sessionId = accessor.getSessionId();
        return sessionId != null ? "session:" + sessionId : null;
    }
}
