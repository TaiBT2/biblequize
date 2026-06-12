package com.biblequiz.modules.room.service;

import com.biblequiz.api.websocket.RoomWebSocketController;
import com.biblequiz.api.websocket.WebSocketMessage;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.repository.RoomRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SPEC §5.4.0 R5 — recover IN_PROGRESS rooms whose runQuiz loop never
 * finished. {@link RoomQuizService#runQuiz(String, int, int, com.biblequiz.modules.room.entity.Room.RoomMode)}
 * is the only normal path that flips IN_PROGRESS → ENDED, so a JVM crash,
 * network split, or unhandled exception leaves the row stuck. Audit
 * confirmed 1 such row in dev DB, 3h old.
 *
 * <p>Without recovery, every player in the stuck room is permanently
 * locked out of the "max 1 active room per user" rule (SPEC v1.1 §8.7).
 *
 * <p>Threshold: even Speed Race's worst case (50 questions × 60s) finishes
 * in 50 minutes. {@value #STUCK_THRESHOLD_MINUTES} minutes is well past
 * any legitimate game duration.
 */
@Component
public class RoomAbandonmentScheduler {

    private static final Logger log = LoggerFactory.getLogger(RoomAbandonmentScheduler.class);

    /** Worst-case quiz duration (50 × 60s) + 40-minute safety = 90 min. */
    static final long STUCK_THRESHOLD_MINUTES = 90L;

    private final RoomRepository roomRepository;
    private final RoomService roomService;
    private final RoomWebSocketController webSocketController;

    public RoomAbandonmentScheduler(RoomRepository roomRepository,
                                    RoomService roomService,
                                    RoomWebSocketController webSocketController) {
        this.roomRepository = roomRepository;
        this.roomService = roomService;
        this.webSocketController = webSocketController;
    }

    @Scheduled(fixedRate = 5 * 60 * 1000L) // every 5 minutes
    public void sweepStuckGames() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(STUCK_THRESHOLD_MINUTES);
        recoverRooms(roomRepository.findStuckInProgressRooms(cutoff),
                "stuck (threshold " + STUCK_THRESHOLD_MINUTES + " min)");
    }

    /**
     * Boot-time orphan recovery. The quiz loop lives in an in-memory @Async
     * thread, so a fresh JVM has no runner for ANY row still IN_PROGRESS —
     * those rooms are zombies immediately (players see an expired question
     * and can never advance), yet the periodic sweep would leave them alive
     * for up to {@value #STUCK_THRESHOLD_MINUTES} minutes. End them all now.
     * Single-instance assumption: matches the in-memory game-loop design.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void recoverOrphansOnStartup() {
        recoverRooms(roomRepository.findStuckInProgressRooms(LocalDateTime.now()),
                "orphaned by restart");
    }

    private void recoverRooms(List<Room> rooms, String why) {
        if (rooms.isEmpty()) {
            log.debug("[ROOM-ABANDON] No IN_PROGRESS rooms to recover ({})", why);
            return;
        }
        log.warn("[ROOM-ABANDON] Recovering {} IN_PROGRESS rooms ({})", rooms.size(), why);
        for (Room room : rooms) {
            try {
                roomService.endRoom(room.getId());
                webSocketController.broadcastRoomEnded(room.getId(),
                        WebSocketMessage.RoomEndedReason.STUCK_GAME);
                log.warn("[ROOM-ABANDON] Recovered room {} (started at {})",
                        room.getRoomCode(), room.getStartedAt());
            } catch (Exception e) {
                // Don't let one bad row poison the sweep — log and continue.
                log.error("[ROOM-ABANDON] Failed to recover room {}: {}",
                        room.getId(), e.getMessage(), e);
            }
        }
    }
}
