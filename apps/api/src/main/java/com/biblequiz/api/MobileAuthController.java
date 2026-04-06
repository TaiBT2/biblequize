package com.biblequiz.api;

import com.biblequiz.api.dto.mobile.MobileAuthResponse;
import com.biblequiz.api.dto.mobile.MobileGoogleRequest;
import com.biblequiz.api.dto.mobile.MobileLoginRequest;
import com.biblequiz.api.dto.mobile.MobileRefreshRequest;
import com.biblequiz.modules.auth.service.MobileAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/mobile")
@RequiredArgsConstructor
@Slf4j
public class MobileAuthController {

    private final MobileAuthService mobileAuthService;

    @PostMapping("/login")
    public ResponseEntity<?> mobileLogin(@Valid @RequestBody MobileLoginRequest request) {
        try {
            MobileAuthResponse response = mobileAuthService.loginWithPassword(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "INVALID_CREDENTIALS",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> mobileRefresh(@Valid @RequestBody MobileRefreshRequest request) {
        try {
            MobileAuthResponse response = mobileAuthService.refreshToken(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "INVALID_REFRESH_TOKEN",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> mobileGoogleLogin(@Valid @RequestBody MobileGoogleRequest request) {
        try {
            MobileAuthResponse response = mobileAuthService.loginWithGoogle(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "INVALID_GOOGLE_TOKEN",
                    "message", e.getMessage()
            ));
        }
    }
}
