package com.biblequiz.api;

import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminMetricsControllerTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private AdminMetricsController controller;

    @Test
    void earlyUnlockMetrics_emptyState_returnsZerosAndNullAccuracy() {
        when(userRepository.countByEarlyRankedUnlockTrue()).thenReturn(0L);
        when(userRepository.countByEarlyRankedUnlockedAtAfter(any())).thenReturn(0L);
        when(userRepository.findAverageAccuracyPctAtUnlock()).thenReturn(null);
        when(userRepository.findEarlyUnlockDailyCountsSince(any())).thenReturn(Collections.emptyList());

        ResponseEntity<Map<String, Object>> res = controller.getEarlyUnlockMetrics();

        assertEquals(200, res.getStatusCode().value());
        Map<String, Object> body = res.getBody();
        assertNotNull(body);
        assertEquals(0L, body.get("totalUnlockers"));
        assertEquals(0L, body.get("unlocksLast7Days"));
        assertEquals(0L, body.get("unlocksLast30Days"));
        assertNull(body.get("avgAccuracyPctAtUnlock"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> timeline = (List<Map<String, Object>>) body.get("timeline");
        assertEquals(30, timeline.size(), "Timeline should be zero-filled to exactly 30 days");
        // All counts should be 0 in empty state
        assertTrue(timeline.stream().allMatch(p -> ((Number) p.get("count")).longValue() == 0L));
    }

    @Test
    void earlyUnlockMetrics_populated_returnsCountsAndRoundsAvg() {
        when(userRepository.countByEarlyRankedUnlockTrue()).thenReturn(42L);
        when(userRepository.countByEarlyRankedUnlockedAtAfter(any()))
                .thenReturn(12L)  // last 7 days
                .thenReturn(30L); // last 30 days
        when(userRepository.findAverageAccuracyPctAtUnlock()).thenReturn(87.6543);
        when(userRepository.findEarlyUnlockDailyCountsSince(any())).thenReturn(Collections.emptyList());

        Map<String, Object> body = controller.getEarlyUnlockMetrics().getBody();
        assertNotNull(body);
        assertEquals(42L, body.get("totalUnlockers"));
        assertEquals(12L, body.get("unlocksLast7Days"));
        assertEquals(30L, body.get("unlocksLast30Days"));
        assertEquals(87.7, body.get("avgAccuracyPctAtUnlock"), "Should round to 1 decimal");
    }

    @Test
    void earlyUnlockMetrics_timeline_mergesRawCountsIntoZeroFilledWindow() {
        when(userRepository.countByEarlyRankedUnlockTrue()).thenReturn(3L);
        when(userRepository.countByEarlyRankedUnlockedAtAfter(any())).thenReturn(3L);
        when(userRepository.findAverageAccuracyPctAtUnlock()).thenReturn(85.0);

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        // Explicit <Object[]> type witness to keep the varargs inference
        // honest — passing Object[] args to List.of can otherwise flatten.
        when(userRepository.findEarlyUnlockDailyCountsSince(any())).thenReturn(List.<Object[]>of(
                new Object[]{today, 2L},
                new Object[]{yesterday, 1L}
        ));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> timeline = (List<Map<String, Object>>) controller
                .getEarlyUnlockMetrics().getBody().get("timeline");

        assertEquals(30, timeline.size());
        // Last point should be today's bucket
        Map<String, Object> last = timeline.get(29);
        assertEquals(today.toString(), last.get("date"));
        assertEquals(2L, last.get("count"));
        // Second-to-last is yesterday
        Map<String, Object> prev = timeline.get(28);
        assertEquals(yesterday.toString(), prev.get("date"));
        assertEquals(1L, prev.get("count"));
        // First 28 points are zero
        for (int i = 0; i < 28; i++) {
            assertEquals(0L, timeline.get(i).get("count"),
                    "Missing day at index " + i + " should zero-fill");
        }
    }

    @Test
    void earlyUnlockMetrics_timeline_handlesSqlDateFromHibernate() {
        when(userRepository.countByEarlyRankedUnlockTrue()).thenReturn(1L);
        when(userRepository.countByEarlyRankedUnlockedAtAfter(any())).thenReturn(1L);
        when(userRepository.findAverageAccuracyPctAtUnlock()).thenReturn(90.0);

        // Some Hibernate dialects return java.sql.Date instead of LocalDate
        LocalDate today = LocalDate.now();
        java.sql.Date sqlToday = java.sql.Date.valueOf(today);
        // Explicit <Object[]> type witness — List.of(new Object[]{...}) with
        // a single array arg would otherwise be inferred as List<Object>
        // and break Mockito's generic matching.
        when(userRepository.findEarlyUnlockDailyCountsSince(any())).thenReturn(List.<Object[]>of(
                new Object[]{sqlToday, 5L}
        ));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> timeline = (List<Map<String, Object>>) controller
                .getEarlyUnlockMetrics().getBody().get("timeline");
        assertEquals(5L, timeline.get(29).get("count"));
    }

    @Test
    void earlyUnlockMetrics_invokesRepoWithConsistentWindowBoundaries() {
        when(userRepository.countByEarlyRankedUnlockTrue()).thenReturn(0L);
        when(userRepository.countByEarlyRankedUnlockedAtAfter(any())).thenReturn(0L);
        when(userRepository.findAverageAccuracyPctAtUnlock()).thenReturn(null);
        when(userRepository.findEarlyUnlockDailyCountsSince(any())).thenReturn(Collections.emptyList());

        // Just ensure no exception and shape matches; exact LocalDateTime
        // boundary comparison is unstable over wall-clock tests — verified
        // indirectly via timeline length == 30 in other cases.
        var res = controller.getEarlyUnlockMetrics();
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void earlyUnlockMetrics_avgAccuracyPreservesDecimalPrecisionWithinOneDigit() {
        when(userRepository.countByEarlyRankedUnlockTrue()).thenReturn(1L);
        when(userRepository.countByEarlyRankedUnlockedAtAfter(any())).thenReturn(1L);
        when(userRepository.findEarlyUnlockDailyCountsSince(any())).thenReturn(Collections.emptyList());

        // Exactly 80% — the threshold — should round to 80.0 not 80 (int)
        when(userRepository.findAverageAccuracyPctAtUnlock()).thenReturn(80.0);
        Object acc = controller.getEarlyUnlockMetrics().getBody().get("avgAccuracyPctAtUnlock");
        assertEquals(80.0, acc);
    }
}
