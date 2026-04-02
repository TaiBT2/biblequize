package com.biblequiz.api;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private AdminUserController controller;

    private User testUser;
    private Authentication mockAuth;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("u1");
        testUser.setName("Test");
        testUser.setEmail("test@test.com");
        testUser.setRole("USER");
        testUser.setCurrentStreak(5);
        testUser.setLongestStreak(10);
        testUser.setIsBanned(false);

        mockAuth = mock(Authentication.class);
        lenient().when(mockAuth.getName()).thenReturn("admin@test.com");
    }

    @Test
    void listUsers_returnsPagedResults() {
        when(userRepository.findAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testUser)));
        var res = controller.listUsers(0, 20, null, null, null);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void getUser_found() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(testUser));
        var res = controller.getUser("u1");
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void getUser_notFound() {
        when(userRepository.findById("x")).thenReturn(Optional.empty());
        var res = controller.getUser("x");
        assertEquals(404, res.getStatusCode().value());
    }

    @Test
    void changeRole_success() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var res = controller.changeRole("u1", Map.of("role", "ADMIN"), mockAuth);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void changeRole_selfChange_rejected() {
        testUser.setEmail("admin@test.com"); // same as auth
        when(userRepository.findById("u1")).thenReturn(Optional.of(testUser));

        var res = controller.changeRole("u1", Map.of("role", "USER"), mockAuth);
        assertEquals(400, res.getStatusCode().value());
    }

    @Test
    void banUser_success() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var res = controller.banUser("u1", Map.of("banned", true, "reason", "Spam feedback repeatedly"), mockAuth);
        assertEquals(200, res.getStatusCode().value());
        assertTrue(testUser.getIsBanned());
    }

    @Test
    void banUser_selfBan_rejected() {
        testUser.setEmail("admin@test.com");
        when(userRepository.findById("u1")).thenReturn(Optional.of(testUser));

        var res = controller.banUser("u1", Map.of("banned", true, "reason", "Self ban attempt"), mockAuth);
        assertEquals(400, res.getStatusCode().value());
    }

    @Test
    void banUser_shortReason_rejected() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(testUser));

        var res = controller.banUser("u1", Map.of("banned", true, "reason", "short"), mockAuth);
        assertEquals(400, res.getStatusCode().value());
    }
}
