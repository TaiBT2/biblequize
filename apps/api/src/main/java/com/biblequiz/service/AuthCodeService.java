package com.biblequiz.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Short-lived auth code service — OAuth2 redirect uses an opaque code instead
 * of embedding JWT tokens directly in the URL (prevents token leakage via
 * browser history, server access logs, and Referer headers).
 *
 * Flow:
 *   1. OAuth2SuccessHandler stores {token, refreshToken, name, email, avatar}
 *      in Redis under a random UUID code (TTL = 2 min).
 *   2. Redirect frontend with just the opaque code: /auth/callback?code=<uuid>
 *   3. Frontend calls POST /auth/exchange?code=<uuid> to retrieve tokens over
 *      HTTPS/JSON — never visible in logs or browser history.
 */
@Service
public class AuthCodeService {

    private static final String PREFIX = "auth:code:";
    private static final Duration TTL = Duration.ofMinutes(2);

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * Stores token payload in Redis and returns a one-time opaque code.
     */
    public String createCode(Map<String, Object> payload) {
        String code = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(PREFIX + code, payload, TTL);
        return code;
    }

    /**
     * Retrieves and deletes the payload for a given code (one-time use).
     *
     * @return the payload map, or null if code is invalid/expired
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> consumeCode(String code) {
        if (code == null || code.isBlank()) return null;
        String key = PREFIX + code;
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) return null;
        redisTemplate.delete(key);
        return (Map<String, Object>) value;
    }
}
