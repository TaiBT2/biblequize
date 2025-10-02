package com.biblequiz.controller;

import com.biblequiz.entity.User;
import com.biblequiz.service.AuthService;
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
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    @GetMapping("/debug-oauth2")
    public ResponseEntity<?> debugOAuth2() {
        try {
            ClientRegistration google = clientRegistrationRepository.findByRegistrationId("google");
            if (google == null) {
                return ResponseEntity.ok(Map.of(
                    "status", "ERROR",
                    "message", "Google OAuth2 registration NOT found",
                    "availableRegistrations", "none"
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "status", "OK",
                    "message", "Google OAuth2 registration found",
                    "clientId", google.getClientId(),
                    "redirectUri", google.getRedirectUri(),
                    "authorizationUri", google.getProviderDetails().getAuthorizationUri()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "status", "ERROR",
                "message", "Exception: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/oauth/success")
    public ResponseEntity<Map<String, Object>> oauthSuccess(@AuthenticationPrincipal OAuth2User oauth2User) {
        if (oauth2User == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "code", "OAUTH_ERROR",
                "message", "OAuth authentication failed"
            ));
        }

        // Determine provider from the request or user attributes
        String provider = "google"; // This should be determined from the OAuth2 flow
        User user = authService.findOrCreateUser(oauth2User, provider);
        
        String accessToken = authService.generateTokenForUser(user);
        String refreshToken = authService.generateRefreshTokenForUser(user);

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);
        response.put("user", Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "avatarUrl", user.getAvatarUrl(),
            "role", user.getRole()
        ));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "code", "INVALID_REFRESH_TOKEN",
                "message", "Refresh token is required"
            ));
        }

        // TODO: Implement refresh token validation and new token generation
        // For now, return a placeholder response
        return ResponseEntity.ok(Map.of(
            "accessToken", "new_access_token",
            "refreshToken", "new_refresh_token"
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        // TODO: Implement token blacklisting or invalidation
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
