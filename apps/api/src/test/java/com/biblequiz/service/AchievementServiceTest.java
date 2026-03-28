package com.biblequiz.service;

import com.biblequiz.modules.achievement.entity.Achievement;
import com.biblequiz.modules.achievement.entity.UserAchievement;
import com.biblequiz.modules.achievement.repository.AchievementRepository;
import com.biblequiz.modules.achievement.repository.UserAchievementRepository;
import com.biblequiz.modules.achievement.service.AchievementService;
import com.biblequiz.modules.user.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.AdditionalMatchers.not;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock
    private AchievementRepository achievementRepository;

    @Mock
    private UserAchievementRepository userAchievementRepository;

    @InjectMocks
    private AchievementService achievementService;

    private User testUser;
    private Achievement persistent1000;
    private Achievement perfect20;
    private Achievement elder;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");

        persistent1000 = new Achievement();
        persistent1000.setId("ach-1");
        persistent1000.setKeyName("persistent_1000");
        persistent1000.setName("Persistent");
        persistent1000.setDescription("Answer 1000 questions");

        perfect20 = new Achievement();
        perfect20.setId("ach-2");
        perfect20.setKeyName("perfect_20");
        perfect20.setName("Perfect Streak");
        perfect20.setDescription("20 streak");

        elder = new Achievement();
        elder.setId("ach-3");
        elder.setKeyName("elder");
        elder.setName("Elder");
        elder.setDescription("8000 points");
    }

    // ── getAllWithStatus ──────────────────────────────────────────────────────

    @Test
    void getAllWithStatus_shouldReturnAllWithEarnedFlag() {
        when(achievementRepository.findAll()).thenReturn(List.of(persistent1000, perfect20));

        UserAchievement earned = new UserAchievement();
        earned.setAchievement(persistent1000);
        when(userAchievementRepository.findByUserId("user-1")).thenReturn(List.of(earned));

        List<Map<String, Object>> result = achievementService.getAllWithStatus("user-1");

        assertEquals(2, result.size());
        assertTrue((Boolean) result.stream()
                .filter(m -> "persistent_1000".equals(m.get("key")))
                .findFirst().get().get("earned"));
        assertFalse((Boolean) result.stream()
                .filter(m -> "perfect_20".equals(m.get("key")))
                .findFirst().get().get("earned"));
    }

    // ── checkAndAward ────────────────────────────────────────────────────────

    @Test
    void checkAndAward_persistent1000_shouldAwardWhen1000Questions() {
        when(userAchievementRepository.existsByUserIdAndAchievementKeyName("user-1", "persistent_1000"))
                .thenReturn(false);
        when(achievementRepository.findByKeyName("persistent_1000"))
                .thenReturn(Optional.of(persistent1000));

        // Not meeting other thresholds
        lenient().when(userAchievementRepository.existsByUserIdAndAchievementKeyName(eq("user-1"), not(eq("persistent_1000"))))
                .thenReturn(true);

        List<String> awarded = achievementService.checkAndAward(testUser, 500, 1000, 5, 3);

        assertTrue(awarded.contains("persistent_1000"));
        verify(userAchievementRepository).save(any(UserAchievement.class));
    }

    @Test
    void checkAndAward_alreadyEarned_shouldNotAwardAgain() {
        when(userAchievementRepository.existsByUserIdAndAchievementKeyName("user-1", "persistent_1000"))
                .thenReturn(true); // Already earned
        lenient().when(userAchievementRepository.existsByUserIdAndAchievementKeyName(eq("user-1"), not(eq("persistent_1000"))))
                .thenReturn(true);

        List<String> awarded = achievementService.checkAndAward(testUser, 500, 1000, 5, 3);

        assertFalse(awarded.contains("persistent_1000"));
    }

    @Test
    void checkAndAward_belowThreshold_shouldNotAward() {
        List<String> awarded = achievementService.checkAndAward(testUser, 100, 500, 5, 3);

        assertTrue(awarded.isEmpty());
        verify(userAchievementRepository, never()).save(any());
    }

    @Test
    void checkAndAward_sage_shouldAwardAt15000Points() {
        Achievement sage = new Achievement();
        sage.setId("ach-sage");
        sage.setKeyName("sage");
        sage.setName("Hiền Triết");

        when(userAchievementRepository.existsByUserIdAndAchievementKeyName("user-1", "sage"))
                .thenReturn(false);
        when(achievementRepository.findByKeyName("sage")).thenReturn(Optional.of(sage));
        lenient().when(userAchievementRepository.existsByUserIdAndAchievementKeyName(eq("user-1"), not(eq("sage"))))
                .thenReturn(true);

        List<String> awarded = achievementService.checkAndAward(testUser, 15000, 500, 5, 3);

        assertTrue(awarded.contains("sage"));
    }

    @Test
    void checkAndAward_multipleAchievements_shouldAwardAll() {
        Achievement sage = new Achievement();
        sage.setId("ach-sage");
        sage.setKeyName("sage");

        when(userAchievementRepository.existsByUserIdAndAchievementKeyName(anyString(), anyString()))
                .thenReturn(false);
        when(achievementRepository.findByKeyName("persistent_1000")).thenReturn(Optional.of(persistent1000));
        when(achievementRepository.findByKeyName("perfect_20")).thenReturn(Optional.of(perfect20));
        when(achievementRepository.findByKeyName("sage")).thenReturn(Optional.of(sage));

        List<String> awarded = achievementService.checkAndAward(testUser, 15000, 1000, 20, 3);

        assertTrue(awarded.contains("persistent_1000"));
        assertTrue(awarded.contains("perfect_20"));
        assertTrue(awarded.contains("sage"));
    }
}
