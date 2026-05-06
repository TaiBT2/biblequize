package com.biblequiz.modules.room.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * B-2: Periodically end LOBBY rooms that have never started and are older
 * than the cutoff. Pairs with the per-user lazy cleanup in
 * {@link RoomService#cleanupStaleLobbyForUser(String)} (B-1) so a host that
 * disconnects without ending their room doesn't permanently lock the
 * "max 1 active room per user" rule (SPEC v1.1 §8.7).
 *
 * <p>Runs every 10 minutes; marks rooms in LOBBY with createdAt &lt; now − 2h
 * as ENDED.
 */
@Component
public class RoomCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(RoomCleanupScheduler.class);

    /** Lobby rooms older than this are swept by the scheduler. */
    static final long ABANDONED_LOBBY_HOURS = 2L;

    private final RoomService roomService;

    public RoomCleanupScheduler(RoomService roomService) {
        this.roomService = roomService;
    }

    @Scheduled(fixedRate = 10 * 60 * 1000L) // every 10 minutes
    public void sweepAbandonedLobbies() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(ABANDONED_LOBBY_HOURS);
        int closed = roomService.endLobbyRoomsOlderThan(cutoff);
        if (closed > 0) {
            log.info("[ROOM-CLEANUP] Ended {} abandoned LOBBY rooms (older than {}h)",
                    closed, ABANDONED_LOBBY_HOURS);
        }
    }
}
