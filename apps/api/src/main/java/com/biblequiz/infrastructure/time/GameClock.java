package com.biblequiz.infrastructure.time;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

/**
 * Canonical clock for "what day is it for the user". BibleQuize targets
 * Vietnamese (UTC+7) audience — a user playing at 06:00 ICT (= 23:00 UTC
 * the previous day) expects their points / streak / mission progress to
 * land on <em>today</em>, not <em>yesterday</em>.
 *
 * <p>Previously {@code LocalDate.now(ZoneOffset.UTC)} was used everywhere,
 * which silently shifted the day boundary 7 hours into a user's evening
 * and caused leaderboard / streak boundaries to feel "off by a day"
 * around late-night / early-morning play.
 *
 * <p>This helper centralizes both the timezone and the calendar-week
 * boundary (LBW-6 — week resets Monday 00:00 ICT). Anything user-facing
 * that thinks in days/weeks (UDP writers, leaderboard windows, streak,
 * daily mission, daily challenge) should call {@link #today()} /
 * {@link #weekStart(LocalDate)} rather than re-deriving with raw
 * {@code ZoneOffset.UTC}.
 *
 * <p>Out of scope for LBW-5: admin/cron/season modules still use UTC
 * for now — see TODO for follow-up migration.
 */
public final class GameClock {

    public static final ZoneId GAME_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private GameClock() {}

    /** Today's date in Asia/Ho_Chi_Minh. */
    public static LocalDate today() {
        return LocalDate.now(GAME_ZONE);
    }

    /**
     * Monday of the ISO week containing {@code anchor}. Vietnam treats
     * Monday as the start of the week (also matches ISO-8601), so the
     * weekly leaderboard window starts here.
     */
    public static LocalDate weekStart(LocalDate anchor) {
        return anchor.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
