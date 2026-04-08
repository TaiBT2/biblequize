package com.biblequiz.service;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.biblequiz.modules.user.service.ComebackService;
import com.biblequiz.modules.user.service.ComebackService.ComebackStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComebackServiceTest {

    @Mock
    private UserRepository userRepository;

    private ComebackService service;

    @BeforeEach
    void setUp() {
        service = new ComebackService(userRepository);
    }

    private User createUser(String id, LocalDate lastActive) {
        User u = new User(id, "Test", "test@test.com", "local");
        u.setLastActiveDate(lastActive);
        return u;
    }

    @Test
    void noReward_whenLessThan3Days() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        User user = createUser("u1", today.minusDays(2));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ComebackStatus status = service.getStatus("u1");
        assertEquals("NONE", status.rewardTier());
    }

    @Test
    void xpBoost_when3to6DaysAway() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        User user = createUser("u1", today.minusDays(5));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ComebackStatus status = service.getStatus("u1");
        assertEquals("XP_BOOST", status.rewardTier());
        assertEquals(5, status.daysSinceLastPlay());
        assertNotNull(status.reward());
    }

    @Test
    void doubleXp_when7to13DaysAway() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        User user = createUser("u1", today.minusDays(10));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ComebackStatus status = service.getStatus("u1");
        assertEquals("2X_XP_DAY", status.rewardTier());
    }

    @Test
    void recoveryPack_when14to29DaysAway() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        User user = createUser("u1", today.minusDays(20));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ComebackStatus status = service.getStatus("u1");
        assertEquals("RECOVERY_PACK", status.rewardTier());
    }

    @Test
    void starterPack_when30PlusDaysAway() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        User user = createUser("u1", today.minusDays(45));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ComebackStatus status = service.getStatus("u1");
        assertEquals("STARTER_PACK", status.rewardTier());
    }

    @Test
    void noReward_whenNoLastActiveDate() {
        User user = new User("u1", "Test", "test@test.com", "local");
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ComebackStatus status = service.getStatus("u1");
        assertEquals("NONE", status.rewardTier());
    }

    @Test
    void claim_updatesUser() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        User user = createUser("u1", today.minusDays(5));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        var result = service.claim("u1");

        assertEquals("XP_BOOST", result.get("bonusType"));
        assertNotNull(user.getComebackClaimedAt());
        verify(userRepository).save(user);
    }

    @Test
    void updateLastActive_setsDate() {
        User user = new User("u1", "Test", "test@test.com", "local");
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        service.updateLastActive("u1");

        assertEquals(LocalDate.now(ZoneOffset.UTC), user.getLastActiveDate());
        verify(userRepository).save(user);
    }
}
