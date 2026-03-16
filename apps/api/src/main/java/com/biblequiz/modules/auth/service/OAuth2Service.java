package com.biblequiz.modules.auth.service;

import com.biblequiz.modules.auth.entity.AuthIdentity;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.biblequiz.modules.auth.repository.AuthIdentityRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OAuth2Service extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthIdentityRepository authIdentityRepository;

    @Autowired
    private JwtService jwtService;

    @Value("${app.admin-emails:}")
    private String adminEmailsConfig;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        String providerUserId = oauth2User.getAttribute("sub") != null ? oauth2User.getAttribute("sub")
                : oauth2User.getAttribute("id");

        // Check if user exists by OAuth identity
        AuthIdentity authIdentity = authIdentityRepository
                .findByProviderAndProviderUserId(provider, providerUserId)
                .orElse(null);

        User user;
        if (authIdentity != null) {
            user = authIdentity.getUser();
            // Promote to ADMIN on login if email is in admin list but not yet promoted
            if (!"ADMIN".equals(user.getRole()) && isAdminEmail(user.getEmail())) {
                user.setRole("ADMIN");
                userRepository.save(user);
            }
        } else {
            // Create new user
            user = createUserFromOAuth2User(oauth2User, provider);
            user = userRepository.save(user);

            // Create auth identity
            authIdentity = new AuthIdentity();
            authIdentity.setId(UUID.randomUUID().toString());
            authIdentity.setUser(user);
            authIdentity.setProvider(provider);
            authIdentity.setProviderUserId(providerUserId);
            authIdentityRepository.save(authIdentity);
        }

        return oauth2User;
    }

    private boolean isAdminEmail(String email) {
        if (email == null || adminEmailsConfig == null || adminEmailsConfig.isBlank()) return false;
        Set<String> adminEmails = Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        return adminEmails.contains(email.trim().toLowerCase());
    }

    private User createUserFromOAuth2User(OAuth2User oauth2User, String provider) {
        String email = oauth2User.getAttribute("email");
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(oauth2User.getAttribute("name"));
        user.setEmail(email);
        user.setAvatarUrl(oauth2User.getAttribute("picture"));
        user.setProvider(provider);
        user.setRole(isAdminEmail(email) ? "ADMIN" : "USER");
        return user;
    }

    public String generateTokensForUser(User user) {
        String accessToken = jwtService.generateToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // In a real implementation, you might want to store refresh tokens in database
        return accessToken;
    }
}
