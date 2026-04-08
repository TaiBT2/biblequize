package com.biblequiz.modules.ranked.service;

import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class PrestigeService {

    private static final Logger log = LoggerFactory.getLogger(PrestigeService.class);
    private static final int DAYS_REQUIRED = 30;
    private static final int MAX_PRESTIGE = 3;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<Integer, String> PRESTIGE_NAMES = Map.of(
            1, "Vinh Quang Tái Sinh",
            2, "Vinh Quang Bất Diệt",
            3, "Vinh Quang Đời Đời"
    );

    private static final Map<Integer, String> PRESTIGE_BADGES = Map.of(
            1, "prestige_1",
            2, "prestige_2",
            3, "prestige_3"
    );

    private final UserRepository userRepository;
    private final UserTierService userTierService;
    private final UserDailyProgressRepository dailyProgressRepository;

    public PrestigeService(UserRepository userRepository,
                           UserTierService userTierService,
                           UserDailyProgressRepository dailyProgressRepository) {
        this.userRepository = userRepository;
        this.userTierService = userTierService;
        this.dailyProgressRepository = dailyProgressRepository;
    }

    public record PrestigeStatus(
            boolean canPrestige,
            int prestigeLevel,
            int daysAtTier6,
            int daysRequired,
            String nextPrestigeName
    ) {}

    /**
     * Check if user can prestige.
     */
    public PrestigeStatus getStatus(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return new PrestigeStatus(false, 0, 0, DAYS_REQUIRED, null);
        }

        int tierLevel = userTierService.getTierLevel(userId);
        int prestigeLevel = user.getPrestigeLevel() != null ? user.getPrestigeLevel() : 0;
        int daysAtTier6 = user.getDaysAtTier6() != null ? user.getDaysAtTier6() : 0;

        boolean canPrestige = tierLevel == 6
                && daysAtTier6 >= DAYS_REQUIRED
                && prestigeLevel < MAX_PRESTIGE;

        String nextName = prestigeLevel < MAX_PRESTIGE
                ? PRESTIGE_NAMES.get(prestigeLevel + 1)
                : null;

        return new PrestigeStatus(canPrestige, prestigeLevel, daysAtTier6, DAYS_REQUIRED, nextName);
    }

    /**
     * Execute prestige: reset XP, keep cosmetics, grant badge.
     */
    @Transactional
    public Map<String, Object> executePrestige(String userId) {
        PrestigeStatus status = getStatus(userId);

        if (!status.canPrestige()) {
            return Map.of("error", "Chưa đủ điều kiện prestige");
        }

        User user = userRepository.findById(userId).orElseThrow();
        int newPrestigeLevel = status.prestigeLevel() + 1;

        // Record prestige timestamp
        List<String> prestigeHistory = parsePrestigeHistory(user.getPrestigeAt());
        prestigeHistory.add(LocalDateTime.now(ZoneOffset.UTC).toString());

        // Update user
        user.setPrestigeLevel(newPrestigeLevel);
        user.setPrestigeAt(toJson(prestigeHistory));
        user.setDaysAtTier6(0);
        user.setTier6ReachedAt(null);

        // Reset daily progress points (this effectively resets totalPoints since it's aggregated)
        List<UserDailyProgress> allProgress = dailyProgressRepository.findByUserIdOrderByDateDesc(userId);
        for (UserDailyProgress p : allProgress) {
            p.setPointsCounted(0);
        }
        dailyProgressRepository.saveAll(allProgress);

        userRepository.save(user);

        String badgeName = PRESTIGE_NAMES.get(newPrestigeLevel);
        log.info("[PRESTIGE] User {} executed prestige to level {} ({})", userId, newPrestigeLevel, badgeName);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("newPrestigeLevel", newPrestigeLevel);
        result.put("badgeGranted", PRESTIGE_BADGES.get(newPrestigeLevel));
        result.put("badgeName", badgeName);
        result.put("message", "Chúc mừng! Bạn đã đạt " + badgeName + "!");
        return result;
    }

    private List<String> parsePrestigeHistory(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }
}
