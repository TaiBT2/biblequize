
package com.biblequiz.controller;

import com.biblequiz.service.AuthCodeService;
import com.biblequiz.service.AuthService;
import com.biblequiz.service.JwtService;
import com.biblequiz.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;
    @Autowired
    private AuthCodeService authCodeService;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    /**
     * FIX #1 - Exchange endpoint.
     *
     * After the OAuth2 redirect, the frontend calls this endpoint with the
     * one-time code to retrieve actual JWT tokens. Tokens are returned as
     * JSON (over HTTPS) — never in the URL query string.
     */
    @PostMapping("/exchange")
    public ResponseEntity<?> exchangeCode(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "MISSING_CODE",
                    "message", "code is required"));
        }

        Map<String, Object> payload = authCodeService.consumeCode(code);
        if (payload == null) {
            logger.warn("[AUTH] Exchange attempt with invalid/expired code");
            return ResponseEntity.status(401).body(Map.of(
                    "error", "INVALID_CODE",
                    "message", "Code is invalid or has expired. Please log in again."));
        }

        logger.info("[AUTH] Code exchanged successfully");
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/oauth/success")
    public ResponseEntity<Map<String, Object>> oauthSuccess(@AuthenticationPrincipal OAuth2User oauth2User) {
        if (oauth2User == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "OAUTH_ERROR",
                    "message", "OAuth authentication failed"));
        }

        String provider = "google";
        User user = authService.findOrCreateUser(oauth2User, provider);

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", authService.generateTokenForUser(user));
        response.put("refreshToken", authService.generateRefreshTokenForUser(user));
        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "avatarUrl", user.getAvatarUrl(),
                "role", user.getRole()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REFRESH_TOKEN",
                    "message", "Refresh token is required"));
        }
        // TODO: Implement full refresh token rotation
        return ResponseEntity.ok(Map.of(
                "accessToken", "new_access_token",
                "refreshToken", "new_refresh_token"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        // TODO: Implement token blacklisting
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
