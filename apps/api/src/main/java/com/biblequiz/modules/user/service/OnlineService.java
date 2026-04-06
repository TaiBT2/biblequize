package com.biblequiz.modules.user.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.Map;
import java.util.Set;

@Service
public class OnlineService {

    private static final String ONLINE_KEY_PREFIX = "online:user:";
    private static final Duration TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, Object> redisTemplate;

    public OnlineService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Set user as online with activity status.
     */
    public void setOnline(String userId, String activity) {
        String key = ONLINE_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key, activity, TTL);
    }

    /**
     * Check if user is online.
     */
    public boolean isOnline(String userId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(ONLINE_KEY_PREFIX + userId));
    }

    /**
     * Get user's current activity.
     */
    public String getActivity(String userId) {
        Object val = redisTemplate.opsForValue().get(ONLINE_KEY_PREFIX + userId);
        return val != null ? val.toString() : null;
    }

    /**
     * Set user as offline.
     */
    public void setOffline(String userId) {
        redisTemplate.delete(ONLINE_KEY_PREFIX + userId);
    }

    /**
     * Heartbeat — refresh TTL.
     */
    public void heartbeat(String userId) {
        String key = ONLINE_KEY_PREFIX + userId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            redisTemplate.expire(key, TTL);
        }
    }
}
