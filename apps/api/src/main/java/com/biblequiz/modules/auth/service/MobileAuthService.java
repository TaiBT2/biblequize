package com.biblequiz.modules.auth.service;

import com.biblequiz.api.dto.mobile.MobileAuthResponse;
import com.biblequiz.api.dto.mobile.MobileGoogleRequest;
import com.biblequiz.api.dto.mobile.MobileLoginRequest;
import com.biblequiz.api.dto.mobile.MobileRefreshRequest;
import com.biblequiz.modules.auth.entity.AuthIdentity;
import com.biblequiz.modules.auth.repository.AuthIdentityRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MobileAuthService {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthIdentityRepository authIdentityRepository;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleWebClientId;

    @Value("${biblequiz.auth.google.android-client-id:}")
    private String googleAndroidClientId;

    public MobileAuthResponse loginWithPassword(MobileLoginRequest request) {
        User user = authService.loginLocal(request.getEmail(), request.getPassword());
        return buildResponse(user);
    }

    public MobileAuthResponse refreshToken(MobileRefreshRequest request) {
        String token = request.getRefreshToken();

        try {
            String email = jwtService.extractUsername(token);
            if (email == null) {
                throw new BadCredentialsException("Refresh token không hợp lệ");
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BadCredentialsException("User không tồn tại"));

            if (user.getIsBanned() != null && user.getIsBanned()) {
                throw new BadCredentialsException("Tài khoản đã bị khóa");
            }

            return buildResponse(user);
        } catch (BadCredentialsException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Mobile refresh token failed: {}", e.getMessage());
            throw new BadCredentialsException("Refresh token không hợp lệ hoặc đã hết hạn");
        }
    }

    @Transactional
    public MobileAuthResponse loginWithGoogle(MobileGoogleRequest request) {
        GoogleIdToken idToken = verifyGoogleIdToken(request.getIdToken());
        if (idToken == null) {
            throw new BadCredentialsException("Google ID Token không hợp lệ");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");
        String googleId = payload.getSubject();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setId(UUID.randomUUID().toString());
            user.setName(name != null ? name : "User");
            user.setEmail(email);
            user.setAvatarUrl(picture);
            user.setProvider("google");
            user.setRole("USER");
            user = userRepository.save(user);

            AuthIdentity identity = new AuthIdentity();
            identity.setId(UUID.randomUUID().toString());
            identity.setUser(user);
            identity.setProvider("google");
            identity.setProviderUserId(googleId);
            authIdentityRepository.save(identity);

            log.info("Mobile Google login: created new user {}", email);
        } else {
            if (picture != null) user.setAvatarUrl(picture);
            if (name != null) user.setName(name);
            userRepository.save(user);
        }

        if (user.getIsBanned() != null && user.getIsBanned()) {
            throw new BadCredentialsException("Tài khoản đã bị khóa");
        }

        return buildResponse(user);
    }

    private GoogleIdToken verifyGoogleIdToken(String idTokenString) {
        try {
            List<String> audiences = new ArrayList<>();
            if (googleWebClientId != null && !googleWebClientId.isEmpty()) {
                audiences.add(googleWebClientId);
            }
            if (googleAndroidClientId != null && !googleAndroidClientId.isEmpty()) {
                audiences.add(googleAndroidClientId);
            }

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(audiences)
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                log.warn("Google ID Token verification failed");
                return null;
            }

            if (!idToken.getPayload().getEmailVerified()) {
                log.warn("Google email not verified: {}", idToken.getPayload().getEmail());
                return null;
            }

            return idToken;
        } catch (Exception e) {
            log.error("Error verifying Google ID Token", e);
            return null;
        }
    }

    private MobileAuthResponse buildResponse(User user) {
        String accessToken = authService.generateTokenForUser(user);
        String refreshToken = authService.generateRefreshTokenForUser(user);

        return MobileAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatarUrl())
                .role(user.getRole())
                .build();
    }
}
