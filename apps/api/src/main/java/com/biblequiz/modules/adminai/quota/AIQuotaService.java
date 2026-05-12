package com.biblequiz.modules.adminai.quota;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;

/**
 * Redis-backed daily AI generation quota — SHARED globally across admin and group leader
 * endpoints (per decision D5: 200 câu/day total).
 *
 * <p>Counter key: {@code ai:quota:{yyyy-MM-dd}} (UTC), TTL 25h.
 * Reset is implicit (new date → new key).
 */
@Service
public class AIQuotaService {

    private static final Logger log = LoggerFactory.getLogger(AIQuotaService.class);
    private static final String KEY_PREFIX = "ai:quota:";

    private final StringRedisTemplate redis;
    private final int dailyLimit;

    public AIQuotaService(StringRedisTemplate redis,
                          @Value("${biblequiz.ai.quota.daily-limit:200}") int dailyLimit) {
        this.redis = redis;
        this.dailyLimit = dailyLimit;
    }

    /**
     * Atomically reserve {@code count} units of quota. Returns {@code true} if granted.
     * On rejection, the increment is rolled back so the counter stays consistent.
     */
    public boolean tryAcquire(int count) {
        if (count <= 0) return true;
        String key = todayKey();
        try {
            Long newValue = redis.opsForValue().increment(key, count);
            redis.expire(key, Duration.ofHours(25));
            if (newValue == null) return false;
            if (newValue > dailyLimit) {
                redis.opsForValue().increment(key, -count);
                return false;
            }
            return true;
        } catch (Exception e) {
            // If Redis is down, fail-open so the AI flow still works in dev/CI.
            log.warn("[AI][Quota] Redis error during tryAcquire — failing open: {}", e.getMessage());
            return true;
        }
    }

    /** Snapshot of usage today. Never throws. */
    public Usage snapshot() {
        try {
            String value = redis.opsForValue().get(todayKey());
            int used = value != null ? Integer.parseInt(value) : 0;
            return new Usage(used, dailyLimit, Math.max(0, dailyLimit - used));
        } catch (Exception e) {
            log.warn("[AI][Quota] Redis error during snapshot — returning zeros: {}", e.getMessage());
            return new Usage(0, dailyLimit, dailyLimit);
        }
    }

    public int getDailyLimit() { return dailyLimit; }

    private String todayKey() {
        return KEY_PREFIX + LocalDate.now(ZoneOffset.UTC);
    }

    public record Usage(int used, int limit, int remaining) {}
}
