package com.biblequiz.discovery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class ServiceRegistry {
    
    private static final Logger logger = LoggerFactory.getLogger(ServiceRegistry.class);
    
    private final ConcurrentHashMap<String, ServiceInstance> services = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    public ServiceRegistry() {
        // Start health check scheduler
        scheduler.scheduleAtFixedRate(this::performHealthChecks, 30, 30, TimeUnit.SECONDS);
    }
    
    public void registerService(String serviceName, String host, int port, String healthEndpoint) {
        ServiceInstance instance = new ServiceInstance(serviceName, host, port, healthEndpoint);
        services.put(serviceName, instance);
        logger.info("Registered service: {} at {}:{}", serviceName, host, port);
    }
    
    public ServiceInstance getService(String serviceName) {
        ServiceInstance instance = services.get(serviceName);
        if (instance != null && instance.isHealthy()) {
            return instance;
        }
        return null;
    }
    
    public void deregisterService(String serviceName) {
        services.remove(serviceName);
        logger.info("Deregistered service: {}", serviceName);
    }
    
    public void markServiceUnhealthy(String serviceName) {
        ServiceInstance instance = services.get(serviceName);
        if (instance != null) {
            instance.setHealthy(false);
            logger.warn("Marked service as unhealthy: {}", serviceName);
        }
    }
    
    public void markServiceHealthy(String serviceName) {
        ServiceInstance instance = services.get(serviceName);
        if (instance != null) {
            instance.setHealthy(true);
            instance.setLastHealthCheck(LocalDateTime.now());
            logger.info("Marked service as healthy: {}", serviceName);
        }
    }
    
    private void performHealthChecks() {
        services.values().forEach(instance -> {
            try {
                // Perform health check
                boolean isHealthy = checkServiceHealth(instance);
                instance.setHealthy(isHealthy);
                instance.setLastHealthCheck(LocalDateTime.now());
                
                if (!isHealthy) {
                    logger.warn("Health check failed for service: {} at {}:{}", 
                            instance.getServiceName(), instance.getHost(), instance.getPort());
                }
            } catch (Exception e) {
                logger.error("Health check error for service: {}", instance.getServiceName(), e);
                instance.setHealthy(false);
            }
        });
    }
    
    private boolean checkServiceHealth(ServiceInstance instance) {
        try {
            // Simple HTTP health check
            java.net.URL url = new java.net.URL("http://" + instance.getHost() + ":" + instance.getPort() + instance.getHealthEndpoint());
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            
            int responseCode = connection.getResponseCode();
            return responseCode >= 200 && responseCode < 300;
        } catch (Exception e) {
            return false;
        }
    }
    
    public ServiceRegistryInfo getRegistryInfo() {
        return new ServiceRegistryInfo(
                services.size(),
                (int) services.values().stream().filter(ServiceInstance::isHealthy).count(),
                LocalDateTime.now()
        );
    }
    
    public static class ServiceInstance {
        private final String serviceName;
        private final String host;
        private final int port;
        private final String healthEndpoint;
        private boolean healthy = true;
        private LocalDateTime lastHealthCheck = LocalDateTime.now();
        private LocalDateTime registrationTime = LocalDateTime.now();
        
        public ServiceInstance(String serviceName, String host, int port, String healthEndpoint) {
            this.serviceName = serviceName;
            this.host = host;
            this.port = port;
            this.healthEndpoint = healthEndpoint;
        }
        
        public String getServiceName() { return serviceName; }
        public String getHost() { return host; }
        public int getPort() { return port; }
        public String getHealthEndpoint() { return healthEndpoint; }
        public boolean isHealthy() { return healthy; }
        public void setHealthy(boolean healthy) { this.healthy = healthy; }
        public LocalDateTime getLastHealthCheck() { return lastHealthCheck; }
        public void setLastHealthCheck(LocalDateTime lastHealthCheck) { this.lastHealthCheck = lastHealthCheck; }
        public LocalDateTime getRegistrationTime() { return registrationTime; }
        
        public String getUrl() {
            return "http://" + host + ":" + port;
        }
    }
    
    public static class ServiceRegistryInfo {
        private final int totalServices;
        private final int healthyServices;
        private final LocalDateTime timestamp;
        
        public ServiceRegistryInfo(int totalServices, int healthyServices, LocalDateTime timestamp) {
            this.totalServices = totalServices;
            this.healthyServices = healthyServices;
            this.timestamp = timestamp;
        }
        
        public int getTotalServices() { return totalServices; }
        public int getHealthyServices() { return healthyServices; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
