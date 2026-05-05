package com.biblequiz.modules.room.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

class SequentialScoringServiceTest {

    private SequentialScoringService service;

    @BeforeEach
    void setUp() {
        service = new SequentialScoringService();
    }

    @Test
    void calculateScore_correct_returns100() {
        assertEquals(100, service.calculateScore(true));
    }

    @Test
    void calculateScore_incorrect_returns0() {
        assertEquals(0, service.calculateScore(false));
    }

    @Test
    void beginRound_setsTotalAndZeroAnswered() {
        service.beginRound("room-1", 5);
        assertEquals(0, service.answeredCount("room-1"));
        assertEquals(5, service.totalPlayers("room-1"));
    }

    @Test
    void recordAnswer_incrementsAnsweredCount() {
        service.beginRound("room-1", 3);
        service.recordAnswer("room-1");
        service.recordAnswer("room-1");
        assertEquals(2, service.answeredCount("room-1"));
    }

    @Test
    void awaitAllAnsweredOrTimeout_allAnswered_returnsTrueImmediately() throws Exception {
        service.beginRound("room-1", 2);

        CompletableFuture<Boolean> future = CompletableFuture.supplyAsync(() -> {
            try {
                return service.awaitAllAnsweredOrTimeout("room-1", 5);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        });

        // Simulate 2 players answering
        Thread.sleep(50);
        service.recordAnswer("room-1");
        service.recordAnswer("room-1");

        Boolean result = future.get(2, TimeUnit.SECONDS);
        assertTrue(result, "Should wake up early when all answered");
    }

    @Test
    void awaitAllAnsweredOrTimeout_timeout_returnsFalse() throws Exception {
        service.beginRound("room-1", 5); // 5 expected, but only 1 answers
        service.recordAnswer("room-1");

        boolean result = service.awaitAllAnsweredOrTimeout("room-1", 1); // 1 second timeout
        assertFalse(result, "Should timeout when not all answered");
    }

    @Test
    void leaderAdvance_releasesAdvanceLatch() throws Exception {
        service.beginRound("room-1", 1);

        CompletableFuture<Boolean> future = CompletableFuture.supplyAsync(() -> {
            try {
                return service.awaitLeaderAdvance("room-1");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        });

        Thread.sleep(50);
        service.leaderAdvance("room-1");

        Boolean result = future.get(2, TimeUnit.SECONDS);
        assertTrue(result, "Should release immediately when leader advances");
    }

    @Test
    void clearRound_removesState() {
        service.beginRound("room-1", 3);
        service.clearRound("room-1");
        assertEquals(0, service.answeredCount("room-1"));
        assertEquals(0, service.totalPlayers("room-1"));
    }

    @Test
    void recordAnswer_unknownRoom_isNoop() {
        // Should not throw
        service.recordAnswer("unknown-room");
        assertEquals(0, service.answeredCount("unknown-room"));
    }
}
