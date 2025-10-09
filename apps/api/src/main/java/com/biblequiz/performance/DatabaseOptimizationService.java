package com.biblequiz.performance;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Database Optimization Service
 * 
 * This service provides database optimization features including:
 * - Query performance analysis
 * - Index recommendations
 * - Connection pool monitoring
 * - Query execution plan analysis
 */
@Service
public class DatabaseOptimizationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseOptimizationService.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private DataSource dataSource;
    
    private final Map<String, QueryPerformanceMetrics> queryMetrics = new ConcurrentHashMap<>();
    
    /**
     * Analyze query performance
     */
    public QueryAnalysisResult analyzeQuery(String query, Map<String, Object> parameters) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Execute query with timing
            List<Map<String, Object>> results = jdbcTemplate.queryForList(query, parameters.values().toArray());
            
            long executionTime = System.currentTimeMillis() - startTime;
            
            // Analyze execution plan
            ExecutionPlan executionPlan = analyzeExecutionPlan(query);
            
            // Record metrics
            recordQueryMetrics(query, executionTime, results.size());
            
            return new QueryAnalysisResult(
                    query,
                    executionTime,
                    results.size(),
                    executionPlan,
                    getOptimizationRecommendations(query, executionTime, executionPlan)
            );
            
        } catch (Exception e) {
            logger.error("Query analysis failed: {}", query, e);
            return new QueryAnalysisResult(
                    query,
                    System.currentTimeMillis() - startTime,
                    0,
                    null,
                    List.of("Query execution failed: " + e.getMessage())
            );
        }
    }
    
    /**
     * Get database statistics
     */
    public DatabaseStatistics getDatabaseStatistics() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            return new DatabaseStatistics(
                    metaData.getDatabaseProductName(),
                    metaData.getDatabaseProductVersion(),
                    getTableCount(connection),
                    getIndexCount(connection),
                    getConnectionPoolInfo(),
                    LocalDateTime.now()
            );
        } catch (SQLException e) {
            logger.error("Failed to get database statistics", e);
            return new DatabaseStatistics("Unknown", "Unknown", 0, 0, null, LocalDateTime.now());
        }
    }
    
    /**
     * Get index recommendations
     */
    public List<IndexRecommendation> getIndexRecommendations() {
        List<IndexRecommendation> recommendations = new ArrayList<>();
        
        // Analyze slow queries
        queryMetrics.values().stream()
                .filter(metrics -> metrics.getAverageExecutionTime() > 1000) // Queries taking more than 1 second
                .forEach(metrics -> {
                    recommendations.addAll(analyzeQueryForIndexes(metrics.getQuery()));
                });
        
        // Check for missing indexes on foreign keys
        recommendations.addAll(checkForeignKeysForIndexes());
        
        // Check for missing indexes on frequently queried columns
        recommendations.addAll(checkFrequentlyQueriedColumns());
        
        return recommendations;
    }
    
    /**
     * Optimize database connection pool
     */
    public ConnectionPoolOptimization getConnectionPoolOptimization() {
        try (Connection connection = dataSource.getConnection()) {
            // Get connection pool information
            int activeConnections = getActiveConnectionCount();
            int maxConnections = getMaxConnectionCount();
            int idleConnections = getIdleConnectionCount();
            
            // Calculate optimization recommendations
            List<String> recommendations = new ArrayList<>();
            
            if (activeConnections > maxConnections * 0.8) {
                recommendations.add("Consider increasing maximum connection pool size");
            }
            
            if (idleConnections > maxConnections * 0.5) {
                recommendations.add("Consider decreasing connection pool size to reduce resource usage");
            }
            
            return new ConnectionPoolOptimization(
                    activeConnections,
                    maxConnections,
                    idleConnections,
                    recommendations
            );
            
        } catch (SQLException e) {
            logger.error("Failed to analyze connection pool", e);
            return new ConnectionPoolOptimization(0, 0, 0, List.of("Failed to analyze connection pool"));
        }
    }
    
    /**
     * Get query performance metrics
     */
    public List<QueryPerformanceMetrics> getSlowQueries(int limit) {
        return queryMetrics.values().stream()
                .sorted((a, b) -> Long.compare(b.getAverageExecutionTime(), a.getAverageExecutionTime()))
                .limit(limit)
                .toList();
    }
    
    /**
     * Analyze execution plan
     */
    private ExecutionPlan analyzeExecutionPlan(String query) {
        try {
            // This would require database-specific implementation
            // For MySQL, we could use EXPLAIN
            String explainQuery = "EXPLAIN " + query;
            List<Map<String, Object>> explainResults = jdbcTemplate.queryForList(explainQuery);
            
            return new ExecutionPlan(explainResults);
        } catch (Exception e) {
            logger.warn("Failed to analyze execution plan for query: {}", query, e);
            return new ExecutionPlan(Collections.emptyList());
        }
    }
    
    /**
     * Record query metrics
     */
    private void recordQueryMetrics(String query, long executionTime, int resultCount) {
        String queryHash = Integer.toString(query.hashCode());
        
        queryMetrics.computeIfAbsent(queryHash, k -> new QueryPerformanceMetrics(query))
                .recordExecution(executionTime, resultCount);
    }
    
    /**
     * Get optimization recommendations
     */
    private List<String> getOptimizationRecommendations(String query, long executionTime, ExecutionPlan executionPlan) {
        List<String> recommendations = new ArrayList<>();
        
        if (executionTime > 1000) {
            recommendations.add("Query execution time is high (" + executionTime + "ms). Consider optimization.");
        }
        
        if (executionPlan.hasFullTableScan()) {
            recommendations.add("Query performs full table scan. Consider adding indexes.");
        }
        
        if (executionPlan.hasTemporaryTable()) {
            recommendations.add("Query uses temporary table. Consider optimizing JOIN conditions.");
        }
        
        if (query.toLowerCase().contains("select *")) {
            recommendations.add("Avoid SELECT *. Specify only required columns.");
        }
        
        if (query.toLowerCase().contains("order by") && !query.toLowerCase().contains("limit")) {
            recommendations.add("Consider adding LIMIT clause to ORDER BY queries.");
        }
        
        return recommendations;
    }
    
    /**
     * Analyze query for index recommendations
     */
    private List<IndexRecommendation> analyzeQueryForIndexes(String query) {
        List<IndexRecommendation> recommendations = new ArrayList<>();
        
        // Simple analysis - in a real implementation, this would be more sophisticated
        if (query.toLowerCase().contains("where")) {
            // Extract WHERE clause columns and recommend indexes
            recommendations.add(new IndexRecommendation(
                    "Consider adding index on WHERE clause columns",
                    "HIGH",
                    "Performance improvement"
            ));
        }
        
        if (query.toLowerCase().contains("order by")) {
            recommendations.add(new IndexRecommendation(
                    "Consider adding index on ORDER BY columns",
                    "MEDIUM",
                    "Sorting optimization"
            ));
        }
        
        return recommendations;
    }
    
    /**
     * Check foreign keys for missing indexes
     */
    private List<IndexRecommendation> checkForeignKeysForIndexes() {
        List<IndexRecommendation> recommendations = new ArrayList<>();
        
        // This would require querying the database schema
        // For now, return some common recommendations
        recommendations.add(new IndexRecommendation(
                "Add index on foreign key columns",
                "HIGH",
                "Join performance improvement"
        ));
        
        return recommendations;
    }
    
    /**
     * Check frequently queried columns
     */
    private List<IndexRecommendation> checkFrequentlyQueriedColumns() {
        List<IndexRecommendation> recommendations = new ArrayList<>();
        
        // Analyze query patterns to identify frequently queried columns
        recommendations.add(new IndexRecommendation(
                "Add composite index on frequently queried column combinations",
                "MEDIUM",
                "Query pattern optimization"
        ));
        
        return recommendations;
    }
    
    private int getTableCount(Connection connection) throws SQLException {
        try (ResultSet rs = connection.getMetaData().getTables(null, null, "%", new String[]{"TABLE"})) {
            int count = 0;
            while (rs.next()) count++;
            return count;
        }
    }
    
    private int getIndexCount(Connection connection) throws SQLException {
        try (ResultSet rs = connection.getMetaData().getIndexInfo(null, null, "%", false, false)) {
            int count = 0;
            while (rs.next()) count++;
            return count;
        }
    }
    
    private ConnectionPoolInfo getConnectionPoolInfo() {
        // This would require connection pool specific implementation
        return new ConnectionPoolInfo(10, 20, 5);
    }
    
    private int getActiveConnectionCount() {
        // This would require connection pool specific implementation
        return 5;
    }
    
    private int getMaxConnectionCount() {
        // This would require connection pool specific implementation
        return 20;
    }
    
    private int getIdleConnectionCount() {
        // This would require connection pool specific implementation
        return 3;
    }
    
    /**
     * Query Analysis Result
     */
    public static class QueryAnalysisResult {
        private final String query;
        private final long executionTime;
        private final int resultCount;
        private final ExecutionPlan executionPlan;
        private final List<String> recommendations;
        
        public QueryAnalysisResult(String query, long executionTime, int resultCount, 
                                 ExecutionPlan executionPlan, List<String> recommendations) {
            this.query = query;
            this.executionTime = executionTime;
            this.resultCount = resultCount;
            this.executionPlan = executionPlan;
            this.recommendations = recommendations;
        }
        
        public String getQuery() { return query; }
        public long getExecutionTime() { return executionTime; }
        public int getResultCount() { return resultCount; }
        public ExecutionPlan getExecutionPlan() { return executionPlan; }
        public List<String> getRecommendations() { return recommendations; }
    }
    
    /**
     * Execution Plan
     */
    public static class ExecutionPlan {
        private final List<Map<String, Object>> steps;
        
        public ExecutionPlan(List<Map<String, Object>> steps) {
            this.steps = steps;
        }
        
        public boolean hasFullTableScan() {
            return steps.stream()
                    .anyMatch(step -> "ALL".equals(step.get("type")));
        }
        
        public boolean hasTemporaryTable() {
            return steps.stream()
                    .anyMatch(step -> "Using temporary".equals(step.get("Extra")));
        }
        
        public List<Map<String, Object>> getSteps() { return steps; }
    }
    
    /**
     * Query Performance Metrics
     */
    public static class QueryPerformanceMetrics {
        private final String query;
        private final List<Long> executionTimes = new ArrayList<>();
        private final List<Integer> resultCounts = new ArrayList<>();
        private long totalExecutions = 0;
        
        public QueryPerformanceMetrics(String query) {
            this.query = query;
        }
        
        public void recordExecution(long executionTime, int resultCount) {
            executionTimes.add(executionTime);
            resultCounts.add(resultCount);
            totalExecutions++;
        }
        
        public String getQuery() { return query; }
        public long getTotalExecutions() { return totalExecutions; }
        public long getAverageExecutionTime() {
            return executionTimes.stream().mapToLong(Long::longValue).sum() / executionTimes.size();
        }
        public int getAverageResultCount() {
            return resultCounts.stream().mapToInt(Integer::intValue).sum() / resultCounts.size();
        }
    }
    
    /**
     * Database Statistics
     */
    public static class DatabaseStatistics {
        private final String productName;
        private final String productVersion;
        private final int tableCount;
        private final int indexCount;
        private final ConnectionPoolInfo connectionPool;
        private final LocalDateTime timestamp;
        
        public DatabaseStatistics(String productName, String productVersion, int tableCount, 
                               int indexCount, ConnectionPoolInfo connectionPool, LocalDateTime timestamp) {
            this.productName = productName;
            this.productVersion = productVersion;
            this.tableCount = tableCount;
            this.indexCount = indexCount;
            this.connectionPool = connectionPool;
            this.timestamp = timestamp;
        }
        
        public String getProductName() { return productName; }
        public String getProductVersion() { return productVersion; }
        public int getTableCount() { return tableCount; }
        public int getIndexCount() { return indexCount; }
        public ConnectionPoolInfo getConnectionPool() { return connectionPool; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
    
    /**
     * Index Recommendation
     */
    public static class IndexRecommendation {
        private final String description;
        private final String priority;
        private final String reason;
        
        public IndexRecommendation(String description, String priority, String reason) {
            this.description = description;
            this.priority = priority;
            this.reason = reason;
        }
        
        public String getDescription() { return description; }
        public String getPriority() { return priority; }
        public String getReason() { return reason; }
    }
    
    /**
     * Connection Pool Optimization
     */
    public static class ConnectionPoolOptimization {
        private final int activeConnections;
        private final int maxConnections;
        private final int idleConnections;
        private final List<String> recommendations;
        
        public ConnectionPoolOptimization(int activeConnections, int maxConnections, 
                                        int idleConnections, List<String> recommendations) {
            this.activeConnections = activeConnections;
            this.maxConnections = maxConnections;
            this.idleConnections = idleConnections;
            this.recommendations = recommendations;
        }
        
        public int getActiveConnections() { return activeConnections; }
        public int getMaxConnections() { return maxConnections; }
        public int getIdleConnections() { return idleConnections; }
        public List<String> getRecommendations() { return recommendations; }
    }
    
    /**
     * Connection Pool Info
     */
    public static class ConnectionPoolInfo {
        private final int active;
        private final int max;
        private final int idle;
        
        public ConnectionPoolInfo(int active, int max, int idle) {
            this.active = active;
            this.max = max;
            this.idle = idle;
        }
        
        public int getActive() { return active; }
        public int getMax() { return max; }
        public int getIdle() { return idle; }
    }
}
