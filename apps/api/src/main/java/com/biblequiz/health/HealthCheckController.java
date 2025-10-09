package com.biblequiz.health;

import com.biblequiz.config.ConfigurationService;
import com.biblequiz.discovery.ServiceRegistry;
import com.biblequiz.service.CacheService;
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
    private ServiceRegistry serviceRegistry;
    
    @Autowired
    private ConfigurationService configurationService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now());
        health.put("version", "1.0.0");
        
        // Check database connectivity
        boolean dbHealthy = checkDatabaseHealth();
        health.put("database", dbHealthy ? "UP" : "DOWN");
        
        // Check Redis connectivity
        boolean redisHealthy = checkRedisHealth();
        health.put("redis", redisHealthy ? "UP" : "DOWN");
        
        // Check service registry
        ServiceRegistry.ServiceRegistryInfo registryInfo = serviceRegistry.getRegistryInfo();
        health.put("serviceRegistry", Map.of(
                "totalServices", registryInfo.getTotalServices(),
                "healthyServices", registryInfo.getHealthyServices(),
                "status", registryInfo.getHealthyServices() > 0 ? "UP" : "DOWN"
        ));
        
        // Overall health status
        boolean overallHealthy = dbHealthy && redisHealthy;
        health.put("status", overallHealthy ? "UP" : "DOWN");
        
        return ResponseEntity.ok(health);
    }
    
    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("timestamp", LocalDateTime.now());
        
        // Database health
        Map<String, Object> dbHealth = new HashMap<>();
        boolean dbHealthy = checkDatabaseHealth();
        dbHealth.put("status", dbHealthy ? "UP" : "DOWN");
        if (dbHealthy) {
            dbHealth.put("connectionPool", getConnectionPoolInfo());
        }
        health.put("database", dbHealth);
        
        // Redis health
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
        
        // Service registry health
        ServiceRegistry.ServiceRegistryInfo registryInfo = serviceRegistry.getRegistryInfo();
        health.put("serviceRegistry", Map.of(
                "totalServices", registryInfo.getTotalServices(),
                "healthyServices", registryInfo.getHealthyServices(),
                "status", registryInfo.getHealthyServices() > 0 ? "UP" : "DOWN"
        ));
        
        // Configuration health
        ConfigurationService.ConfigurationSnapshot configSnapshot = configurationService.getConfigurationSnapshot();
        health.put("configuration", Map.of(
                "settingsCount", configSnapshot.getConfig().size(),
                "lastRefresh", configSnapshot.getTimestamp(),
                "environment", configSnapshot.getEnvironment()
        ));
        
        // Performance metrics
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
        liveness.put("uptime", System.currentTimeMillis() - getStartTime());
        
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
        // This would require a connection pool implementation
        // For now, return basic info
        return Map.of(
                "activeConnections", 0,
                "idleConnections", 0,
                "maxConnections", 10
        );
    }
    
    private static final long startTime = System.currentTimeMillis();
    
    private long getStartTime() {
        return startTime;
    }
}
