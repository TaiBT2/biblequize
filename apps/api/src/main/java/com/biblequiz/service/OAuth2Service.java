package com.biblequiz.service;

import com.biblequiz.auth.JwtUtil;
import com.biblequiz.entity.AuthIdentity;
import com.biblequiz.entity.User;
import com.biblequiz.repository.AuthIdentityRepository;
import com.biblequiz.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class OAuth2Service extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthIdentityRepository authIdentityRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        String provider = userRequest.getClientRegistration().getRegistrationId();
        String providerUserId = oauth2User.getAttribute("sub") != null ? 
            oauth2User.getAttribute("sub") : oauth2User.getAttribute("id");
        
        // Check if user exists by OAuth identity
        AuthIdentity authIdentity = authIdentityRepository
            .findByProviderAndProviderUserId(provider, providerUserId)
            .orElse(null);

        User user;
        if (authIdentity != null) {
            user = authIdentity.getUser();
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

    private User createUserFromOAuth2User(OAuth2User oauth2User, String provider) {
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(oauth2User.getAttribute("name"));
        user.setEmail(oauth2User.getAttribute("email"));
        user.setAvatarUrl(oauth2User.getAttribute("picture"));
        user.setProvider(provider);
        user.setRole("USER");
        return user;
    }

    public String generateTokensForUser(User user) {
        String accessToken = jwtUtil.generateToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        
        // In a real implementation, you might want to store refresh tokens in database
        return accessToken;
    }
}
