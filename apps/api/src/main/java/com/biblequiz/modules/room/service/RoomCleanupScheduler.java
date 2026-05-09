package com.biblequiz.modules.room.service;

import com.biblequiz.modules.room.repository.RoomRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Periodic room maintenance.
 *
 * <p>(B-2, SPEC §5.4.0 R2) {@link #sweepAbandonedLobbies()}: end LOBBY rooms
 * that have never started and are older than
 * {@code biblequiz.room.idle-timeout-minutes} (default 30, mirrors the FE
 * admin config ROOM_IDLE_TIMEOUT_MIN). Pairs with the per-user lazy cleanup
 * in {@link RoomService#cleanupStaleLobbyForUser(String)} (B-1) so a host
 * that disconnects without ending their room doesn't permanently lock the
 * "max 1 active room per user" rule (SPEC v1.1 §8.7). Both sweeps now read
 * the same property — audit G8 found the constants disagreed (1h vs 2h).
 *
 * <p>(L-1, SPEC §5.4.0 R3) {@link #purgeExpiredEndedRooms()}: hard-delete
 * ENDED rooms whose {@code updated_at} is older than
 * {@code biblequiz.room.ended-retention-hours} (default 24h). Without this,
 * the audit observed 95+ ENDED rows accumulating in dev. Cascades wired up
 * by V48 ensure room_room_players follow.
 *
 * <p>Both jobs share the 10-minute scheduler tick.
 */
@Component
public class RoomCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(RoomCleanupScheduler.class);

    private final RoomService roomService;
    private final RoomRepository roomRepository;

    @Value("${biblequiz.room.idle-timeout-minutes:30}")
    private long idleTimeoutMinutes;

    @Value("${biblequiz.room.ended-retention-hours:24}")
    private long endedRetentionHours;

    public RoomCleanupScheduler(RoomService roomService, RoomRepository roomRepository) {
        this.roomService = roomService;
        this.roomRepository = roomRepository;
    }

    @Scheduled(fixedRate = 10 * 60 * 1000L) // every 10 minutes
    public void sweepAbandonedLobbies() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(idleTimeoutMinutes);
        int closed = roomService.endLobbyRoomsOlderThan(cutoff);
        log.info("[ROOM-CLEANUP] Ended {} abandoned LOBBY rooms (idle > {} min)",
                closed, idleTimeoutMinutes);
    }

    /**
     * SPEC §5.4.0 R3: hard-delete ENDED rooms past the retention window.
     * Logs unconditionally (even on 0) so operators can verify the scheduler
     * is alive — silent success was an audit gap (G10).
     */
    @Scheduled(fixedRate = 10 * 60 * 1000L) // every 10 minutes
    public void purgeExpiredEndedRooms() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(endedRetentionHours);
        int deleted = roomRepository.deleteExpiredRooms(cutoff);
        log.info("[ROOM-CLEANUP] Purged {} ENDED rooms older than {}h", deleted, endedRetentionHours);
    }
}
