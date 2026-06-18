package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.service.SeasonService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.biblequiz.infrastructure.service.CacheService;
import com.biblequiz.infrastructure.time.GameClock;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import org.springframework.security.oauth2.core.user.OAuth2User;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    @Autowired
    private UserDailyProgressRepository udpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CacheService cacheService;

    @Autowired
    private SeasonService seasonService;

    private String resolveEmail(Authentication authentication) {
        if (authentication == null)
            return null;
        try {
            Object principal = authentication.getPrincipal();
            if (principal instanceof OAuth2User oAuth2User) {
                Object emailAttr = oAuth2User.getAttributes().get("email");
                if (emailAttr != null)
                    return emailAttr.toString();
            }
        } catch (Exception ignore) {
        }
        return authentication.getName();
    }

    @GetMapping("/daily")
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<Map<String, Object>>> daily(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        LocalDate d = date != null ? date : GameClock.today();
        String cacheKey = CacheService.LEADERBOARD_CACHE_PREFIX + "daily:" + d + ":p" + page + ":s" + size;
        Optional<List> cached = cacheService.get(cacheKey, List.class);
        if (cached.isPresent()) {
            return ResponseEntity.ok(cached.get());
        }
        List<Object[]> rows = udpRepository.findDailyLeaderboard(d, size, page * size);
        List<Map<String, Object>> result = mapLeaderboardRows(rows);
        cacheService.cacheLeaderboard("daily:" + d + ":p" + page + ":s" + size, result);
        return ResponseEntity.ok(result);
    }

    /**
     * Weekly leaderboard — LBW-5 + LBW-6: window is the current calendar
     * week in Asia/Ho_Chi_Minh, starting Monday 00:00 ICT. Previously was
     * a rolling 7-day UTC window which (a) never visibly reset and (b)
     * mis-attributed boundary plays for VN users by 7 hours. End date is
     * clamped to today so an in-flight week doesn't include future
     * zero-point days.
     */
    @GetMapping("/weekly")
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<Map<String, Object>>> weekly(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        LocalDate end = GameClock.today();
        LocalDate start = GameClock.weekStart(end);
        String cacheKey = CacheService.LEADERBOARD_CACHE_PREFIX + "weekly:" + start + ":" + end + ":p" + page + ":s" + size;
        Optional<List> cached = cacheService.get(cacheKey, List.class);
        if (cached.isPresent()) {
            return ResponseEntity.ok(cached.get());
        }
        List<Object[]> rows = udpRepository.findWeeklyLeaderboard(start, end, size, page * size);
        List<Map<String, Object>> result = mapLeaderboardRows(rows);
        cacheService.cacheLeaderboard("weekly:" + start + ":" + end + ":p" + page + ":s" + size, result);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/monthly")
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<Map<String, Object>>> monthly(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        LocalDate end = GameClock.today();
        LocalDate start = end.withDayOfMonth(1);
        String cacheKey = CacheService.LEADERBOARD_CACHE_PREFIX + "monthly:" + start + ":" + end + ":p" + page + ":s" + size;
        Optional<List> cached = cacheService.get(cacheKey, List.class);
        if (cached.isPresent()) {
            return ResponseEntity.ok(cached.get());
        }
        List<Object[]> rows = udpRepository.findWeeklyLeaderboard(start, end, size, page * size);
        List<Map<String, Object>> result = mapLeaderboardRows(rows);
        cacheService.cacheLeaderboard("monthly:" + start + ":" + end + ":p" + page + ":s" + size, result);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/all-time")
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<Map<String, Object>>> allTime(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        String cacheKey = CacheService.LEADERBOARD_CACHE_PREFIX + "all-time:p" + page + ":s" + size;
        Optional<List> cached = cacheService.get(cacheKey, List.class);
        if (cached.isPresent()) {
            return ResponseEntity.ok(cached.get());
        }
        List<Object[]> rows = udpRepository.findAllTimeLeaderboard(size, page * size);
        List<Map<String, Object>> result = mapLeaderboardRows(rows);
        cacheService.cacheLeaderboard("all-time:p" + page + ":s" + size, result);
        return ResponseEntity.ok(result);
    }

    /**
     * Season leaderboard — sums {@code UserDailyProgress.pointsCounted} between
     * the active season's start and end dates. Returns empty list when no
     * season is active. End date clamped to today so an in-flight season does
     * not include future zero-point days.
     */
    @GetMapping("/season")
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<Map<String, Object>>> season(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Optional<Season> activeSeason = seasonService.getActiveSeason();
        if (activeSeason.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        Season s = activeSeason.get();
        LocalDate today = GameClock.today();
        LocalDate end = today.isBefore(s.getEndDate()) ? today : s.getEndDate();
        LocalDate start = s.getStartDate();
        String cacheKey = CacheService.LEADERBOARD_CACHE_PREFIX + "season:" + s.getId() + ":" + start + ":" + end + ":p" + page + ":s" + size;
        Optional<List> cached = cacheService.get(cacheKey, List.class);
        if (cached.isPresent()) {
            return ResponseEntity.ok(cached.get());
        }
        List<Object[]> rows = udpRepository.findWeeklyLeaderboard(start, end, size, page * size);
        List<Map<String, Object>> result = mapLeaderboardRows(rows);
        cacheService.cacheLeaderboard("season:" + s.getId() + ":" + start + ":" + end + ":p" + page + ":s" + size, result);
        return ResponseEntity.ok(result);
    }

    /**
     * Maps native query result rows [userId, name, avatarUrl, points, questions] to response maps.
     */
    private List<Map<String, Object>> mapLeaderboardRows(List<Object[]> rows) {
        return rows.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("userId", row[0]);
            m.put("name", row[1] != null ? row[1] : "An danh");
            m.put("avatarUrl", row[2]);
            m.put("points", row[3] != null ? ((Number) row[3]).intValue() : 0);
            m.put("questions", row[4] != null ? ((Number) row[4]).intValue() : 0);
            return m;
        }).collect(Collectors.toList());
    }

    @GetMapping("/daily/my-rank")
    public ResponseEntity<Map<String, Object>> getMyDailyRank(
            Authentication authentication,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        LocalDate targetDate = date != null ? date : GameClock.today();
        String email = resolveEmail(authentication);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(null);
        }

        UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), targetDate).orElse(null);
        if (udp == null) {
            return ResponseEntity.ok(null);
        }

        int points = udp.getPointsCounted() != null ? udp.getPointsCounted() : 0;
        int questions = udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0;
        int rank = (int) udpRepository.countUsersAheadOnDate(targetDate, points, questions, user.getCreatedAt()) + 1;

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getName());
        result.put("points", points);
        result.put("questions", questions);
        result.put("rank", rank);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/weekly/my-rank")
    public ResponseEntity<Map<String, Object>> getMyWeeklyRank(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        String email = resolveEmail(authentication);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(null);
        }

        LocalDate end = GameClock.today();
        LocalDate weekStart = GameClock.weekStart(end);

        List<UserDailyProgress> rows = udpRepository.findByUserIdAndDateBetween(user.getId(), weekStart, end);
        int myPoints = rows.stream()
                .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
                .sum();

        if (myPoints == 0) {
            return ResponseEntity.ok(null);
        }

        int myQuestions = rows.stream()
                .mapToInt(udp -> udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0)
                .sum();
        int rank = (int) udpRepository.countUsersAheadInDateRange(weekStart, end, myPoints, myQuestions, user.getCreatedAt()) + 1;

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getName());
        result.put("points", myPoints);
        result.put("rank", rank);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/monthly/my-rank")
    public ResponseEntity<Map<String, Object>> getMyMonthlyRank(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        String email = resolveEmail(authentication);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(null);
        }

        LocalDate end = GameClock.today();
        LocalDate monthStart = end.withDayOfMonth(1);

        List<UserDailyProgress> rows = udpRepository.findByUserIdAndDateBetween(user.getId(), monthStart, end);
        int myPoints = rows.stream()
                .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
                .sum();

        if (myPoints == 0) {
            return ResponseEntity.ok(null);
        }

        int myQuestions = rows.stream()
                .mapToInt(udp -> udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0)
                .sum();
        int rank = (int) udpRepository.countUsersAheadInMonth(monthStart, end, myPoints, myQuestions, user.getCreatedAt()) + 1;

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getName());
        result.put("points", myPoints);
        result.put("rank", rank);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/season/my-rank")
    public ResponseEntity<Map<String, Object>> getMySeasonRank(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        Optional<Season> activeSeason = seasonService.getActiveSeason();
        if (activeSeason.isEmpty()) {
            return ResponseEntity.ok(null);
        }

        String email = resolveEmail(authentication);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(null);
        }

        Season s = activeSeason.get();
        LocalDate today = GameClock.today();
        LocalDate end = today.isBefore(s.getEndDate()) ? today : s.getEndDate();
        LocalDate start = s.getStartDate();

        List<UserDailyProgress> rows = udpRepository.findByUserIdAndDateBetween(user.getId(), start, end);
        int myPoints = rows.stream()
                .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
                .sum();

        if (myPoints == 0) {
            return ResponseEntity.ok(null);
        }

        int myQuestions = rows.stream()
                .mapToInt(udp -> udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0)
                .sum();
        int rank = (int) udpRepository.countUsersAheadInDateRange(start, end, myPoints, myQuestions, user.getCreatedAt()) + 1;

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getName());
        result.put("points", myPoints);
        result.put("rank", rank);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/all-time/my-rank")
    public ResponseEntity<Map<String, Object>> getMyAllTimeRank(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        String email = resolveEmail(authentication);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(null);
        }

        List<UserDailyProgress> rows = udpRepository.findByUserIdOrderByDateDesc(user.getId());
        int myPoints = rows.stream()
                .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
                .sum();

        if (myPoints == 0) {
            return ResponseEntity.ok(null);
        }

        int myQuestions = rows.stream()
                .mapToInt(udp -> udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0)
                .sum();
        int rank = (int) udpRepository.countUsersAheadAllTime(myPoints, myQuestions, user.getCreatedAt()) + 1;

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getName());
        result.put("points", myPoints);
        result.put("rank", rank);
        return ResponseEntity.ok(result);
    }
}
