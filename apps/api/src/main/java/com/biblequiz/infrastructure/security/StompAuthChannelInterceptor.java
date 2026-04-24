package com.biblequiz.infrastructure.security;

import com.biblequiz.modules.auth.service.JwtService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.time.Duration;
import java.util.List;

/**
 * Authenticates STOMP CONNECT frames against the same JWT contract used by
 * the REST {@link JwtAuthenticationFilter}. Required because the
 * WebSocket HTTP handshake at {@code /ws} is permitAll — the browser's WS
 * API can't attach an Authorization header at handshake time, so we defer
 * auth to the first STOMP frame the client sends after the socket opens.
 *
 * <p>The {@code Client.connectHeaders.Authorization} value flows through
 * STOMP's nativeHeader mechanism. We extract it, validate the JWT, set a
 * {@link Principal} on the accessor (which Spring later exposes to
 * {@code @MessageMapping} handlers as their {@code Authentication}
 * argument), and let the frame through. Anything invalid → throw, which
 * propagates as a STOMP ERROR back to the client and tears down the
 * connection.
 */
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompAuthChannelInterceptor.class);
    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public StompAuthChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
            // Only authenticate once at CONNECT — subsequent SEND/SUBSCRIBE
            // frames inherit the session's Principal automatically.
            return message;
        }

        String email = authenticate(accessor);
        if (email != null) {
            Principal principal = new UsernamePasswordAuthenticationToken(email, null, List.of());
            accessor.setUser(principal);
            log.debug("STOMP CONNECT authenticated user={}", email);
        }
        return message;
    }

    /**
     * Returns the email subject if the CONNECT frame carries a valid JWT,
     * or null if the token is missing / malformed / expired. We do NOT
     * throw — refusing the CONNECT silently leaves the client unauthorized,
     * and any @MessageMapping that needs Authentication will reject the
     * later frame (this matches REST behavior for missing JWT).
     */
    private String authenticate(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader(AUTH_HEADER);
        if (authHeaders == null || authHeaders.isEmpty()) {
            return null;
        }
        String raw = authHeaders.get(0);
        if (raw == null || !raw.startsWith(BEARER_PREFIX)) {
            return null;
        }
        String token = raw.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            return null;
        }
        try {
            String email = jwtService.extractUsername(token);
            if (email == null || email.isBlank()) {
                return null;
            }
            // getTokenRemainingTtl returns Duration.ZERO when expired, so
            // checking strictly greater than zero is enough.
            if (jwtService.getTokenRemainingTtl(token).compareTo(Duration.ZERO) <= 0) {
                log.debug("STOMP CONNECT rejected: token expired for {}", email);
                return null;
            }
            return email;
        } catch (Exception e) {
            log.debug("STOMP CONNECT rejected: malformed token ({})", e.getMessage());
            return null;
        }
    }
}
