package com.biblequiz.api;

import com.biblequiz.infrastructure.feature.FeatureFlagService;
import com.biblequiz.modules.coverage.entity.UserSeasonCoverage;
import com.biblequiz.modules.coverage.entity.WeeklyPairing;
import com.biblequiz.modules.coverage.repository.WeeklyPairingRepository;
import com.biblequiz.modules.coverage.service.LiturgicalCoverageService;
import com.biblequiz.modules.coverage.service.LiturgicalCoverageService.UnlockException;
import com.biblequiz.modules.ranked.service.UserTierService;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.service.LiturgicalSeasonService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Liturgical Coverage read + transition endpoints (§7.8.1, §7.8.3).
 * Behind {@link FeatureFlagService} gate — returns 404 if user not in rollout.
 */
@RestController
@RequestMapping("/api")
public class CoverageController {

    private final LiturgicalCoverageService coverageService;
    private final LiturgicalSeasonService seasonService;
    private final WeeklyPairingRepository pairingRepository;
    private final UserRepository userRepository;
    private final UserTierService userTierService;
    private final FeatureFlagService featureFlags;
    private final com.biblequiz.modules.coverage.service.BadgeAwardService badgeAwardService;

    public CoverageController(LiturgicalCoverageService coverageService,
                              LiturgicalSeasonService seasonService,
                              WeeklyPairingRepository pairingRepository,
                              UserRepository userRepository,
                              UserTierService userTierService,
                              FeatureFlagService featureFlags,
                              com.biblequiz.modules.coverage.service.BadgeAwardService badgeAwardService) {
        this.coverageService = coverageService;
        this.seasonService = seasonService;
        this.pairingRepository = pairingRepository;
        this.userRepository = userRepository;
        this.userTierService = userTierService;
        this.featureFlags = featureFlags;
        this.badgeAwardService = badgeAwardService;
    }

    /** §7.8.1 — GET /api/me/coverage-status */
    @GetMapping("/me/coverage-status")
    public ResponseEntity<?> getCoverageStatus(Authentication authentication) {
        String userId = resolveUserId(authentication);
        if (userId == null) return ResponseEntity.status(401).build();
        if (!featureFlags.isLiturgicalCoverageEnabled(userId)) {
            return ResponseEntity.status(404).body(Map.of("error", "FEATURE_NOT_ENABLED"));
        }

        Season season = seasonService.getCurrentSeason()
                .orElseThrow(() -> new IllegalStateException("No active season"));
        int tier = userTierService.getTierLevel(userId);
        UserSeasonCoverage coverage = coverageService.getOrCreateCoverage(userId, season.getId(), tier);

        int currentWeek = coverage.getCurrentWeek();
        List<String> weekBooks = pairingRepository
                .findBySeasonIdAndWeekNumber(season.getId(), currentWeek)
                .map(WeeklyPairing::getBookCodes)
                .orElse(List.of());
        String phase = pairingRepository
                .findBySeasonIdAndWeekNumber(season.getId(), currentWeek)
                .map(p -> p.getPhase().name())
                .orElse("UNKNOWN");

        List<Map<String, Object>> bookStatus = new ArrayList<>(weekBooks.size());
        boolean allCovered = !weekBooks.isEmpty();
        for (String book : weekBooks) {
            int answered = coverage.getBookCoverage().getOrDefault(book, 0);
            boolean covered = answered >= LiturgicalCoverageService.COVERAGE_THRESHOLD;
            if (!covered) allCovered = false;
            bookStatus.add(Map.of(
                    "code", book,
                    "covered", covered,
                    "answeredCount", answered
            ));
        }

        int totalCovered = coverageService.countCovered(coverage);
        String badgePreview = badgePreview(totalCovered);

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        long daysRemaining = Math.max(0, ChronoUnit.DAYS.between(today, season.getEndDate()));

        // §7.1.8 — surface an unshown season badge for the BadgeAwardModal.
        // HashMap (not Map.of) so unshownBadge can be an explicit null.
        Map<String, Object> resp = new HashMap<>();
        resp.put("season", Map.of(
                "id", season.getId(),
                "name", season.getName(),
                "startDate", season.getStartDate().toString(),
                "endDate", season.getEndDate().toString(),
                "daysRemaining", daysRemaining
        ));
        resp.put("currentWeek", Map.of(
                "weekNumber", currentWeek,
                "phase", phase,
                "books", bookStatus,
                "completed", allCovered,
                "canUnlockNext", allCovered && currentWeek < LiturgicalCoverageService.LAST_WEEK
        ));
        resp.put("seasonProgress", Map.of(
                "totalCovered", totalCovered,
                "weeksCompleted", coverage.getWeeksCompleted(),
                "currentBadgePreview", badgePreview
        ));
        resp.put("unshownBadge", badgeAwardService.findUnshownBadge(userId)
                .map(b -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", b.getId());
                    m.put("badgeTier", b.getBadgeTier());
                    m.put("seasonId", b.getSeasonId());
                    m.put("booksCovered", b.getBooksCovered());
                    m.put("totalQuestions", b.getTotalQuestions());
                    m.put("accuracy", b.getAccuracy());
                    m.put("daysActive", b.getDaysActive());
                    return (Object) m;
                })
                .orElse(null));
        return ResponseEntity.ok(resp);
    }

    /** §7.1.8 — POST /api/me/badges/{badgeId}/mark-shown — flag BadgeAwardModal as displayed. */
    @PostMapping("/me/badges/{badgeId}/mark-shown")
    public ResponseEntity<?> markBadgeShown(@PathVariable String badgeId,
                                            Authentication authentication) {
        String userId = resolveUserId(authentication);
        if (userId == null) return ResponseEntity.status(401).build();
        try {
            badgeAwardService.markAsShown(badgeId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", "NOT_BADGE_OWNER"));
        }
    }

    /** §7.8.3 — POST /api/ranked/coverage/unlock-next-week */
    @PostMapping("/ranked/coverage/unlock-next-week")
    public ResponseEntity<?> unlockNextWeek(Authentication authentication) {
        String userId = resolveUserId(authentication);
        if (userId == null) return ResponseEntity.status(401).build();
        if (!featureFlags.isLiturgicalCoverageEnabled(userId)) {
            return ResponseEntity.status(404).body(Map.of("error", "FEATURE_NOT_ENABLED"));
        }

        Season season = seasonService.getCurrentSeason()
                .orElseThrow(() -> new IllegalStateException("No active season"));

        try {
            UserSeasonCoverage updated = coverageService.unlockNextWeek(userId, season.getId());
            int newWeek = updated.getCurrentWeek();
            List<String> newBooks = pairingRepository
                    .findBySeasonIdAndWeekNumber(season.getId(), newWeek)
                    .map(WeeklyPairing::getBookCodes)
                    .orElse(List.of());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "newWeek", newWeek,
                    "newBooks", newBooks
            ));
        } catch (UnlockException e) {
            int status = "NO_NEXT_WEEK".equals(e.getCode()) ? 404 : 400;
            return ResponseEntity.status(status).body(Map.of("error", e.getCode()));
        }
    }

    private String resolveUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth) {
            String email = oauth.getAttribute("email");
            if (email == null) return null;
            User user = userRepository.findByEmail(email).orElse(null);
            return user == null ? null : user.getId();
        }
        return null;
    }

    private static String badgePreview(int totalCovered) {
        if (totalCovered >= 66) return "Toàn Thư";
        if (totalCovered >= 51) return "Tận Tâm";
        if (totalCovered >= 21) return "Hành Hương";
        return "";
    }
}
