package com.biblequiz.modules.room.service;

import com.biblequiz.modules.room.repository.RoomRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Sprint 2.5 L-1 — purgeExpiredEndedRooms wires
 * {@link RoomRepository#deleteExpiredRooms(LocalDateTime)} on a 10-minute
 * tick using {@code biblequiz.room.ended-retention-hours} (default 24h).
 */
@ExtendWith(MockitoExtension.class)
class RoomCleanupSchedulerTest {

    @Mock private RoomService roomService;
    @Mock private RoomRepository roomRepository;

    private RoomCleanupScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new RoomCleanupScheduler(roomService, roomRepository);
        ReflectionTestUtils.setField(scheduler, "endedRetentionHours", 24L);
    }

    @Test
    void purgeExpiredEndedRooms_passesCutoff24hBeforeNowToRepository() {
        when(roomRepository.deleteExpiredRooms(any())).thenReturn(3);
        LocalDateTime before = LocalDateTime.now();

        scheduler.purgeExpiredEndedRooms();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(roomRepository).deleteExpiredRooms(captor.capture());
        LocalDateTime cutoff = captor.getValue();

        // cutoff should be ~24h before "now" (within a small window for test slack)
        long minutesAgo = ChronoUnit.MINUTES.between(cutoff, LocalDateTime.now());
        assertTrue(minutesAgo >= 24 * 60 - 1 && minutesAgo <= 24 * 60 + 1,
                "expected cutoff ~24h ago, got " + minutesAgo + " minutes");
        assertFalse(cutoff.isAfter(before), "cutoff should not be in the future");
    }

    @Test
    void purgeExpiredEndedRooms_returnsZeroWhenNothingToDelete_stillLogs() {
        when(roomRepository.deleteExpiredRooms(any())).thenReturn(0);

        // Should not throw / no exception path on empty result
        scheduler.purgeExpiredEndedRooms();

        verify(roomRepository).deleteExpiredRooms(any());
    }

    @Test
    void purgeExpiredEndedRooms_honorsConfiguredRetentionHours() {
        ReflectionTestUtils.setField(scheduler, "endedRetentionHours", 1L);
        when(roomRepository.deleteExpiredRooms(any())).thenReturn(0);

        scheduler.purgeExpiredEndedRooms();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(roomRepository).deleteExpiredRooms(captor.capture());
        long minutesAgo = ChronoUnit.MINUTES.between(captor.getValue(), LocalDateTime.now());
        assertTrue(minutesAgo >= 59 && minutesAgo <= 61,
                "expected cutoff ~1h ago for retention=1h, got " + minutesAgo + " minutes");
    }

    @Test
    void sweepAbandonedLobbies_delegatesToRoomService_unchangedFromPriorBehavior() {
        when(roomService.endLobbyRoomsOlderThan(any())).thenReturn(2);

        scheduler.sweepAbandonedLobbies();

        verify(roomService).endLobbyRoomsOlderThan(any());
        // Lobby sweep does not touch the room repo directly
        verify(roomRepository, never()).deleteExpiredRooms(any());
    }
}
