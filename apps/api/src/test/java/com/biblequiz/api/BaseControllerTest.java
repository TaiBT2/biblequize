package com.biblequiz.api;

import com.biblequiz.infrastructure.security.JwtAuthenticationEntryPoint;
import com.biblequiz.infrastructure.security.JwtAuthenticationFilter;
import com.biblequiz.infrastructure.security.OAuth2FailureHandler;
import com.biblequiz.infrastructure.security.OAuth2SuccessHandler;
import com.biblequiz.infrastructure.security.RateLimitingFilter;
import com.biblequiz.modules.auth.service.JwtService;
import com.biblequiz.modules.user.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

/**
 * Base class for controller tests.
 * Uses TestSecurityConfig for proper security chain.
 * Mocks infrastructure beans that are component-scanned but not needed in tests.
 */
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
public abstract class BaseControllerTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    // Mock security infrastructure beans to prevent component-scan instantiation errors.
    @MockBean
    protected JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    protected JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    protected OAuth2SuccessHandler oAuth2SuccessHandler;

    @MockBean
    protected OAuth2FailureHandler oAuth2FailureHandler;

    @MockBean
    protected RateLimitingFilter rateLimitingFilter;

    @MockBean
    protected ClientRegistrationRepository clientRegistrationRepository;

    @MockBean
    protected JwtService jwtService;

    @MockBean
    protected UserService userService;

    /**
     * Mock RoomWebSocketController for all @WebMvcTest slices — RoomController and
     * a few service beans depend on it via @Autowired, but @WebMvcTest doesn't load
     * the websocket configuration so the bean is otherwise missing. Bridge mock here
     * so every controller test inherits it instead of duplicating @MockBean per test.
     */
    @MockBean
    protected com.biblequiz.api.websocket.RoomWebSocketController roomWebSocketController;

    @MockBean
    protected com.biblequiz.modules.room.service.RoomStateService roomStateService;

    @MockBean
    protected com.biblequiz.modules.room.service.RoomAnalyticsService roomAnalyticsService;

    @MockBean
    protected com.biblequiz.modules.room.service.HostControlService hostControlService;

    @MockBean
    protected com.biblequiz.modules.group.repository.GroupMemberRepository groupMemberRepository;
    // GameModeUnlockConfig: leave per-test (RankedControllerTest already has its own,
    // bridging here causes duplicate mock definition).

    /**
     * Configure mocked filters to pass through requests instead of swallowing them.
     */
    @BeforeEach
    void setUpFilterPassthrough() throws Exception {
        // JwtAuthenticationFilter mock must delegate to next filter
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(
                any(ServletRequest.class), any(ServletResponse.class), any(FilterChain.class));

        // RateLimitingFilter mock must delegate to next filter
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(rateLimitingFilter).doFilter(
                any(ServletRequest.class), any(ServletResponse.class), any(FilterChain.class));
    }
}
