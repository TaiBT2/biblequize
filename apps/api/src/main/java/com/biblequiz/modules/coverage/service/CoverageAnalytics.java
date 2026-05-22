package com.biblequiz.modules.coverage.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Structured-log telemetry for the Liturgical Coverage System (§7.16).
 *
 * <p>v1 implementation writes events to a dedicated slf4j logger
 * ({@code coverage.analytics}) as JSON-formatted lines. Operators can scrape
 * the log file or wire to a real pipeline (Mixpanel/PostHog) by swapping
 * implementations.</p>
 *
 * <p>Why slf4j and not the {@code audit_events} table: audit_events is
 * designed for admin actions (requires ipAddress, userAgent, eventType
 * enum). These coverage events are per-user automatic — different
 * cardinality and shape. Real analytics integration tracked separately.</p>
 */
@Service
public class CoverageAnalytics {

    private static final Logger log = LoggerFactory.getLogger("coverage.analytics");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public void track(String eventName, Map<String, Object> properties) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("event", eventName);
        if (properties != null) payload.putAll(properties);
        try {
            log.info(MAPPER.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize coverage analytics event {}: {}", eventName, e.getMessage());
        }
    }

    public void coverageBookTicked(String userId, String book, int totalAnsweredInBook,
                                   int tier, int week, String phase) {
        track("coverage_book_ticked", Map.of(
                "userId", userId,
                "book", book,
                "totalAnsweredInBook", totalAnsweredInBook,
                "tier", tier,
                "week", week,
                "phase", phase
        ));
    }

    public void weekCompleted(String userId, int week, String seasonCode,
                              long daysTaken, java.util.List<String> allBooks) {
        track("week_completed", Map.of(
                "userId", userId,
                "week", week,
                "seasonCode", seasonCode,
                "daysTaken", daysTaken,
                "allBooks", allBooks
        ));
    }

    public void unlockNextWeekTriggered(String userId, int fromWeek, int toWeek, int daysAheadOfCalendar) {
        track("unlock_next_week_triggered", Map.of(
                "userId", userId,
                "fromWeek", fromWeek,
                "toWeek", toWeek,
                "daysAheadOfCalendar", daysAheadOfCalendar
        ));
    }

    public void masteryWeekEntered(String userId, int uncoveredCount, String seasonCode) {
        track("mastery_week_entered", Map.of(
                "userId", userId,
                "uncoveredCount", uncoveredCount,
                "seasonCode", seasonCode
        ));
    }

    public void seasonBadgeAwarded(String userId, String badgeTier, int totalCovered, String seasonCode) {
        track("season_badge_awarded", Map.of(
                "userId", userId,
                "badgeTier", badgeTier,
                "totalCovered", totalCovered,
                "seasonCode", seasonCode
        ));
    }

    public void poolExhaustionFallback(String userId, int fallbackLevel, int week, int tier, String lang) {
        track("pool_exhaustion_fallback", Map.of(
                "userId", userId,
                "fallbackLevel", fallbackLevel,
                "week", week,
                "tier", tier,
                "lang", lang
        ));
    }

    public void lateJoinerDetected(String userId, int joinWeek, int tier) {
        track("late_joiner_detected", Map.of(
                "userId", userId,
                "joinWeek", joinWeek,
                "tier", tier
        ));
    }

    public void coverageCalcSlow(String userId, long durationMs) {
        track("coverage_calc_slow", Map.of(
                "userId", userId,
                "durationMs", durationMs
        ));
    }
}
