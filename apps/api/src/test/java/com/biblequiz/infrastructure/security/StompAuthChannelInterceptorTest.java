package com.biblequiz.infrastructure.security;

import com.biblequiz.modules.auth.service.JwtService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

import java.security.Principal;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class StompAuthChannelInterceptorTest {

    private JwtService jwtService;
    private StompAuthChannelInterceptor interceptor;
    private MessageChannel channel;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        channel = mock(MessageChannel.class);
        interceptor = new StompAuthChannelInterceptor(jwtService);
    }

    private Message<byte[]> connectMessageWithAuth(String authHeaderValue) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        if (authHeaderValue != null) {
            accessor.addNativeHeader("Authorization", authHeaderValue);
        }
        // Keep the accessor mutable so the interceptor under test can call
        // setUser without "Already immutable". In production the broker
        // channel takes care of this for us; tests have to opt in.
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<byte[]> sendMessage() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    void connect_withValidBearerToken_setsPrincipal() {
        when(jwtService.extractUsername("good.token")).thenReturn("user@example.com");
        when(jwtService.getTokenRemainingTtl("good.token")).thenReturn(Duration.ofMinutes(5));

        Message<?> result = interceptor.preSend(
                connectMessageWithAuth("Bearer good.token"), channel);

        assertNotNull(result);
        Principal user = StompHeaderAccessor.wrap(result).getUser();
        assertNotNull(user, "Principal must be set on a valid CONNECT");
        assertEquals("user@example.com", user.getName());
    }

    @Test
    void connect_withMissingHeader_passesThroughWithoutPrincipal() {
        Message<?> result = interceptor.preSend(connectMessageWithAuth(null), channel);

        assertNotNull(result, "We never reject the frame — downstream handlers enforce auth");
        assertNull(StompHeaderAccessor.wrap(result).getUser());
        verify(jwtService, never()).extractUsername(anyString());
    }

    @Test
    void connect_withNonBearerHeader_doesNotAuthenticate() {
        Message<?> result = interceptor.preSend(
                connectMessageWithAuth("Basic Zm9vOmJhcg=="), channel);

        assertNull(StompHeaderAccessor.wrap(result).getUser());
        verify(jwtService, never()).extractUsername(anyString());
    }

    @Test
    void connect_withExpiredToken_doesNotAuthenticate() {
        when(jwtService.extractUsername("expired.token")).thenReturn("user@example.com");
        when(jwtService.getTokenRemainingTtl("expired.token")).thenReturn(Duration.ZERO);

        Message<?> result = interceptor.preSend(
                connectMessageWithAuth("Bearer expired.token"), channel);

        assertNull(StompHeaderAccessor.wrap(result).getUser());
    }

    @Test
    void connect_withMalformedToken_doesNotAuthenticate() {
        when(jwtService.extractUsername("garbage")).thenThrow(new RuntimeException("malformed"));

        Message<?> result = interceptor.preSend(
                connectMessageWithAuth("Bearer garbage"), channel);

        assertNull(StompHeaderAccessor.wrap(result).getUser());
    }

    @Test
    void sendFrame_skipsAuth_evenWithoutHeader() {
        Message<byte[]> sendMsg = sendMessage();

        Message<?> result = interceptor.preSend(sendMsg, channel);

        assertSame(sendMsg, result, "Non-CONNECT frames pass through untouched");
        verify(jwtService, never()).extractUsername(anyString());
    }
}
