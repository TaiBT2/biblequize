package com.biblequiz.infrastructure.health;

import com.biblequiz.infrastructure.ConfigurationService;
import com.biblequiz.infrastructure.service.CacheService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthCheckController {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private CacheService cacheService;

    @Autowired
    private ConfigurationService configurationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("version", "1.0.0");
        health.put("timestamp", LocalDateTime.now());

        boolean dbHealthy = checkDatabaseHealth();
        health.put("database", dbHealthy ? "UP" : "DOWN");

        boolean redisHealthy = checkRedisHealth();
        health.put("redis", redisHealthy ? "UP" : "DOWN");

        boolean overallHealthy = dbHealthy && redisHealthy;
        health.put("status", overallHealthy ? "UP" : "DOWN");

        return ResponseEntity.ok(health);
    }

    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("timestamp", LocalDateTime.now());

        Map<String, Object> dbHealth = new HashMap<>();
        boolean dbHealthy = checkDatabaseHealth();
        dbHealth.put("status", dbHealthy ? "UP" : "DOWN");
        if (dbHealthy) {
            dbHealth.put("connectionPool", getConnectionPoolInfo());
        }
        health.put("database", dbHealth);

        Map<String, Object> redisHealth = new HashMap<>();
        boolean redisHealthy = checkRedisHealth();
        redisHealth.put("status", redisHealthy ? "UP" : "DOWN");
        if (redisHealthy) {
            CacheService.CacheStats cacheStats = cacheService.getCacheStats();
            redisHealth.put("cacheStats", Map.of(
                    "keyCount", cacheStats.getKeyCount(),
                    "timestamp", cacheStats.getTimestamp()
            ));
        }
        health.put("redis", redisHealth);

        ConfigurationService.ConfigurationSnapshot configSnapshot = configurationService.getConfigurationSnapshot();
        health.put("configuration", Map.of(
                "settingsCount", configSnapshot.getConfig().size(),
                "lastRefresh", configSnapshot.getTimestamp(),
                "environment", configSnapshot.getEnvironment()
        ));

        health.put("performance", Map.of(
                "maxConcurrentSessions", configurationService.getMaxConcurrentSessions(),
                "questionCacheSize", configurationService.getQuestionCacheSize(),
                "featureFlags", Map.of(
                        "advancedAnalytics", configurationService.isFeatureEnabled("advanced_analytics"),
                        "realTimeNotifications", configurationService.isFeatureEnabled("real_time_notifications"),
                        "aiQuestionGeneration", configurationService.isFeatureEnabled("ai_question_generation")
                )
        ));

        return ResponseEntity.ok(health);
    }

    @GetMapping("/readiness")
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> readiness = new HashMap<>();

        boolean dbReady = checkDatabaseHealth();
        boolean redisReady = checkRedisHealth();
        boolean configReady = configurationService != null;

        boolean overallReady = dbReady && redisReady && configReady;

        readiness.put("status", overallReady ? "READY" : "NOT_READY");
        readiness.put("timestamp", LocalDateTime.now());
        readiness.put("checks", Map.of(
                "database", dbReady ? "READY" : "NOT_READY",
                "redis", redisReady ? "READY" : "NOT_READY",
                "configuration", configReady ? "READY" : "NOT_READY"
        ));

        return ResponseEntity.ok(readiness);
    }

    @GetMapping("/liveness")
    public ResponseEntity<Map<String, Object>> liveness() {
        Map<String, Object> liveness = new HashMap<>();
        liveness.put("status", "ALIVE");
        liveness.put("timestamp", LocalDateTime.now());
        liveness.put("uptime", System.currentTimeMillis() - startTime);

        return ResponseEntity.ok(liveness);
    }

    private boolean checkDatabaseHealth() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(5);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean checkRedisHealth() {
        try {
            cacheService.exists("health-check");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Map<String, Object> getConnectionPoolInfo() {
        return Map.of(
                "activeConnections", 0,
                "idleConnections", 0,
                "maxConnections", 10
        );
    }

    private static final long startTime = System.currentTimeMillis();
}
