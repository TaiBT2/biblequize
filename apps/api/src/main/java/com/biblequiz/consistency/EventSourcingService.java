package com.biblequiz.consistency;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Event Sourcing Service for maintaining data consistency
 * 
 * This service implements event sourcing pattern to ensure
 * data consistency across services and provide audit trail.
 */
@Service
public class EventSourcingService {
    
    private static final Logger logger = LoggerFactory.getLogger(EventSourcingService.class);
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private final Map<String, List<DomainEvent>> eventStore = new ConcurrentHashMap<>();
    private final AtomicLong eventIdCounter = new AtomicLong(0);
    
    /**
     * Store a domain event
     */
    public void storeEvent(String aggregateId, DomainEvent event) {
        event.setEventId(generateEventId());
        event.setTimestamp(LocalDateTime.now());
        
        eventStore.computeIfAbsent(aggregateId, k -> new ArrayList<>()).add(event);
        
        logger.debug("Stored event: {} for aggregate: {}", event.getEventType(), aggregateId);
        
        // Publish event for other services
        publishEvent(aggregateId, event);
    }
    
    /**
     * Get all events for an aggregate
     */
    public List<DomainEvent> getEvents(String aggregateId) {
        return eventStore.getOrDefault(aggregateId, new ArrayList<>());
    }
    
    /**
     * Get events from a specific version
     */
    public List<DomainEvent> getEventsFromVersion(String aggregateId, long fromVersion) {
        return eventStore.getOrDefault(aggregateId, new ArrayList<>())
                .stream()
                .filter(event -> event.getVersion() > fromVersion)
                .toList();
    }
    
    /**
     * Replay events to rebuild aggregate state
     */
    public <T> T replayEvents(String aggregateId, Class<T> aggregateType) {
        List<DomainEvent> events = getEvents(aggregateId);
        
        try {
            T aggregate = aggregateType.getDeclaredConstructor().newInstance();
            
            for (DomainEvent event : events) {
                applyEvent(aggregate, event);
            }
            
            return aggregate;
        } catch (Exception e) {
            logger.error("Failed to replay events for aggregate: {}", aggregateId, e);
            throw new EventSourcingException("Failed to replay events", e);
        }
    }
    
    /**
     * Create a snapshot of aggregate state
     */
    public void createSnapshot(String aggregateId, Object aggregateState) {
        try {
            SnapshotEvent snapshot = new SnapshotEvent(
                    generateEventId(),
                    aggregateId,
                    "SNAPSHOT",
                    objectMapper.writeValueAsString(aggregateState),
                    LocalDateTime.now()
            );
            
            storeEvent(aggregateId, snapshot);
            logger.info("Created snapshot for aggregate: {}", aggregateId);
            
        } catch (Exception e) {
            logger.error("Failed to create snapshot for aggregate: {}", aggregateId, e);
        }
    }
    
    /**
     * Get the latest snapshot for an aggregate
     */
    public Optional<SnapshotEvent> getLatestSnapshot(String aggregateId) {
        return eventStore.getOrDefault(aggregateId, new ArrayList<>())
                .stream()
                .filter(event -> event instanceof SnapshotEvent)
                .map(event -> (SnapshotEvent) event)
                .max(Comparator.comparing(DomainEvent::getVersion));
    }
    
    /**
     * Rebuild aggregate from snapshot and events
     */
    public <T> T rebuildFromSnapshot(String aggregateId, Class<T> aggregateType) {
        Optional<SnapshotEvent> snapshot = getLatestSnapshot(aggregateId);
        
        if (snapshot.isPresent()) {
            try {
                T aggregate = objectMapper.readValue(snapshot.get().getData(), aggregateType);
                
                // Apply events after snapshot
                long snapshotVersion = snapshot.get().getVersion();
                List<DomainEvent> eventsAfterSnapshot = getEventsFromVersion(aggregateId, snapshotVersion);
                
                for (DomainEvent event : eventsAfterSnapshot) {
                    applyEvent(aggregate, event);
                }
                
                return aggregate;
            } catch (Exception e) {
                logger.error("Failed to rebuild from snapshot for aggregate: {}", aggregateId, e);
            }
        }
        
        // Fallback to full replay
        return replayEvents(aggregateId, aggregateType);
    }
    
    /**
     * Apply event to aggregate
     */
    private void applyEvent(Object aggregate, DomainEvent event) {
        try {
            // Use reflection to call event handler method
            String methodName = "handle" + event.getEventType();
            aggregate.getClass().getMethod(methodName, DomainEvent.class).invoke(aggregate, event);
        } catch (Exception e) {
            logger.warn("No handler found for event type: {}", event.getEventType());
        }
    }
    
    /**
     * Publish event for other services
     */
    private void publishEvent(String aggregateId, DomainEvent event) {
        // In a real implementation, this would publish to a message broker
        logger.debug("Publishing event: {} for aggregate: {}", event.getEventType(), aggregateId);
    }
    
    /**
     * Get event statistics
     */
    public EventStatistics getEventStatistics() {
        int totalEvents = eventStore.values().stream()
                .mapToInt(List::size)
                .sum();
        
        int totalAggregates = eventStore.size();
        
        return new EventStatistics(totalEvents, totalAggregates, LocalDateTime.now());
    }
    
    private String generateEventId() {
        return "evt_" + System.currentTimeMillis() + "_" + eventIdCounter.incrementAndGet();
    }
    
    /**
     * Domain Event
     */
    public static class DomainEvent {
        private String eventId;
        private String aggregateId;
        private String eventType;
        private String data;
        private LocalDateTime timestamp;
        private long version;
        
        public DomainEvent() {}
        
        public DomainEvent(String eventId, String aggregateId, String eventType, String data, LocalDateTime timestamp) {
            this.eventId = eventId;
            this.aggregateId = aggregateId;
            this.eventType = eventType;
            this.data = data;
            this.timestamp = timestamp;
        }
        
        // Getters and setters
        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }
        public String getAggregateId() { return aggregateId; }
        public void setAggregateId(String aggregateId) { this.aggregateId = aggregateId; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getData() { return data; }
        public void setData(String data) { this.data = data; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        public long getVersion() { return version; }
        public void setVersion(long version) { this.version = version; }
    }
    
    /**
     * Snapshot Event
     */
    public static class SnapshotEvent extends DomainEvent {
        public SnapshotEvent(String eventId, String aggregateId, String eventType, String data, LocalDateTime timestamp) {
            super(eventId, aggregateId, eventType, data, timestamp);
        }
    }
    
    /**
     * Event Statistics
     */
    public static class EventStatistics {
        private final int totalEvents;
        private final int totalAggregates;
        private final LocalDateTime timestamp;
        
        public EventStatistics(int totalEvents, int totalAggregates, LocalDateTime timestamp) {
            this.totalEvents = totalEvents;
            this.totalAggregates = totalAggregates;
            this.timestamp = timestamp;
        }
        
        public int getTotalEvents() { return totalEvents; }
        public int getTotalAggregates() { return totalAggregates; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
    
    /**
     * Event Sourcing Exception
     */
    public static class EventSourcingException extends RuntimeException {
        public EventSourcingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
