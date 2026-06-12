package com.biblequiz.modules.room.service;

import com.biblequiz.api.websocket.RoomWebSocketController;
import com.biblequiz.api.websocket.WebSocketMessage;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.repository.RoomRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomAbandonmentSchedulerTest {

    @Mock private RoomRepository roomRepository;
    @Mock private RoomService roomService;
    @Mock private RoomWebSocketController webSocketController;

    private RoomAbandonmentScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new RoomAbandonmentScheduler(roomRepository, roomService, webSocketController);
    }

    private Room stuck(String id, LocalDateTime startedAt) {
        Room r = new Room();
        r.setId(id);
        r.setRoomCode("CODE" + id);
        r.setStatus(Room.RoomStatus.IN_PROGRESS);
        r.setStartedAt(startedAt);
        return r;
    }

    @Test
    void sweepStuckGames_callsEndRoomForEachStuckRow_andBroadcastsStuckGame() {
        Room a = stuck("a", LocalDateTime.now().minusHours(2));
        Room b = stuck("b", LocalDateTime.now().minusHours(3));
        when(roomRepository.findStuckInProgressRooms(any())).thenReturn(List.of(a, b));

        scheduler.sweepStuckGames();

        verify(roomService).endRoom("a");
        verify(roomService).endRoom("b");
        verify(webSocketController).broadcastRoomEnded("a", WebSocketMessage.RoomEndedReason.STUCK_GAME);
        verify(webSocketController).broadcastRoomEnded("b", WebSocketMessage.RoomEndedReason.STUCK_GAME);
    }

    @Test
    void sweepStuckGames_doesNothingWhenNoneStuck() {
        when(roomRepository.findStuckInProgressRooms(any())).thenReturn(List.of());

        scheduler.sweepStuckGames();

        verify(roomService, never()).endRoom(any());
    }

    @Test
    void sweepStuckGames_passesCutoffAtThresholdBeforeNow() {
        when(roomRepository.findStuckInProgressRooms(any())).thenReturn(List.of());

        scheduler.sweepStuckGames();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(roomRepository).findStuckInProgressRooms(captor.capture());
        long minutesAgo = ChronoUnit.MINUTES.between(captor.getValue(), LocalDateTime.now());
        assertTrue(minutesAgo >= 89 && minutesAgo <= 91,
                "expected cutoff ~90 min ago, got " + minutesAgo);
    }

    @Test
    void recoverOrphansOnStartup_endsAllInProgressRoomsRegardlessOfAge() {
        // A fresh JVM has no quiz-runner threads, so even a seconds-old
        // IN_PROGRESS room is an orphan — the startup pass must use
        // cutoff=now (no 90-min grace) and end everything it finds.
        Room young = stuck("young", LocalDateTime.now().minusMinutes(1));
        when(roomRepository.findStuckInProgressRooms(any())).thenReturn(List.of(young));

        scheduler.recoverOrphansOnStartup();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(roomRepository).findStuckInProgressRooms(captor.capture());
        long minutesAgo = ChronoUnit.MINUTES.between(captor.getValue(), LocalDateTime.now());
        assertTrue(minutesAgo <= 1, "expected cutoff ~now, got " + minutesAgo + " min ago");
        verify(roomService).endRoom("young");
        verify(webSocketController).broadcastRoomEnded("young", WebSocketMessage.RoomEndedReason.STUCK_GAME);
    }

    @Test
    void sweepStuckGames_oneRoomFailing_othersStillRecovered() {
        Room a = stuck("a", LocalDateTime.now().minusHours(2));
        Room b = stuck("b", LocalDateTime.now().minusHours(2));
        Room c = stuck("c", LocalDateTime.now().minusHours(2));
        when(roomRepository.findStuckInProgressRooms(any())).thenReturn(List.of(a, b, c));
        doThrow(new RuntimeException("DB down for b")).when(roomService).endRoom("b");

        scheduler.sweepStuckGames();

        verify(roomService).endRoom("a");
        verify(roomService).endRoom("b");
        verify(roomService).endRoom("c");
    }
}
