package com.biblequiz.infrastructure.security;

import com.biblequiz.modules.auth.service.JwtService;
import com.biblequiz.modules.auth.service.TokenBlacklistService;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** ADM-4 (F-api-17): banned user with a valid JWT must NOT be authenticated for REST. */
class JwtAuthenticationFilterTest {

    private final JwtService jwtService = mock(JwtService.class);
    private final UserDetailsService userDetailsService = mock(UserDetailsService.class);
    private final TokenBlacklistService blacklist = mock(TokenBlacklistService.class);
    private final JwtAuthenticationFilter filter =
            new JwtAuthenticationFilter(jwtService, userDetailsService, blacklist);

    private final HttpServletRequest req = mock(HttpServletRequest.class);
    private final HttpServletResponse res = mock(HttpServletResponse.class);
    private final FilterChain chain = mock(FilterChain.class);

    @BeforeEach
    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }

    private UserDetails principal(boolean enabled) {
        return User.builder().username("u@example.com").password("p")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                .disabled(!enabled).build();
    }

    private void commonStubs() {
        when(req.getDispatcherType()).thenReturn(DispatcherType.REQUEST);
        when(req.getRequestURI()).thenReturn("/api/me");
        when(req.getHeader("Authorization")).thenReturn("Bearer tok");
        when(jwtService.extractUsername("tok")).thenReturn("u@example.com");
        when(jwtService.extractJti("tok")).thenReturn("jti");
        when(blacklist.isBlacklisted("jti")).thenReturn(false);
    }

    @Test
    void bannedUser_isNotAuthenticated() throws Exception {
        commonStubs();
        when(userDetailsService.loadUserByUsername("u@example.com")).thenReturn(principal(false));

        filter.doFilter(req, res, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication(),
                "disabled (banned) user must not be authenticated");
        verify(chain).doFilter(req, res);
        verify(jwtService, never()).isTokenValid(anyString(), any());
    }

    @Test
    void activeUser_isAuthenticated() throws Exception {
        commonStubs();
        UserDetails enabled = principal(true);
        when(userDetailsService.loadUserByUsername("u@example.com")).thenReturn(enabled);
        when(jwtService.isTokenValid("tok", enabled)).thenReturn(true);

        filter.doFilter(req, res, chain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication(),
                "active user with valid token must be authenticated");
        verify(chain).doFilter(req, res);
    }
}
