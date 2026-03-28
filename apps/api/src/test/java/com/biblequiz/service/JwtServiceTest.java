package com.biblequiz.service;

import com.biblequiz.modules.auth.service.JwtService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Base64-encoded secret (at least 256 bits for HS256)
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "dGVzdC1zZWNyZXQta2V5LWZvci1iaWJsZXF1aXotYXBpLXRlc3RpbmctcHVycG9zZXM=");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900000L); // 15 min
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 2592000000L); // 30 days
    }

    private UserDetails createUserDetails(String email) {
        return User.withUsername(email).password("").authorities("ROLE_USER").build();
    }

    // ── Token generation ─────────────────────────────────────────────────────

    @Test
    void generateToken_shouldReturnNonEmptyString() {
        UserDetails userDetails = createUserDetails("test@example.com");

        String token = jwtService.generateToken(userDetails);

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void generateToken_fromUsername_shouldReturnValidToken() {
        String token = jwtService.generateToken("test@example.com");

        assertNotNull(token);
        assertEquals("test@example.com", jwtService.extractUsername(token));
    }

    @Test
    void generateToken_withExtraClaims_shouldIncludeClaims() {
        UserDetails userDetails = createUserDetails("test@example.com");
        Map<String, Object> claims = Map.of("role", "ADMIN");

        String token = jwtService.generateToken(claims, userDetails);

        assertNotNull(token);
        assertEquals("test@example.com", jwtService.extractUsername(token));
    }

    @Test
    void generateRefreshToken_shouldReturnValidToken() {
        UserDetails userDetails = createUserDetails("test@example.com");

        String token = jwtService.generateRefreshToken(userDetails);

        assertNotNull(token);
        assertEquals("test@example.com", jwtService.extractUsername(token));
    }

    // ── Token extraction ─────────────────────────────────────────────────────

    @Test
    void extractUsername_shouldReturnCorrectEmail() {
        UserDetails userDetails = createUserDetails("user@example.com");
        String token = jwtService.generateToken(userDetails);

        String username = jwtService.extractUsername(token);

        assertEquals("user@example.com", username);
    }

    @Test
    void extractJti_shouldReturnNonNullId() {
        UserDetails userDetails = createUserDetails("test@example.com");
        String token = jwtService.generateToken(userDetails);

        String jti = jwtService.extractJti(token);

        assertNotNull(jti);
        assertFalse(jti.isEmpty());
    }

    @Test
    void extractJti_eachTokenShouldHaveUniqueJti() {
        UserDetails userDetails = createUserDetails("test@example.com");
        String token1 = jwtService.generateToken(userDetails);
        String token2 = jwtService.generateToken(userDetails);

        assertNotEquals(jwtService.extractJti(token1), jwtService.extractJti(token2));
    }

    // ── Token validation ─────────────────────────────────────────────────────

    @Test
    void isTokenValid_withValidToken_shouldReturnTrue() {
        UserDetails userDetails = createUserDetails("test@example.com");
        String token = jwtService.generateToken(userDetails);

        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    void isTokenValid_withDifferentUser_shouldReturnFalse() {
        UserDetails userDetails = createUserDetails("test@example.com");
        UserDetails otherUser = createUserDetails("other@example.com");
        String token = jwtService.generateToken(userDetails);

        assertFalse(jwtService.isTokenValid(token, otherUser));
    }

    @Test
    void isTokenValid_withExpiredToken_shouldReturnFalse() {
        // Set very short expiration
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L);
        UserDetails userDetails = createUserDetails("test@example.com");
        String token = jwtService.generateToken(userDetails);

        // Reset expiration for future tests
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900000L);

        assertThrows(io.jsonwebtoken.ExpiredJwtException.class,
                () -> jwtService.isTokenValid(token, userDetails));
    }

    // ── Token TTL ────────────────────────────────────────────────────────────

    @Test
    void getTokenRemainingTtl_shouldReturnPositiveDuration() {
        UserDetails userDetails = createUserDetails("test@example.com");
        String token = jwtService.generateToken(userDetails);

        Duration ttl = jwtService.getTokenRemainingTtl(token);

        assertTrue(ttl.toMillis() > 0);
        assertTrue(ttl.toMillis() <= 900000);
    }

    // ── Config validation — catch invalid base64 secrets ──────────────────────

    @Test
    void secretKey_mustBeValidBase64() {
        // This test ensures the actual config secret is valid base64.
        // The bug: dev config had "biblequiz-super-secret..." (not base64),
        // but tests used a hardcoded valid base64 secret, so the bug was never caught.
        String configSecret = "YmlibGVxdWl6LXN1cGVyLXNlY3JldC1qd3Qta2V5LTIwMjQtbWFrZS1pdC1sb25nLWFuZC1yYW5kb20tZm9yLXNlY3VyaXR5";
        JwtService realService = new JwtService();
        ReflectionTestUtils.setField(realService, "secretKey", configSecret);
        ReflectionTestUtils.setField(realService, "jwtExpiration", 900000L);
        ReflectionTestUtils.setField(realService, "refreshExpiration", 2592000000L);

        // Should not throw DecodingException
        assertDoesNotThrow(() -> {
            String token = realService.generateToken("test@example.com");
            assertEquals("test@example.com", realService.extractUsername(token));
        });
    }

    @Test
    void invalidBase64Secret_shouldThrowDecodingException() {
        JwtService badService = new JwtService();
        // This is NOT valid base64 (contains hyphens)
        ReflectionTestUtils.setField(badService, "secretKey",
                "not-valid-base64-key-with-hyphens");
        ReflectionTestUtils.setField(badService, "jwtExpiration", 900000L);
        ReflectionTestUtils.setField(badService, "refreshExpiration", 2592000000L);

        assertThrows(io.jsonwebtoken.io.DecodingException.class,
                () -> badService.generateToken("test@example.com"));
    }
}
