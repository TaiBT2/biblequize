package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import org.springframework.security.oauth2.core.user.OAuth2User;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    @Autowired
    private UserDailyProgressRepository udpRepository;

    @Autowired
    private UserRepository userRepository;

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
    public ResponseEntity<List<Map<String, Object>>> daily(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        LocalDate d = date != null ? date : LocalDate.now(ZoneOffset.UTC);
        java.util.List<UserDailyProgress> rows = udpRepository
                .findByDateOrderByPointsCountedDesc(d);
        java.util.List<java.util.Map<String, Object>> list = rows.stream()
                .skip(page * size)
                .limit(size)
                .map(udp -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("userId", udp.getUser() != null ? udp.getUser().getId() : null);
                    m.put("name", udp.getUser() != null ? udp.getUser().getName() : "Ẩn danh");
                    m.put("avatarUrl", udp.getUser() != null ? udp.getUser().getAvatarUrl() : null);
                    m.put("points", udp.getPointsCounted() != null ? udp.getPointsCounted() : 0);
                    m.put("questions", udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0);
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<Map<String, Object>>> weekly(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        LocalDate end = LocalDate.now(ZoneOffset.UTC);
        LocalDate start = end.minusDays(6);
        java.util.List<UserDailyProgress> rows = udpRepository
                .findByDateBetweenOrderByPointsCountedDesc(start, end);
        java.util.List<java.util.Map<String, Object>> list = rows.stream()
                .collect(Collectors.groupingBy(udp -> udp.getUser().getId()))
                .entrySet().stream()
                .map(e -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("userId", e.getKey());
                    m.put("name", e.getValue().get(0).getUser().getName());
                    m.put("points", e.getValue().stream().mapToInt(x -> x.getPointsCounted() != null ? x.getPointsCounted() : 0).sum());
                    m.put("questions", e.getValue().stream().mapToInt(x -> x.getQuestionsCounted() != null ? x.getQuestionsCounted() : 0).sum());
                    return m;
                })
                .sorted((a, b) -> {
                    int cmp = ((Integer) b.get("points")).compareTo((Integer) a.get("points"));
                    if (cmp != 0)
                        return cmp;
                    return ((String) a.get("userId")).compareTo((String) b.get("userId"));
                })
                .skip(page * size)
                .limit(size)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/all-time")
    public ResponseEntity<List<Map<String, Object>>> allTime(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        LocalDate end = LocalDate.now(ZoneOffset.UTC);
        LocalDate start = end.minusYears(10);
        java.util.List<UserDailyProgress> rows = udpRepository
                .findByDateBetweenOrderByPointsCountedDesc(start, end);
        java.util.List<java.util.Map<String, Object>> list = rows.stream()
                .collect(Collectors.groupingBy(udp -> udp.getUser().getId()))
                .entrySet().stream()
                .map(e -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("userId", e.getKey());
                    m.put("name", e.getValue().get(0).getUser().getName());
                    m.put("points", e.getValue().stream().mapToInt(x -> x.getPointsCounted() != null ? x.getPointsCounted() : 0).sum());
                    m.put("questions", e.getValue().stream().mapToInt(x -> x.getQuestionsCounted() != null ? x.getQuestionsCounted() : 0).sum());
                    return m;
                })
                .sorted((a, b) -> {
                    int cmp = ((Integer) b.get("points")).compareTo((Integer) a.get("points"));
                    if (cmp != 0)
                        return cmp;
                    return ((String) a.get("userId")).compareTo((String) b.get("userId"));
                })
                .skip(page * size)
                .limit(size)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/daily/my-rank")
    public ResponseEntity<Map<String, Object>> getMyDailyRank(
            Authentication authentication,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        LocalDate targetDate = date != null ? date : LocalDate.now(ZoneOffset.UTC);
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
        int rank = (int) udpRepository.countUsersAheadOnDate(targetDate, points) + 1;

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getName());
        result.put("points", points);
        result.put("questions", udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0);
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

        LocalDate end = LocalDate.now(ZoneOffset.UTC);
        LocalDate weekStart = end.minusDays(6);

        int myPoints = udpRepository.findByUserIdAndDateBetween(user.getId(), weekStart, end)
                .stream()
                .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
                .sum();

        if (myPoints == 0) {
            return ResponseEntity.ok(null);
        }

        int rank = (int) udpRepository.countUsersAheadInDateRange(weekStart, end, myPoints) + 1;

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

        int myPoints = udpRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream()
                .mapToInt(udp -> udp.getPointsCounted() != null ? udp.getPointsCounted() : 0)
                .sum();

        if (myPoints == 0) {
            return ResponseEntity.ok(null);
        }

        int rank = (int) udpRepository.countUsersAheadAllTime(myPoints) + 1;

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("name", user.getName());
        result.put("points", myPoints);
        result.put("rank", rank);
        return ResponseEntity.ok(result);
    }
}
