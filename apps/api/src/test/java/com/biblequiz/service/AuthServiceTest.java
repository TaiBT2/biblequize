package com.biblequiz.service;

import com.biblequiz.modules.auth.entity.AuthIdentity;
import com.biblequiz.modules.auth.repository.AuthIdentityRepository;
import com.biblequiz.modules.auth.service.AuthService;
import com.biblequiz.modules.auth.service.JwtService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthIdentityRepository authIdentityRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole("USER");
        testUser.setProvider("local");
        testUser.setPasswordHash("encoded-password");
    }

    // ── findOrCreateUser ─────────────────────────────────────────────────────

    @Test
    void findOrCreateUser_existingIdentity_shouldReturnExistingUser() {
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(oauth2User.getName()).thenReturn("google-id-123");

        AuthIdentity identity = new AuthIdentity();
        identity.setUser(testUser);

        when(authIdentityRepository.findByProviderAndProviderUserId("google", "google-id-123"))
                .thenReturn(Optional.of(identity));

        User result = authService.findOrCreateUser(oauth2User, "google");

        assertEquals("user-1", result.getId());
        verify(userRepository, never()).save(any());
    }

    @Test
    void findOrCreateUser_newUser_shouldCreateUserAndIdentity() {
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(oauth2User.getName()).thenReturn("google-id-new");
        when(oauth2User.getAttribute("email")).thenReturn("new@example.com");
        when(oauth2User.getAttribute("name")).thenReturn("New User");
        when(oauth2User.getAttribute("picture")).thenReturn("https://avatar.url");

        when(authIdentityRepository.findByProviderAndProviderUserId("google", "google-id-new"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = authService.findOrCreateUser(oauth2User, "google");

        assertEquals("new@example.com", result.getEmail());
        assertEquals("New User", result.getName());
        assertEquals("USER", result.getRole());
        verify(userRepository).save(any(User.class));
        verify(authIdentityRepository).save(any(AuthIdentity.class));
    }

    // ── registerLocal ────────────────────────────────────────────────────────

    @Test
    void registerLocal_withNewEmail_shouldCreateUser() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = authService.registerLocal("New User", "new@example.com", "password123");

        assertEquals("New User", result.getName());
        assertEquals("new@example.com", result.getEmail());
        assertEquals("local", result.getProvider());
        assertEquals("USER", result.getRole());
        assertNotNull(result.getPasswordHash());
        verify(passwordEncoder).encode("password123");
    }

    @Test
    void registerLocal_withExistingEmail_shouldThrowException() {
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> authService.registerLocal("User", "existing@example.com", "password"));

        verify(userRepository, never()).save(any());
    }

    // ── loginLocal ───────────────────────────────────────────────────────────

    @Test
    void loginLocal_withValidCredentials_shouldReturnUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);

        User result = authService.loginLocal("test@example.com", "password123");

        assertEquals("user-1", result.getId());
    }

    @Test
    void loginLocal_withWrongPassword_shouldThrowBadCredentials() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrong-pass", "encoded-password")).thenReturn(false);

        assertThrows(BadCredentialsException.class,
                () -> authService.loginLocal("test@example.com", "wrong-pass"));
    }

    @Test
    void loginLocal_withNonexistentEmail_shouldThrowBadCredentials() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class,
                () -> authService.loginLocal("unknown@example.com", "password"));
    }

    @Test
    void loginLocal_withOAuth2Account_shouldThrowBadCredentials() {
        testUser.setProvider("google");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        assertThrows(BadCredentialsException.class,
                () -> authService.loginLocal("test@example.com", "password"));
    }

    // ── generateTokenForUser ─────────────────────────────────────────────────

    @Test
    void generateTokenForUser_shouldCallJwtService() {
        when(jwtService.generateToken(any(org.springframework.security.core.userdetails.UserDetails.class)))
                .thenReturn("jwt-token-123");

        String token = authService.generateTokenForUser(testUser);

        assertEquals("jwt-token-123", token);
        verify(jwtService).generateToken(any(org.springframework.security.core.userdetails.UserDetails.class));
    }

    @Test
    void generateRefreshTokenForUser_shouldCallJwtService() {
        when(jwtService.generateRefreshToken(any(org.springframework.security.core.userdetails.UserDetails.class)))
                .thenReturn("refresh-token-123");

        String token = authService.generateRefreshTokenForUser(testUser);

        assertEquals("refresh-token-123", token);
    }
}
