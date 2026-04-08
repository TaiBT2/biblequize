package com.biblequiz.service;

import com.biblequiz.modules.user.entity.UserCosmetics;
import com.biblequiz.modules.user.repository.UserCosmeticsRepository;
import com.biblequiz.modules.user.service.CosmeticService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CosmeticServiceTest {

    @Mock
    private UserCosmeticsRepository repository;

    private CosmeticService service;

    @BeforeEach
    void setUp() {
        service = new CosmeticService(repository);
    }

    @Test
    void getOrCreate_createsNew_whenNotExists() {
        when(repository.findById("u1")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserCosmetics result = service.getOrCreate("u1");

        assertEquals("u1", result.getUserId());
        assertEquals("frame_tier1", result.getActiveFrame());
        assertEquals("theme_default", result.getActiveTheme());
        assertTrue(result.getUnlockedFrames().contains("frame_tier1"));
        verify(repository).save(any());
    }

    @Test
    void getOrCreate_returnsExisting() {
        UserCosmetics existing = new UserCosmetics("u1");
        existing.setActiveFrame("frame_tier3");
        when(repository.findById("u1")).thenReturn(Optional.of(existing));

        UserCosmetics result = service.getOrCreate("u1");
        assertEquals("frame_tier3", result.getActiveFrame());
        verify(repository, never()).save(any());
    }

    @Test
    void unlockForTier_addsNewFrameAndTheme() {
        UserCosmetics cosmetics = new UserCosmetics("u1");
        cosmetics.setUnlockedFrames(new ArrayList<>(List.of("frame_tier1")));
        cosmetics.setUnlockedThemes(new ArrayList<>(List.of("theme_default")));
        when(repository.findById("u1")).thenReturn(Optional.of(cosmetics));

        service.unlockForTier("u1", 2);

        assertTrue(cosmetics.getUnlockedFrames().contains("frame_tier2"));
        assertTrue(cosmetics.getUnlockedThemes().contains("theme_sky"));
        verify(repository).save(cosmetics);
    }

    @Test
    void unlockForTier_doesNotDuplicate() {
        UserCosmetics cosmetics = new UserCosmetics("u1");
        cosmetics.setUnlockedFrames(new ArrayList<>(List.of("frame_tier1", "frame_tier2")));
        cosmetics.setUnlockedThemes(new ArrayList<>(List.of("theme_default", "theme_sky")));
        when(repository.findById("u1")).thenReturn(Optional.of(cosmetics));

        service.unlockForTier("u1", 2);

        assertEquals(2, cosmetics.getUnlockedFrames().size());
        verify(repository, never()).save(any());
    }

    @Test
    void updateActive_setsFrame() {
        UserCosmetics cosmetics = new UserCosmetics("u1");
        cosmetics.setUnlockedFrames(new ArrayList<>(List.of("frame_tier1", "frame_tier2")));
        cosmetics.setUnlockedThemes(new ArrayList<>(List.of("theme_default")));
        when(repository.findById("u1")).thenReturn(Optional.of(cosmetics));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.updateActive("u1", "frame_tier2", null);

        assertEquals("frame_tier2", cosmetics.getActiveFrame());
    }

    @Test
    void updateActive_throwsForLockedFrame() {
        UserCosmetics cosmetics = new UserCosmetics("u1");
        cosmetics.setUnlockedFrames(new ArrayList<>(List.of("frame_tier1")));
        cosmetics.setUnlockedThemes(new ArrayList<>(List.of("theme_default")));
        when(repository.findById("u1")).thenReturn(Optional.of(cosmetics));

        assertThrows(IllegalArgumentException.class,
                () -> service.updateActive("u1", "frame_tier5", null));
    }

    @Test
    void getResponse_includesAllTiers() {
        UserCosmetics cosmetics = new UserCosmetics("u1");
        cosmetics.setUnlockedFrames(new ArrayList<>(List.of("frame_tier1", "frame_tier2")));
        cosmetics.setUnlockedThemes(new ArrayList<>(List.of("theme_default", "theme_sky")));
        when(repository.findById("u1")).thenReturn(Optional.of(cosmetics));

        Map<String, Object> response = service.getResponse("u1", 2);

        assertEquals("frame_tier1", response.get("activeFrame"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> frames = (List<Map<String, Object>>) response.get("frames");
        assertEquals(6, frames.size());
        assertTrue((boolean) frames.get(0).get("unlocked"));
        assertTrue((boolean) frames.get(1).get("unlocked"));
        assertFalse((boolean) frames.get(2).get("unlocked"));
    }
}
