package com.biblequiz.infrastructure;


import com.biblequiz.infrastructure.security.StompAuthChannelInterceptor;
import com.biblequiz.infrastructure.security.WebSocketRateLimitInterceptor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Autowired
    private WebSocketRateLimitInterceptor rateLimitInterceptor;

    @Autowired
    private StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker for destinations prefixed with "/topic"
        config.enableSimpleBroker("/topic", "/queue");
        
        // Set application destination prefix for messages bound for @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
        
        // Set prefix for user-specific destinations 
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Order matters: stompAuthChannelInterceptor MUST run first so it
        // can set the Principal on CONNECT before any downstream
        // interceptor (or @MessageMapping) inspects authentication.
        registration.interceptors(stompAuthChannelInterceptor, rateLimitInterceptor);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoints. Two registrations:
        //   1. /ws — native WebSocket (no SockJS). Used by @stomp/stompjs
        //      Client with `brokerURL`, which is what useStomp.ts wires up.
        //   2. /ws-sockjs — SockJS fallback for environments where native WS
        //      is blocked (corporate proxies, polyfilled clients).
        // Originally only the SockJS variant existed at /ws, which silently
        // refused native WS handshakes from the FE.
        String[] origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);

        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins);

        registry.addEndpoint("/ws-sockjs")
                .setAllowedOrigins(origins)
                .withSockJS();
    }
}
