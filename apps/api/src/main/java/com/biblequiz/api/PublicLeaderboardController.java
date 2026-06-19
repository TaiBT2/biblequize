package com.biblequiz.api;

import com.biblequiz.infrastructure.service.CacheService;
import com.biblequiz.infrastructure.time.GameClock;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.service.SeasonService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Guest-readable leaderboard. Lives under {@code /api/public/**} (permitAll in
 * SecurityConfig) so the landing page + the /leaderboard page can show the
 * national board WITHOUT a session — no auth, no per-user data. Read-only,
 * top-N only. The authenticated {@link LeaderboardController} keeps the
 * per-user surfaces ({@code /my-rank}); this controller deliberately exposes
 * nothing user-specific.
 *
 * <p>Cache keys mirror {@link LeaderboardController} so guest + authed reads
 * share the same cached board rows.
 */
@RestController
@RequestMapping("/api/public/leaderboard")
@RequiredArgsConstructor
public class PublicLeaderboardController {

    private final UserDailyProgressRepository udpRepository;
    private final SeasonService seasonService;
    private final CacheService cacheService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> leaderboard(
            @RequestParam(value = "period", defaultValue = "all-time") String period,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        int safeSize = (size < 1 || size > 50) ? 20 : size;
        String p = period == null ? "all-time" : period.toLowerCase().replace('_', '-');
        switch (p) {
            case "weekly":
                return ResponseEntity.ok(weekly(safeSize));
            case "season":
                return ResponseEntity.ok(season(safeSize));
            case "all-time":
            default:
                return ResponseEntity.ok(allTime(safeSize));
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> allTime(int size) {
        String suffix = "all-time:p0:s" + size;
        Optional<List> cached = cacheService.get(CacheService.LEADERBOARD_CACHE_PREFIX + suffix, List.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<Map<String, Object>> result = mapLeaderboardRows(udpRepository.findAllTimeLeaderboard(size, 0));
        cacheService.cacheLeaderboard(suffix, result);
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> weekly(int size) {
        LocalDate end = GameClock.today();
        LocalDate start = GameClock.weekStart(end);
        String suffix = "weekly:" + start + ":" + end + ":p0:s" + size;
        Optional<List> cached = cacheService.get(CacheService.LEADERBOARD_CACHE_PREFIX + suffix, List.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<Map<String, Object>> result = mapLeaderboardRows(udpRepository.findWeeklyLeaderboard(start, end, size, 0));
        cacheService.cacheLeaderboard(suffix, result);
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> season(int size) {
        Optional<Season> activeSeason = seasonService.getActiveSeason();
        if (activeSeason.isEmpty()) {
            return Collections.emptyList();
        }
        Season s = activeSeason.get();
        LocalDate today = GameClock.today();
        LocalDate end = today.isBefore(s.getEndDate()) ? today : s.getEndDate();
        LocalDate start = s.getStartDate();
        String suffix = "season:" + s.getId() + ":" + start + ":" + end + ":p0:s" + size;
        Optional<List> cached = cacheService.get(CacheService.LEADERBOARD_CACHE_PREFIX + suffix, List.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<Map<String, Object>> result = mapLeaderboardRows(udpRepository.findWeeklyLeaderboard(start, end, size, 0));
        cacheService.cacheLeaderboard(suffix, result);
        return result;
    }

    /**
     * Maps native query rows [userId, name, avatarUrl, points, questions] to
     * response maps. LBF-5: the raw {@code userId} (UUID) is deliberately NOT
     * exposed on this guest endpoint — anonymous visitors only need
     * name/avatar/points/questions, and leaking internal ids is needless. The
     * authenticated {@link LeaderboardController} still returns userId (the FE
     * needs it to highlight the current user).
     */
    private List<Map<String, Object>> mapLeaderboardRows(List<Object[]> rows) {
        return rows.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name", row[1] != null ? row[1] : "An danh");
            m.put("avatarUrl", row[2]);
            m.put("points", row[3] != null ? ((Number) row[3]).intValue() : 0);
            m.put("questions", row[4] != null ? ((Number) row[4]).intValue() : 0);
            return m;
        }).collect(Collectors.toList());
    }
}
