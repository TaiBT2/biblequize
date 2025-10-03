package com.biblequiz.controller;

import com.biblequiz.repository.UserDailyProgressRepository;
import com.biblequiz.repository.UserRepository;
import com.biblequiz.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
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

    @GetMapping("/daily")
    public ResponseEntity<List<Map<String, Object>>> daily(
        @RequestParam(value = "date", required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        LocalDate d = date != null ? date : LocalDate.now();
        java.util.List<com.biblequiz.entity.UserDailyProgress> rows = udpRepository.findByDateOrderByPointsCountedDesc(d);
        java.util.List<java.util.Map<String, Object>> list = rows.stream()
            .skip(page * size)
            .limit(size)
            .map(udp -> {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("userId", udp.getUser().getId());
                m.put("name", udp.getUser().getName());
                m.put("points", udp.getPointsCounted());
                m.put("questions", udp.getQuestionsCounted());
                return m;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<Map<String, Object>>> weekly(
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        java.util.List<com.biblequiz.entity.UserDailyProgress> rows = udpRepository.findByDateBetweenOrderByPointsCountedDesc(start, end);
        java.util.List<java.util.Map<String, Object>> list = rows.stream()
            .collect(Collectors.groupingBy(udp -> udp.getUser().getId()))
            .entrySet().stream()
            .map(e -> {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("userId", e.getKey());
                m.put("name", e.getValue().get(0).getUser().getName());
                m.put("points", e.getValue().stream().mapToInt(x -> x.getPointsCounted()).sum());
                m.put("questions", e.getValue().stream().mapToInt(x -> x.getQuestionsCounted()).sum());
                return m;
            })
            .sorted((a,b) -> ((Integer)b.get("points")).compareTo((Integer)a.get("points")))
            .skip(page * size)
            .limit(size)
            .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/all-time")
    public ResponseEntity<List<Map<String, Object>>> allTime(
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusYears(10);
        java.util.List<com.biblequiz.entity.UserDailyProgress> rows = udpRepository.findByDateBetweenOrderByPointsCountedDesc(start, end);
        java.util.List<java.util.Map<String, Object>> list = rows.stream()
            .collect(Collectors.groupingBy(udp -> udp.getUser().getId()))
            .entrySet().stream()
            .map(e -> {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("userId", e.getKey());
                m.put("name", e.getValue().get(0).getUser().getName());
                m.put("points", e.getValue().stream().mapToInt(x -> x.getPointsCounted()).sum());
                m.put("questions", e.getValue().stream().mapToInt(x -> x.getQuestionsCounted()).sum());
                return m;
            })
            .sorted((a,b) -> ((Integer)b.get("points")).compareTo((Integer)a.get("points")))
            .skip(page * size)
            .limit(size)
            .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/daily/my-rank")
    public ResponseEntity<Map<String, Object>> getMyDailyRank(
        Authentication authentication,
        @RequestParam(value = "date", required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        LocalDate targetDate = date != null ? date : LocalDate.now();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.ok(null);
        }

        // Get all daily progress for the date, ordered by points
        List<Map<String, Object>> allProgress = udpRepository.findByDateOrderByPointsCountedDesc(targetDate)
            .stream()
            .map(udp -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", udp.getUser().getId());
                map.put("name", udp.getUser().getName());
                map.put("points", udp.getPointsCounted() != null ? udp.getPointsCounted() : 0);
                map.put("questions", udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0);
                return map;
            })
            .collect(Collectors.toList());

        // Find user's rank
        int rank = 1;
        Map<String, Object> userData = null;
        
        for (Map<String, Object> progress : allProgress) {
            if (progress.get("userId").equals(user.getId())) {
                userData = progress;
                userData.put("rank", rank);
                break;
            }
            rank++;
        }

        return ResponseEntity.ok(userData);
    }

    @GetMapping("/weekly/my-rank")
    public ResponseEntity<Map<String, Object>> getMyWeeklyRank(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.ok(null);
        }

        // Get weekly leaderboard (last 7 days)
        LocalDate weekStart = LocalDate.now().minusDays(6);
        List<Map<String, Object>> weeklyData = udpRepository.findByDateBetweenOrderByPointsCountedDesc(weekStart, LocalDate.now())
            .stream()
            .collect(Collectors.groupingBy(udp -> udp.getUser().getId()))
            .entrySet()
            .stream()
            .map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("userId", e.getKey());
                m.put("name", e.getValue().get(0).getUser().getName());
                m.put("points", e.getValue().stream().mapToInt(x -> x.getPointsCounted() != null ? x.getPointsCounted() : 0).sum());
                m.put("questions", e.getValue().stream().mapToInt(x -> x.getQuestionsCounted() != null ? x.getQuestionsCounted() : 0).sum());
                return m;
            })
            .sorted((a,b) -> ((Integer)b.get("points")).compareTo((Integer)a.get("points")))
            .collect(Collectors.toList());

        // Find user's rank
        int rank = 1;
        Map<String, Object> userData = null;
        
        for (Map<String, Object> progress : weeklyData) {
            if (progress.get("userId").equals(user.getId())) {
                userData = progress;
                userData.put("rank", rank);
                break;
            }
            rank++;
        }

        return ResponseEntity.ok(userData);
    }

    @GetMapping("/all-time/my-rank")
    public ResponseEntity<Map<String, Object>> getMyAllTimeRank(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(null);
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.ok(null);
        }

        // Get all-time leaderboard (all data)
        List<Map<String, Object>> allTimeData = udpRepository.findAll()
            .stream()
            .collect(Collectors.groupingBy(udp -> udp.getUser().getId()))
            .entrySet()
            .stream()
            .map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("userId", e.getKey());
                m.put("name", e.getValue().get(0).getUser().getName());
                m.put("points", e.getValue().stream().mapToInt(x -> x.getPointsCounted() != null ? x.getPointsCounted() : 0).sum());
                m.put("questions", e.getValue().stream().mapToInt(x -> x.getQuestionsCounted() != null ? x.getQuestionsCounted() : 0).sum());
                return m;
            })
            .sorted((a,b) -> ((Integer)b.get("points")).compareTo((Integer)a.get("points")))
            .collect(Collectors.toList());

        // Find user's rank
        int rank = 1;
        Map<String, Object> userData = null;
        
        for (Map<String, Object> progress : allTimeData) {
            if (progress.get("userId").equals(user.getId())) {
                userData = progress;
                userData.put("rank", rank);
                break;
            }
            rank++;
        }

        return ResponseEntity.ok(userData);
    }
}


