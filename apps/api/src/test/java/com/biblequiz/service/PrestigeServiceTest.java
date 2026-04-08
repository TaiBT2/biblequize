package com.biblequiz.service;

import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.ranked.service.PrestigeService;
import com.biblequiz.modules.ranked.service.PrestigeService.PrestigeStatus;
import com.biblequiz.modules.ranked.service.UserTierService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrestigeServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserTierService userTierService;
    @Mock private UserDailyProgressRepository dailyProgressRepository;

    private PrestigeService service;

    @BeforeEach
    void setUp() {
        service = new PrestigeService(userRepository, userTierService, dailyProgressRepository);
    }

    private User createTier6User(String id, int daysAtTier6, int prestigeLevel) {
        User u = new User(id, "Test", "test@test.com", "local");
        u.setDaysAtTier6(daysAtTier6);
        u.setPrestigeLevel(prestigeLevel);
        return u;
    }

    @Test
    void canPrestige_whenTier6And30Days() {
        User user = createTier6User("u1", 30, 0);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userTierService.getTierLevel("u1")).thenReturn(6);

        PrestigeStatus status = service.getStatus("u1");

        assertTrue(status.canPrestige());
        assertEquals(0, status.prestigeLevel());
        assertEquals(30, status.daysAtTier6());
        assertEquals("Vinh Quang Tái Sinh", status.nextPrestigeName());
    }

    @Test
    void cannotPrestige_whenNotTier6() {
        User user = createTier6User("u1", 30, 0);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userTierService.getTierLevel("u1")).thenReturn(5);

        PrestigeStatus status = service.getStatus("u1");
        assertFalse(status.canPrestige());
    }

    @Test
    void cannotPrestige_whenNotEnoughDays() {
        User user = createTier6User("u1", 15, 0);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userTierService.getTierLevel("u1")).thenReturn(6);

        PrestigeStatus status = service.getStatus("u1");
        assertFalse(status.canPrestige());
    }

    @Test
    void cannotPrestige_whenMaxPrestige() {
        User user = createTier6User("u1", 30, 3);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userTierService.getTierLevel("u1")).thenReturn(6);

        PrestigeStatus status = service.getStatus("u1");
        assertFalse(status.canPrestige());
    }

    @Test
    void executePrestige_resetsProgressAndIncrements() {
        User user = createTier6User("u1", 30, 0);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userTierService.getTierLevel("u1")).thenReturn(6);
        when(dailyProgressRepository.findByUserIdOrderByDateDesc("u1")).thenReturn(List.of());

        Map<String, Object> result = service.executePrestige("u1");

        assertEquals(1, result.get("newPrestigeLevel"));
        assertEquals("prestige_1", result.get("badgeGranted"));
        assertEquals(1, user.getPrestigeLevel());
        assertEquals(0, user.getDaysAtTier6());
        assertNull(user.getTier6ReachedAt());
        verify(userRepository).save(user);
    }

    @Test
    void executePrestige_resetsAllDailyProgress() {
        User user = createTier6User("u1", 30, 0);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userTierService.getTierLevel("u1")).thenReturn(6);

        UserDailyProgress p1 = new UserDailyProgress();
        p1.setPointsCounted(500);
        UserDailyProgress p2 = new UserDailyProgress();
        p2.setPointsCounted(300);
        when(dailyProgressRepository.findByUserIdOrderByDateDesc("u1")).thenReturn(List.of(p1, p2));

        service.executePrestige("u1");

        assertEquals(0, p1.getPointsCounted());
        assertEquals(0, p2.getPointsCounted());
        verify(dailyProgressRepository).saveAll(anyList());
    }

    @Test
    void executePrestige_failsWhenNotEligible() {
        User user = createTier6User("u1", 10, 0);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userTierService.getTierLevel("u1")).thenReturn(6);

        Map<String, Object> result = service.executePrestige("u1");
        assertTrue(result.containsKey("error"));
    }

    @Test
    void prestige2_correctName() {
        User user = createTier6User("u1", 30, 1);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userTierService.getTierLevel("u1")).thenReturn(6);

        PrestigeStatus status = service.getStatus("u1");
        assertTrue(status.canPrestige());
        assertEquals("Vinh Quang Bất Diệt", status.nextPrestigeName());
    }
}
