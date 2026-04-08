package com.biblequiz.modules.user.service;

import com.biblequiz.modules.user.entity.UserCosmetics;
import com.biblequiz.modules.user.repository.UserCosmeticsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class CosmeticService {

    private static final Logger log = LoggerFactory.getLogger(CosmeticService.class);

    // Frame IDs by tier level
    private static final Map<Integer, String> TIER_FRAMES = Map.of(
            1, "frame_tier1",
            2, "frame_tier2",
            3, "frame_tier3",
            4, "frame_tier4",
            5, "frame_tier5",
            6, "frame_tier6"
    );

    // Theme IDs by tier level
    private static final Map<Integer, String> TIER_THEMES = Map.of(
            1, "theme_default",
            2, "theme_sky",
            3, "theme_lamp",
            4, "theme_ember",
            5, "theme_night",
            6, "theme_royal"
    );

    // Frame display info
    public static final Map<String, String> FRAME_NAMES = Map.of(
            "frame_tier1", "Viền Xám",
            "frame_tier2", "Xanh Nhạt",
            "frame_tier3", "Xanh Dương",
            "frame_tier4", "Tím Lửa",
            "frame_tier5", "Vàng Sao",
            "frame_tier6", "Vàng Đỏ Hoàng Gia"
    );

    public static final Map<String, String> THEME_NAMES = Map.of(
            "theme_default", "Mặc định",
            "theme_sky", "Bầu Trời",
            "theme_lamp", "Ánh Đèn",
            "theme_ember", "Tàn Lửa",
            "theme_night", "Đêm Sao",
            "theme_royal", "Hoàng Gia"
    );

    private final UserCosmeticsRepository cosmeticsRepository;

    public CosmeticService(UserCosmeticsRepository cosmeticsRepository) {
        this.cosmeticsRepository = cosmeticsRepository;
    }

    /**
     * Get or create cosmetics for a user.
     */
    @Transactional
    public UserCosmetics getOrCreate(String userId) {
        return cosmeticsRepository.findById(userId).orElseGet(() -> {
            UserCosmetics c = new UserCosmetics(userId);
            return cosmeticsRepository.save(c);
        });
    }

    /**
     * Unlock cosmetics when user reaches a new tier.
     */
    @Transactional
    public void unlockForTier(String userId, int newTierLevel) {
        UserCosmetics cosmetics = getOrCreate(userId);

        String frame = TIER_FRAMES.get(newTierLevel);
        String theme = TIER_THEMES.get(newTierLevel);

        boolean changed = false;
        if (frame != null && !cosmetics.getUnlockedFrames().contains(frame)) {
            cosmetics.getUnlockedFrames().add(frame);
            changed = true;
        }
        if (theme != null && !cosmetics.getUnlockedThemes().contains(theme)) {
            cosmetics.getUnlockedThemes().add(theme);
            changed = true;
        }

        if (changed) {
            cosmeticsRepository.save(cosmetics);
            log.info("[COSMETICS] Unlocked tier {} cosmetics for user {}: frame={}, theme={}",
                    newTierLevel, userId, frame, theme);
        }
    }

    /**
     * Update active frame and/or theme.
     */
    @Transactional
    public UserCosmetics updateActive(String userId, String activeFrame, String activeTheme) {
        UserCosmetics cosmetics = getOrCreate(userId);

        if (activeFrame != null) {
            if (!cosmetics.getUnlockedFrames().contains(activeFrame)) {
                throw new IllegalArgumentException("Frame chưa được mở khóa: " + activeFrame);
            }
            cosmetics.setActiveFrame(activeFrame);
        }

        if (activeTheme != null) {
            if (!cosmetics.getUnlockedThemes().contains(activeTheme)) {
                throw new IllegalArgumentException("Theme chưa được mở khóa: " + activeTheme);
            }
            cosmetics.setActiveTheme(activeTheme);
        }

        return cosmeticsRepository.save(cosmetics);
    }

    /**
     * Build API response with all cosmetic data.
     */
    public Map<String, Object> getResponse(String userId, int currentTierLevel) {
        UserCosmetics cosmetics = getOrCreate(userId);

        // Build frames list with locked/unlocked status
        List<Map<String, Object>> frames = new ArrayList<>();
        for (int tier = 1; tier <= 6; tier++) {
            String frameId = TIER_FRAMES.get(tier);
            frames.add(Map.of(
                    "id", frameId,
                    "name", FRAME_NAMES.getOrDefault(frameId, frameId),
                    "tier", tier,
                    "unlocked", cosmetics.getUnlockedFrames().contains(frameId),
                    "active", frameId.equals(cosmetics.getActiveFrame())
            ));
        }

        List<Map<String, Object>> themes = new ArrayList<>();
        for (int tier = 1; tier <= 6; tier++) {
            String themeId = TIER_THEMES.get(tier);
            themes.add(Map.of(
                    "id", themeId,
                    "name", THEME_NAMES.getOrDefault(themeId, themeId),
                    "tier", tier,
                    "unlocked", cosmetics.getUnlockedThemes().contains(themeId),
                    "active", themeId.equals(cosmetics.getActiveTheme())
            ));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("activeFrame", cosmetics.getActiveFrame());
        response.put("activeTheme", cosmetics.getActiveTheme());
        response.put("frames", frames);
        response.put("themes", themes);
        return response;
    }
}
