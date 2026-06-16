package com.biblequiz.infrastructure.security;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** ADM-4 (F-api-17): ban must mark the principal disabled so REST is blocked. */
class CustomUserDetailsServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final CustomUserDetailsService service = new CustomUserDetailsService(userRepository);

    private User user(boolean banned) {
        User u = new User();
        u.setEmail("u@example.com");
        u.setRole("USER");
        u.setPasswordHash("hash");
        u.setIsBanned(banned);
        return u;
    }

    @Test
    void bannedUser_isDisabled() {
        when(userRepository.findByEmail("u@example.com")).thenReturn(Optional.of(user(true)));
        UserDetails ud = service.loadUserByUsername("u@example.com");
        assertFalse(ud.isEnabled(), "banned user must be disabled");
    }

    @Test
    void activeUser_isEnabledWithRole() {
        when(userRepository.findByEmail("u@example.com")).thenReturn(Optional.of(user(false)));
        UserDetails ud = service.loadUserByUsername("u@example.com");
        assertTrue(ud.isEnabled());
        assertTrue(ud.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
    }

    @Test
    void unknownUser_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        assertThrows(UsernameNotFoundException.class,
                () -> service.loadUserByUsername("missing@example.com"));
    }
}
