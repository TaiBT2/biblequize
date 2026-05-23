package com.biblequiz.infrastructure.time;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class GameClockTest {

    @Test
    void gameZone_isAsiaHoChiMinh() {
        assertEquals(ZoneId.of("Asia/Ho_Chi_Minh"), GameClock.GAME_ZONE,
                "Game clock must run in Asia/Ho_Chi_Minh — LBW-5 rationale.");
    }

    @Test
    void today_resolvesIctRatherThanUtc_atUtcBoundary() {
        // Sanity check: at 22:00 UTC on day N, it is 05:00 ICT on day N+1.
        // We can't easily freeze the clock here without injecting a Clock
        // dependency, but we can assert the offset semantics by computing
        // both directly and confirming today() lines up with the ICT side.
        LocalDate utcToday = LocalDate.now(ZoneOffset.UTC);
        LocalDate ictToday = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDate gameToday = GameClock.today();

        // GameClock must equal the ICT-zoned date, which is either same
        // as UTC or one day ahead — never one day behind.
        assertEquals(ictToday, gameToday);
        assertTrue(!gameToday.isBefore(utcToday),
                "GameClock today must not lag UTC; got game=" + gameToday + " utc=" + utcToday);
    }

    @Test
    void weekStart_returnsMonday_forEveryDayOfWeek() {
        // Anchor on a known Monday so the week boundaries are unambiguous.
        LocalDate monday = LocalDate.of(2026, 5, 18); // Monday
        for (int i = 0; i < 7; i++) {
            LocalDate anchor = monday.plusDays(i);
            LocalDate ws = GameClock.weekStart(anchor);
            assertEquals(DayOfWeek.MONDAY, ws.getDayOfWeek(),
                    "weekStart(" + anchor + ") must land on a Monday; got " + ws);
            assertEquals(monday, ws,
                    "weekStart(" + anchor + ") must be 2026-05-18; got " + ws);
        }
    }

    @Test
    void weekStart_isIdempotent_onMonday() {
        LocalDate monday = LocalDate.of(2026, 5, 18);
        assertEquals(monday, GameClock.weekStart(monday));
    }

    @Test
    void weekStart_neverInFuture() {
        // Regression guard: previousOrSame must walk backwards, not forwards.
        LocalDate sunday = LocalDate.of(2026, 5, 24); // Sunday
        LocalDate ws = GameClock.weekStart(sunday);
        assertTrue(!ws.isAfter(sunday),
                "weekStart must not return a date after the anchor; got " + ws + " for " + sunday);
        assertEquals(LocalDate.of(2026, 5, 18), ws);
    }

    @Test
    void gameZone_offsetIsPlusSevenHours() {
        // Vietnam does not observe DST, so the offset is a stable +07:00.
        // If this ever changes (or the constant gets repointed at another
        // zone), this lock test fails loudly.
        var offset = GameClock.GAME_ZONE.getRules().getOffset(LocalDateTime.now());
        assertEquals(ZoneOffset.ofHours(7), offset);
    }
}
