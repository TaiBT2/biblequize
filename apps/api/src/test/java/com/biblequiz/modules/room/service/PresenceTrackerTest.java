package com.biblequiz.modules.room.service;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class PresenceTrackerTest {

    @Test
    void onConnect_thenOnSubscribe_thenOnDisconnect_returnsFullState() {
        PresenceTracker t = new PresenceTracker();

        t.onConnect("s1", "alice@example.com");
        t.onSubscribe("s1", "room-1");
        t.onSubscribe("s1", "room-2");

        Optional<PresenceTracker.SessionState> snap = t.onDisconnect("s1");

        assertTrue(snap.isPresent());
        assertEquals("alice@example.com", snap.get().userEmail);
        assertEquals(2, snap.get().rooms.size());
        assertTrue(snap.get().rooms.contains("room-1"));
        assertTrue(snap.get().rooms.contains("room-2"));
        assertEquals(0, t.trackedSessionCount());
        assertEquals(0, t.trackedUserCount());
    }

    @Test
    void onDisconnect_unknownSession_emptyOptional() {
        PresenceTracker t = new PresenceTracker();
        assertTrue(t.onDisconnect("unknown").isEmpty());
    }

    @Test
    void onSubscribe_beforeConnect_silentlyIgnored() {
        PresenceTracker t = new PresenceTracker();
        // Should not throw — defensive against out-of-order events.
        t.onSubscribe("s-orphan", "room-1");
        assertEquals(0, t.trackedSessionCount());
    }

    @Test
    void userHasActiveSession_trueWhileAtLeastOneSessionAlive() {
        PresenceTracker t = new PresenceTracker();
        t.onConnect("s1", "bob@example.com");
        t.onConnect("s2", "bob@example.com");
        assertTrue(t.userHasActiveSession("bob@example.com"));

        t.onDisconnect("s1");
        assertTrue(t.userHasActiveSession("bob@example.com"), "still alive on s2");

        t.onDisconnect("s2");
        assertFalse(t.userHasActiveSession("bob@example.com"));
    }

    @Test
    void userHasActiveSession_falseForUnknownUser() {
        PresenceTracker t = new PresenceTracker();
        assertFalse(t.userHasActiveSession("nobody@example.com"));
    }
}
