package com.biblequiz.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class ConfigurationService {
    
    private static final Logger logger = LoggerFactory.getLogger(ConfigurationService.class);
    
    private final ConcurrentHashMap<String, Object> dynamicConfig = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    // Application configuration
    @Value("${app.name:biblequiz}")
    private String appName;
    
    @Value("${app.version:1.0.0}")
    private String appVersion;
    
    @Value("${app.environment:development}")
    private String environment;
    
    // Database configuration
    @Value("${spring.datasource.url}")
    private String databaseUrl;
    
    @Value("${spring.datasource.username}")
    private String databaseUsername;
    
    // Redis configuration
    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;
    
    @Value("${spring.data.redis.port:6379}")
    private int redisPort;
    
    // Security configuration (align with application-docker.yml: jwt.*)
    @Value("${jwt.secret:}")
    private String jwtSecret;
    
    @Value("${jwt.expiration:900000}")
    private long jwtExpiration;
    
    // Performance configuration
    @Value("${app.performance.cache.ttl:1800}")
    private long cacheTtl;
    
    @Value("${app.performance.rate-limit.requests:1000}")
    private int rateLimitRequests;
    
    @Value("${app.performance.rate-limit.window:3600}")
    private long rateLimitWindow;
    
    public ConfigurationService() {
        // Initialize dynamic configuration
        initializeDynamicConfig();
        
        // Start configuration refresh scheduler
        scheduler.scheduleAtFixedRate(this::refreshConfiguration, 300, 300, TimeUnit.SECONDS);
    }
    
    private void initializeDynamicConfig() {
        putConfig("app.name", appName);
        putConfig("app.version", appVersion);
        putConfig("app.environment", environment);
        putConfig("database.url", databaseUrl);
        putConfig("database.username", databaseUsername);
        putConfig("redis.host", redisHost);
        putConfig("redis.port", redisPort);
        putConfig("security.jwt.secret", jwtSecret);
        putConfig("security.jwt.expiration", jwtExpiration);
        putConfig("performance.cache.ttl", cacheTtl);
        putConfig("performance.rate-limit.requests", rateLimitRequests);
        putConfig("performance.rate-limit.window", rateLimitWindow);
        
        // Dynamic configuration that can be updated at runtime
        putConfig("feature.flags.advanced_analytics", false);
        putConfig("feature.flags.real_time_notifications", true);
        putConfig("feature.flags.ai_question_generation", true);
        putConfig("performance.max_concurrent_sessions", 1000);
        putConfig("performance.question_cache_size", 10000);
        putConfig("security.max_login_attempts", 5);
        putConfig("security.session_timeout", 1800);
        
        logger.info("Initialized configuration service with {} settings", dynamicConfig.size());
    }
    
    public Object getConfig(String key) {
        return dynamicConfig.get(key);
    }
    
    public String getStringConfig(String key, String defaultValue) {
        Object value = dynamicConfig.get(key);
        return value != null ? value.toString() : defaultValue;
    }
    
    public int getIntConfig(String key, int defaultValue) {
        Object value = dynamicConfig.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }
    
    public boolean getBooleanConfig(String key, boolean defaultValue) {
        Object value = dynamicConfig.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return defaultValue;
    }
    
    public void updateConfig(String key, Object value) {
        dynamicConfig.put(key, value);
        logger.info("Updated configuration: {} = {}", key, value);
        
        // Notify configuration change
        notifyConfigurationChange(key, value);
    }
    
    public void removeConfig(String key) {
        dynamicConfig.remove(key);
        logger.info("Removed configuration: {}", key);
    }
    
    public ConfigurationSnapshot getConfigurationSnapshot() {
        return new ConfigurationSnapshot(
                new ConcurrentHashMap<>(dynamicConfig),
                LocalDateTime.now(),
                appName,
                appVersion,
                environment
        );
    }
    
    private void refreshConfiguration() {
        // In a real application, this would fetch configuration from a central config server
        // For now, we'll just log the refresh
        logger.debug("Refreshing configuration from central server");
        
        // Simulate configuration updates
        updateConfig("last_refresh", LocalDateTime.now());
    }
    
    private void notifyConfigurationChange(String key, Object value) {
        // In a real application, this would notify other services about configuration changes
        logger.info("Configuration change notification: {} = {}", key, value);
    }
    
    // Feature flags
    public boolean isFeatureEnabled(String featureName) {
        return getBooleanConfig("feature.flags." + featureName, false);
    }
    
    public void enableFeature(String featureName) {
        updateConfig("feature.flags." + featureName, true);
    }
    
    public void disableFeature(String featureName) {
        updateConfig("feature.flags." + featureName, false);
    }

    private void putConfig(String key, Object value) {
        if (value != null) {
            dynamicConfig.put(key, value);
        } else {
            logger.warn("Configuration value for '{}' is null; skipping", key);
        }
    }
    
    // Performance settings
    public int getMaxConcurrentSessions() {
        return getIntConfig("performance.max_concurrent_sessions", 1000);
    }
    
    public int getQuestionCacheSize() {
        return getIntConfig("performance.question_cache_size", 10000);
    }
    
    // Security settings
    public int getMaxLoginAttempts() {
        return getIntConfig("security.max_login_attempts", 5);
    }
    
    public int getSessionTimeout() {
        return getIntConfig("security.session_timeout", 1800);
    }
    
    public static class ConfigurationSnapshot {
        private final ConcurrentHashMap<String, Object> config;
        private final LocalDateTime timestamp;
        private final String appName;
        private final String appVersion;
        private final String environment;
        
        public ConfigurationSnapshot(ConcurrentHashMap<String, Object> config, LocalDateTime timestamp, 
                                   String appName, String appVersion, String environment) {
            this.config = config;
            this.timestamp = timestamp;
            this.appName = appName;
            this.appVersion = appVersion;
            this.environment = environment;
        }
        
        public ConcurrentHashMap<String, Object> getConfig() { return config; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public String getAppName() { return appName; }
        public String getAppVersion() { return appVersion; }
        public String getEnvironment() { return environment; }
    }
}
