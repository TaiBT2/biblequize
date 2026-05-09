package com.biblequiz.modules.room.service;

import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory map of STOMP session → (user email, subscribed rooms). Powers
 * the disconnect-grace logic in {@link RoomPresenceListener}: when a session
 * goes away, we need to know which user/rooms to schedule grace checks for.
 *
 * <p>Single-instance only. For HA (multi-pod), back this with Redis
 * (the project's RedisTemplate already exists). Tracked as Sprint 3 follow-up.
 */
@Component
public class PresenceTracker {

    /** sessionId → (userEmail, set of roomIds subscribed). */
    private final ConcurrentHashMap<String, SessionState> bySession = new ConcurrentHashMap<>();
    /** userEmail → set of sessionIds. Used to answer "did this user reconnect?" */
    private final ConcurrentHashMap<String, Set<String>> byUser = new ConcurrentHashMap<>();

    public void onConnect(String sessionId, String userEmail) {
        bySession.put(sessionId, new SessionState(userEmail, ConcurrentHashMap.newKeySet()));
        byUser.computeIfAbsent(userEmail, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    public void onSubscribe(String sessionId, String roomId) {
        SessionState s = bySession.get(sessionId);
        if (s != null) s.rooms.add(roomId);
    }

    /**
     * Returns the (userEmail, rooms) snapshot for the disconnected session
     * and removes it from tracking. Caller schedules the grace check.
     */
    public Optional<SessionState> onDisconnect(String sessionId) {
        SessionState s = bySession.remove(sessionId);
        if (s == null) return Optional.empty();
        Set<String> sessions = byUser.get(s.userEmail);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) byUser.remove(s.userEmail);
        }
        // Defensive copy so the caller's snapshot isn't aliased to the
        // shared key-set (which we just emptied).
        return Optional.of(new SessionState(s.userEmail, new HashSet<>(s.rooms)));
    }

    /** True if the user still has at least one active STOMP session. */
    public boolean userHasActiveSession(String userEmail) {
        Set<String> sessions = byUser.get(userEmail);
        return sessions != null && !sessions.isEmpty();
    }

    /** Visible for tests. */
    int trackedSessionCount() { return bySession.size(); }
    int trackedUserCount() { return byUser.size(); }

    public static final class SessionState {
        public final String userEmail;
        public final Set<String> rooms;

        public SessionState(String userEmail, Set<String> rooms) {
            this.userEmail = userEmail;
            this.rooms = rooms;
        }
    }
}
