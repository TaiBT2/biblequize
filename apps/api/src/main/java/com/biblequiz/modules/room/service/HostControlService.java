package com.biblequiz.modules.room.service;

import com.biblequiz.api.websocket.RoomWebSocketController;
import com.biblequiz.api.websocket.WebSocketMessage;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.repository.RoomRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Sprint 4 — Quản trò control plane.
 *
 * <p>Owns the in-memory pause-latch map and skip-flag set used by the quiz
 * runner threads to react to host actions. Lives outside RoomQuizService so
 * the runner can stay focused on game logic and the controller layer can
 * inject something testable without dragging in the full quiz dependency
 * tree.
 *
 * <p>State here is intentionally per-process: a room's pause/skip state is
 * only meaningful while the runQuiz thread for that room is alive on this
 * node. Any prod multi-node deploy would need to either (a) pin a room to a
 * single node or (b) externalise the latch via Redis pub/sub. Out of scope
 * for Sprint 4 (single-node assumption holds today).
 */
@Service
public class HostControlService {

    @Autowired private RoomRepository roomRepository;
    @Autowired private RoomService roomService;

    @Autowired
    @Lazy
    private RoomWebSocketController wsController;

    private final Map<String, CountDownLatch> pauseLatches = new ConcurrentHashMap<>();
    private final Set<String> skipFlags = ConcurrentHashMap.newKeySet();

    /** Auth + mode guard for every host control. Throws IllegalStateException
     *  with a Vietnamese message that the controller turns into a 400. */
    Room validateHostAction(String roomId, String userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalStateException("Phòng không tồn tại"));
        if (room.getHost() == null || !room.getHost().getId().equals(userId)) {
            throw new IllegalStateException("Chỉ Quản trò mới được điều khiển");
        }
        if (room.isHostPlaysGame()) {
            // Legacy rooms have no separate Quản trò role — these endpoints
            // are not available there.
            throw new IllegalStateException("Phòng này không ở chế độ Quản trò");
        }
        if (room.getStatus() != Room.RoomStatus.IN_PROGRESS
                && room.getStatus() != Room.RoomStatus.LOBBY) {
            throw new IllegalStateException("Trận đấu đã kết thúc");
        }
        return room;
    }

    public void pauseGame(String roomId, String hostUserId) {
        validateHostAction(roomId, hostUserId);
        // Idempotent: re-pausing while already paused keeps the existing
        // latch so a second click doesn't accidentally re-arm and trap any
        // thread that just resumed.
        pauseLatches.computeIfAbsent(roomId, k -> new CountDownLatch(1));
        wsController.broadcastGamePaused(roomId);
    }

    public void resumeGame(String roomId, String hostUserId) {
        validateHostAction(roomId, hostUserId);
        CountDownLatch latch = pauseLatches.remove(roomId);
        if (latch != null) latch.countDown();
        wsController.broadcastGameResumed(roomId);
    }

    public void skipQuestion(String roomId, String hostUserId) {
        validateHostAction(roomId, hostUserId);
        skipFlags.add(roomId);
        wsController.broadcastQuestionSkipped(roomId);
    }

    public void endGameEarly(String roomId, String hostUserId) {
        validateHostAction(roomId, hostUserId);
        // Lift any pending pause first so the runner thread drains rather
        // than wedge after we mark the room ended.
        CountDownLatch latch = pauseLatches.remove(roomId);
        if (latch != null) latch.countDown();
        // Also clear any skip flag so the runner doesn't act on a stale request.
        skipFlags.remove(roomId);
        roomService.endRoom(roomId);
        wsController.broadcastRoomEnded(roomId,
                WebSocketMessage.RoomEndedReason.HOST_ENDED_EARLY);
    }

    public void broadcastHostMessage(String roomId, String hostUserId, String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalStateException("Tin nhắn không được trống");
        }
        if (message.length() > 200) {
            throw new IllegalStateException("Tin nhắn tối đa 200 ký tự");
        }
        Room room = validateHostAction(roomId, hostUserId);
        String hostName = room.getHost().getName();
        wsController.broadcastHostMessage(roomId, hostUserId, hostName, message);
    }

    /**
     * Called from the quiz runner thread between questions. Blocks for at
     * most {@code timeoutMinutes} so a forgotten pause never wedges a room
     * indefinitely.
     */
    public void awaitIfPaused(String roomId, long timeoutMinutes) throws InterruptedException {
        CountDownLatch latch = pauseLatches.get(roomId);
        if (latch != null) {
            latch.await(timeoutMinutes, TimeUnit.MINUTES);
        }
    }

    /** Consumes the skip flag — returns true once and clears it. */
    public boolean consumeSkipFlag(String roomId) {
        return skipFlags.remove(roomId);
    }

    /** Test/visibility helper. */
    public boolean isPaused(String roomId) {
        return pauseLatches.containsKey(roomId);
    }
}
