package com.biblequiz.modules.room.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * QP-4 — Redis-backed daily counter for Quick Match (Đấu Nhanh) usage.
 *
 * <p>Per locked decision 2026-05-15: each user can create at most {@link
 * #DAILY_CAP} = 3 Quick Match rooms per day. Counter key uses UTC date
 * boundary so reset happens at 0h UTC; first INCR of the day sets TTL to
 * end-of-UTC-day so the key auto-purges (Redis SETEX/EXPIRE pattern).
 *
 * <p>Reused {@code RedisTemplate<String, Object>} bean from {@link
 * com.biblequiz.infrastructure.RedisConfig}.
 *
 * <p><b>Anti-abuse note:</b> counter is incremented at room-create time
 * (not start-game time) so creating-then-leaving still burns the quota.
 * Otherwise users could spam-create rooms.
 */
@Component
public class DailyQuickMatchCounter {

    public static final int DAILY_CAP = 3;
    private static final String KEY_PREFIX = "quickmatch:daily:";

    @Autowired
    private RedisTemplate<String, Object> redis;

    public boolean hasReachedCap(String userId) {
        return getUsedToday(userId) >= DAILY_CAP;
    }

    public int getRemainingToday(String userId) {
        return Math.max(0, DAILY_CAP - getUsedToday(userId));
    }

    /** Increments the daily counter; sets TTL to EOD on the first increment. */
    public void increment(String userId) {
        String key = todayKey(userId);
        Long newValue = redis.opsForValue().increment(key);
        if (newValue != null && newValue == 1L) {
            // First INCR of the day → set TTL until 0h UTC tomorrow.
            Duration ttl = Duration.between(
                    Instant.now(),
                    LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant());
            redis.expire(key, ttl);
        }
    }

    private int getUsedToday(String userId) {
        Object raw = redis.opsForValue().get(todayKey(userId));
        if (raw == null) return 0;
        try { return Integer.parseInt(raw.toString()); }
        catch (NumberFormatException e) { return 0; }
    }

    private String todayKey(String userId) {
        String yyyymmdd = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.BASIC_ISO_DATE);
        return KEY_PREFIX + userId + ":" + yyyymmdd;
    }
}
