package com.biblequiz.modules.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.biblequiz.modules.auth.entity.AuthIdentity;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.biblequiz.modules.auth.repository.AuthIdentityRepository;

import java.util.UUID;

@Service
@Transactional
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthIdentityRepository authIdentityRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User findOrCreateUser(OAuth2User oauth2User, String provider) {
        String providerUserId = oauth2User.getName();

        // Check if auth identity exists
        return authIdentityRepository.findByProviderAndProviderUserId(provider, providerUserId)
                .map(AuthIdentity::getUser)
                .orElseGet(() -> createNewUser(oauth2User, provider, providerUserId));
    }

    private User createNewUser(OAuth2User oauth2User, String provider, String providerUserId) {
        // Extract user info from OAuth2User
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String avatarUrl = oauth2User.getAttribute("picture");

        // Create new user
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(name != null ? name : "User");
        user.setEmail(email);
        user.setAvatarUrl(avatarUrl);
        user.setProvider(provider);
        user.setRole("USER");

        user = userRepository.save(user);

        // Create auth identity
        AuthIdentity authIdentity = new AuthIdentity();
        authIdentity.setId(UUID.randomUUID().toString());
        authIdentity.setUser(user);
        authIdentity.setProvider(provider);
        authIdentity.setProviderUserId(providerUserId);

        authIdentityRepository.save(authIdentity);

        return user;
    }

    public User registerLocal(String name, String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(name);
        user.setEmail(email);
        user.setProvider("local");
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole("USER");
        return userRepository.save(user);
    }

    public User loginLocal(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không đúng"));
        if (!"local".equals(user.getProvider())) {
            throw new BadCredentialsException("Tài khoản này dùng đăng nhập mạng xã hội");
        }
        if (user.getPasswordHash() == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng");
        }
        return user;
    }

    public String generateTokenForUser(User user) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password("")
                .authorities("ROLE_" + user.getRole())
                .build();

        return jwtService.generateToken(userDetails);
    }

    public String generateRefreshTokenForUser(User user) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password("")
                .authorities("ROLE_" + user.getRole())
                .build();

        return jwtService.generateRefreshToken(userDetails);
    }
}
