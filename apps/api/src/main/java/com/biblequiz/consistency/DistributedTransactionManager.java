package com.biblequiz.consistency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Distributed Transaction Manager for ensuring data consistency across services
 * 
 * This service implements the Saga pattern for managing distributed transactions
 * and ensures eventual consistency across microservices.
 */
@Service
public class DistributedTransactionManager {
    
    private static final Logger logger = LoggerFactory.getLogger(DistributedTransactionManager.class);
    
    private final Map<String, SagaTransaction> activeTransactions = new ConcurrentHashMap<>();
    private final AtomicInteger transactionCounter = new AtomicInteger(0);
    
    /**
     * Start a new distributed transaction
     */
    public String startTransaction(String transactionType) {
        String transactionId = generateTransactionId();
        SagaTransaction transaction = new SagaTransaction(transactionId, transactionType);
        activeTransactions.put(transactionId, transaction);
        
        logger.info("Started distributed transaction: {} of type: {}", transactionId, transactionType);
        return transactionId;
    }
    
    /**
     * Add a step to the transaction
     */
    public void addStep(String transactionId, String stepName, TransactionStep step) {
        SagaTransaction transaction = activeTransactions.get(transactionId);
        if (transaction != null) {
            transaction.addStep(stepName, step);
            logger.debug("Added step {} to transaction {}", stepName, transactionId);
        } else {
            throw new TransactionException("Transaction not found: " + transactionId);
        }
    }
    
    /**
     * Execute the distributed transaction
     */
    public CompletableFuture<TransactionResult> executeTransaction(String transactionId) {
        SagaTransaction transaction = activeTransactions.get(transactionId);
        if (transaction == null) {
            return CompletableFuture.completedFuture(
                TransactionResult.failure("Transaction not found: " + transactionId)
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                return executeSaga(transaction);
            } catch (Exception e) {
                logger.error("Transaction execution failed: {}", transactionId, e);
                return TransactionResult.failure("Transaction execution failed: " + e.getMessage());
            } finally {
                activeTransactions.remove(transactionId);
            }
        });
    }
    
    /**
     * Execute Saga pattern
     */
    private TransactionResult executeSaga(SagaTransaction transaction) {
        List<TransactionStep> steps = transaction.getSteps();
        List<TransactionStep> executedSteps = new ArrayList<>();
        
        try {
            // Execute all steps in order
            for (TransactionStep step : steps) {
                logger.debug("Executing step: {} in transaction: {}", step.getName(), transaction.getId());
                
                TransactionStepResult result = step.execute();
                if (!result.isSuccess()) {
                    logger.warn("Step failed: {} in transaction: {}, rolling back", 
                            step.getName(), transaction.getId());
                    return rollbackTransaction(transaction, executedSteps);
                }
                
                executedSteps.add(step);
            }
            
            logger.info("Transaction completed successfully: {}", transaction.getId());
            return TransactionResult.success("Transaction completed successfully");
            
        } catch (Exception e) {
            logger.error("Transaction failed: {}", transaction.getId(), e);
            return rollbackTransaction(transaction, executedSteps);
        }
    }
    
    /**
     * Rollback transaction
     */
    private TransactionResult rollbackTransaction(SagaTransaction transaction, List<TransactionStep> executedSteps) {
        logger.info("Rolling back transaction: {}", transaction.getId());
        
        // Execute rollback in reverse order
        Collections.reverse(executedSteps);
        
        for (TransactionStep step : executedSteps) {
            try {
                logger.debug("Rolling back step: {} in transaction: {}", step.getName(), transaction.getId());
                step.rollback();
            } catch (Exception e) {
                logger.error("Rollback failed for step: {} in transaction: {}", 
                        step.getName(), transaction.getId(), e);
                // Continue with other rollbacks even if one fails
            }
        }
        
        return TransactionResult.failure("Transaction rolled back due to step failure");
    }
    
    /**
     * Get transaction status
     */
    public TransactionStatus getTransactionStatus(String transactionId) {
        SagaTransaction transaction = activeTransactions.get(transactionId);
        if (transaction == null) {
            return TransactionStatus.NOT_FOUND;
        }
        return transaction.getStatus();
    }
    
    /**
     * Cancel a transaction
     */
    public void cancelTransaction(String transactionId) {
        SagaTransaction transaction = activeTransactions.get(transactionId);
        if (transaction != null) {
            transaction.setStatus(TransactionStatus.CANCELLED);
            activeTransactions.remove(transactionId);
            logger.info("Cancelled transaction: {}", transactionId);
        }
    }
    
    /**
     * Get all active transactions
     */
    public List<TransactionInfo> getActiveTransactions() {
        return activeTransactions.values().stream()
                .map(transaction -> new TransactionInfo(
                        transaction.getId(),
                        transaction.getType(),
                        transaction.getStatus(),
                        transaction.getCreatedAt(),
                        transaction.getSteps().size()
                ))
                .toList();
    }
    
    private String generateTransactionId() {
        return "txn_" + System.currentTimeMillis() + "_" + transactionCounter.incrementAndGet();
    }
    
    /**
     * Transaction Step Interface
     */
    public interface TransactionStep {
        String getName();
        TransactionStepResult execute();
        void rollback();
    }
    
    /**
     * Transaction Step Result
     */
    public static class TransactionStepResult {
        private final boolean success;
        private final String message;
        private final Object data;
        
        public TransactionStepResult(boolean success, String message, Object data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }
        
        public static TransactionStepResult success(String message, Object data) {
            return new TransactionStepResult(true, message, data);
        }
        
        public static TransactionStepResult success(String message) {
            return new TransactionStepResult(true, message, null);
        }
        
        public static TransactionStepResult failure(String message) {
            return new TransactionStepResult(false, message, null);
        }
        
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public Object getData() { return data; }
    }
    
    /**
     * Transaction Result
     */
    public static class TransactionResult {
        private final boolean success;
        private final String message;
        private final Object data;
        
        public TransactionResult(boolean success, String message, Object data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }
        
        public static TransactionResult success(String message, Object data) {
            return new TransactionResult(true, message, data);
        }
        
        public static TransactionResult success(String message) {
            return new TransactionResult(true, message, null);
        }
        
        public static TransactionResult failure(String message) {
            return new TransactionResult(false, message, null);
        }
        
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public Object getData() { return data; }
    }
    
    /**
     * Transaction Status
     */
    public enum TransactionStatus {
        PENDING, EXECUTING, COMPLETED, FAILED, CANCELLED, NOT_FOUND
    }
    
    /**
     * Saga Transaction
     */
    public static class SagaTransaction {
        private final String id;
        private final String type;
        private final LocalDateTime createdAt;
        private final List<TransactionStep> steps;
        private TransactionStatus status;
        
        public SagaTransaction(String id, String type) {
            this.id = id;
            this.type = type;
            this.createdAt = LocalDateTime.now();
            this.steps = new ArrayList<>();
            this.status = TransactionStatus.PENDING;
        }
        
        public void addStep(String stepName, TransactionStep step) {
            steps.add(step);
        }
        
        public String getId() { return id; }
        public String getType() { return type; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public List<TransactionStep> getSteps() { return steps; }
        public TransactionStatus getStatus() { return status; }
        public void setStatus(TransactionStatus status) { this.status = status; }
    }
    
    /**
     * Transaction Info
     */
    public static class TransactionInfo {
        private final String id;
        private final String type;
        private final TransactionStatus status;
        private final LocalDateTime createdAt;
        private final int stepCount;
        
        public TransactionInfo(String id, String type, TransactionStatus status, 
                             LocalDateTime createdAt, int stepCount) {
            this.id = id;
            this.type = type;
            this.status = status;
            this.createdAt = createdAt;
            this.stepCount = stepCount;
        }
        
        public String getId() { return id; }
        public String getType() { return type; }
        public TransactionStatus getStatus() { return status; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public int getStepCount() { return stepCount; }
    }
    
    /**
     * Transaction Exception
     */
    public static class TransactionException extends RuntimeException {
        public TransactionException(String message) {
            super(message);
        }
    }
}
