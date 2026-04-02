package com.biblequiz.service;

import com.biblequiz.infrastructure.security.WebSocketRateLimitInterceptor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

import java.security.Principal;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebSocketRateLimitInterceptorTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOps;

    @Mock
    private MessageChannel channel;

    private WebSocketRateLimitInterceptor interceptor;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
        lenient().when(redisTemplate.hasKey(anyString())).thenReturn(false); // not banned
        interceptor = new WebSocketRateLimitInterceptor(redisTemplate);
    }

    private Message<?> createSendMessage(String destination, String username) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setDestination(destination);
        accessor.setUser(new SimplePrincipal(username));
        accessor.setSessionId("session-1");
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    // ── answer: 1 per 2s ────────────────────────────────────────────────────

    @Test
    void answer_firstWithin2s_allowed() {
        when(valueOps.increment("ws:rl:user1:answer")).thenReturn(1L);
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(1L);

        Message<?> msg = createSendMessage("/app/room/r1/answer", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNotNull(result, "First answer should be allowed");
    }

    @Test
    void answer_secondWithin2s_blocked() {
        // answer counter returns 2 (second in window)
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(2L);
        when(valueOps.increment("ws:rl:user1:answer")).thenReturn(2L);

        Message<?> msg = createSendMessage("/app/room/r1/answer", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNull(result, "Second answer within 2s should be blocked");
    }

    // ── chat: 10 per 60s ────────────────────────────────────────────────────

    @Test
    void chat_10thMessage_allowed() {
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(10L);
        when(valueOps.increment("ws:rl:user1:chat")).thenReturn(10L);

        Message<?> msg = createSendMessage("/app/room/r1/chat", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNotNull(result, "10th chat message should be allowed");
    }

    @Test
    void chat_11thMessage_blocked() {
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(11L);
        when(valueOps.increment("ws:rl:user1:chat")).thenReturn(11L);

        Message<?> msg = createSendMessage("/app/room/r1/chat", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNull(result, "11th chat message should be blocked");
    }

    // ── total: 60 per 60s → ban ─────────────────────────────────────────────

    @Test
    void total_61stEvent_blockedAndBanned() {
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(61L);

        Message<?> msg = createSendMessage("/app/room/r1/chat", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNull(result, "61st event should be blocked");
        // Verify ban was set in Redis
        verify(valueOps).set(eq("ws:rl:user1:banned"), eq("1"),
                eq(300L), eq(TimeUnit.SECONDS));
    }

    @Test
    void bannedUser_allMessagesBlocked() {
        when(redisTemplate.hasKey("ws:rl:user1:banned")).thenReturn(true);

        Message<?> msg = createSendMessage("/app/room/r1/answer", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNull(result, "Banned user messages should be dropped");
        // Should not even check rate limits
        verify(valueOps, never()).increment(anyString());
    }

    // ── different users → independent limits ────────────────────────────────

    @Test
    void differentUsers_independentLimits() {
        // user1 answer blocked (count=2)
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(2L);
        when(valueOps.increment("ws:rl:user1:answer")).thenReturn(2L);

        // user2 answer allowed (count=1)
        when(valueOps.increment("ws:rl:user2:total")).thenReturn(1L);
        when(valueOps.increment("ws:rl:user2:answer")).thenReturn(1L);

        Message<?> msg1 = createSendMessage("/app/room/r1/answer", "user1");
        Message<?> msg2 = createSendMessage("/app/room/r1/answer", "user2");

        assertNull(interceptor.preSend(msg1, channel), "user1 should be blocked");
        assertNotNull(interceptor.preSend(msg2, channel), "user2 should be allowed");
    }

    // ── non-SEND commands pass through ──────────────────────────────────────

    @Test
    void subscribeCommand_passesThrough() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/room/r1");
        accessor.setSessionId("session-1");
        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(msg, channel);

        assertNotNull(result, "SUBSCRIBE should pass through");
        verify(valueOps, never()).increment(anyString());
    }

    // ── join: 5 per 60s ─────────────────────────────────────────────────────

    @Test
    void join_6thAttempt_blocked() {
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(6L);
        when(valueOps.increment("ws:rl:user1:join")).thenReturn(6L);

        Message<?> msg = createSendMessage("/app/room/r1/join", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNull(result, "6th join in 60s should be blocked");
    }

    // ── ready: 3 per 60s ────────────────────────────────────────────────────

    @Test
    void ready_4thAttempt_blocked() {
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(4L);
        when(valueOps.increment("ws:rl:user1:ready")).thenReturn(4L);

        Message<?> msg = createSendMessage("/app/room/r1/ready", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNull(result, "4th ready in 60s should be blocked");
    }

    // ── extractEventType (tested indirectly via preSend) ───────────────────

    @Test
    void differentEventTypes_useCorrectLimits() {
        // "start" is unknown event → passes through (no per-event limit, only total)
        when(valueOps.increment("ws:rl:user1:total")).thenReturn(1L);

        Message<?> msg = createSendMessage("/app/room/r1/start", "user1");
        Message<?> result = interceptor.preSend(msg, channel);

        assertNotNull(result, "Unknown event type should pass through");
        // Only total counter should be incremented, no event-specific counter
        verify(valueOps).increment("ws:rl:user1:total");
        verify(valueOps, never()).increment("ws:rl:user1:start");
    }

    // ── Redis failure → fail open ───────────────────────────────────────────

    @Test
    void redisFailure_failsOpen() {
        when(redisTemplate.hasKey(anyString())).thenThrow(new RuntimeException("Redis down"));

        Message<?> msg = createSendMessage("/app/room/r1/answer", "user1");
        // Should not throw, should allow message
        Message<?> result = interceptor.preSend(msg, channel);
        assertNotNull(result, "Should fail open when Redis is down");
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private static class SimplePrincipal implements Principal {
        private final String name;
        SimplePrincipal(String name) { this.name = name; }
        @Override public String getName() { return name; }
    }
}
