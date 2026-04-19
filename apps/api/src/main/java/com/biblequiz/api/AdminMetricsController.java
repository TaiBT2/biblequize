package com.biblequiz.api;

import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-only product metrics endpoints. Each feature gets its own method
 * to keep payload shapes obvious and cache strategies independent.
 */
@RestController
@RequestMapping("/api/admin/metrics")
@PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_MOD')")
public class AdminMetricsController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Early Ranked Unlock adoption + quality metrics. Built on top of the
     * {@code users.early_ranked_unlocked_at} timestamp (set once per user
     * the first time the 80% / 10Q policy flips the flag).
     *
     * <p>Returns (contract):
     * <pre>
     * {
     *   "totalUnlockers":          long,           // all-time
     *   "unlocksLast7Days":        long,
     *   "unlocksLast30Days":       long,
     *   "avgAccuracyPctAtUnlock":  double|null,    // null when zero unlockers
     *   "timeline": [                              // last 30 days, zero-filled
     *     {"date": "2026-03-20", "count": 0},
     *     ...
     *     {"date": "2026-04-19", "count": 2}
     *   ]
     * }
     * </pre>
     *
     * <p>Zero-filling keeps the FE chart logic trivial — no gap
     * interpolation, no "missing day" branching.
     */
    @GetMapping("/early-unlock")
    public ResponseEntity<Map<String, Object>> getEarlyUnlockMetrics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last7 = now.minusDays(7);
        LocalDateTime last30 = now.minusDays(30);

        long totalUnlockers = userRepository.countByEarlyRankedUnlockTrue();
        long unlocksLast7Days = userRepository.countByEarlyRankedUnlockedAtAfter(last7);
        long unlocksLast30Days = userRepository.countByEarlyRankedUnlockedAtAfter(last30);
        Double avgAccuracy = userRepository.findAverageAccuracyPctAtUnlock();

        // Timeline: bucket DB counts by day, then zero-fill any missing days
        // so the FE gets a contiguous 30-point series.
        List<Object[]> raw = userRepository.findEarlyUnlockDailyCountsSince(last30);
        Map<LocalDate, Long> byDay = new HashMap<>();
        for (Object[] row : raw) {
            // DATE() function returns java.sql.Date (Hibernate) or java.time.LocalDate
            LocalDate day = toLocalDate(row[0]);
            Long count = ((Number) row[1]).longValue();
            byDay.put(day, count);
        }

        List<Map<String, Object>> timeline = new ArrayList<>(30);
        LocalDate cursor = LocalDate.now().minusDays(29); // inclusive 30-day window ending today
        for (int i = 0; i < 30; i++) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", cursor.toString());
            point.put("count", byDay.getOrDefault(cursor, 0L));
            timeline.add(point);
            cursor = cursor.plusDays(1);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalUnlockers", totalUnlockers);
        response.put("unlocksLast7Days", unlocksLast7Days);
        response.put("unlocksLast30Days", unlocksLast30Days);
        // Round to 1 decimal place when present; null propagates cleanly
        response.put("avgAccuracyPctAtUnlock",
                avgAccuracy == null ? null : Math.round(avgAccuracy * 10.0) / 10.0);
        response.put("timeline", timeline);
        return ResponseEntity.ok(response);
    }

    /**
     * Hibernate may return {@code java.sql.Date} (from DATE() function) or
     * {@code java.time.LocalDate} depending on dialect/version. Normalize
     * both paths without dragging in a dialect-specific dependency.
     */
    private static LocalDate toLocalDate(Object raw) {
        if (raw instanceof LocalDate) return (LocalDate) raw;
        if (raw instanceof java.sql.Date) return ((java.sql.Date) raw).toLocalDate();
        if (raw instanceof java.util.Date) {
            return ((java.util.Date) raw).toInstant()
                    .atZone(java.time.ZoneId.systemDefault())
                    .toLocalDate();
        }
        // Fallback: parse ISO-8601 string
        return LocalDate.parse(raw.toString());
    }
}
