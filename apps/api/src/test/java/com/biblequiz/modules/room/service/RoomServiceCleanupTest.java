package com.biblequiz.modules.room.service;

import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;
import com.biblequiz.modules.room.repository.RoomRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Covers the stale-lobby cleanup added for the "max 1 active room" lock-out
 * bug — see RoomService.cleanupStaleLobbyForUser (B-1) and
 * endLobbyRoomsOlderThan (B-2 helper).
 */
@ExtendWith(MockitoExtension.class)
class RoomServiceCleanupTest {

    @Mock private RoomRepository roomRepository;
    @Mock private RoomPlayerRepository roomPlayerRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private RoomService roomService;

    private User host;
    private User other;

    @BeforeEach
    void setUp() {
        // L-3: idleTimeoutMinutes is normally injected via @Value;
        // in unit tests we set it manually so cutoff math behaves
        // (default 30 min, mirrors application.yml default).
        ReflectionTestUtils.setField(roomService, "idleTimeoutMinutes", 30L);

        host = new User();
        host.setId("user-host");
        host.setName("Host");

        other = new User();
        other.setId("user-other");
        other.setName("Other");
    }

    private Room lobby(String id, User host, LocalDateTime createdAt) {
        Room r = new Room();
        r.setId(id);
        r.setRoomCode("CODE" + id);
        r.setStatus(Room.RoomStatus.LOBBY);
        r.setHost(host);
        r.setCreatedAt(createdAt);
        return r;
    }

    @Test
    void cleanupStaleLobbyForUser_whenUserIsHostOfStaleLobby_endsRoom() {
        Room stale = lobby("r1", host, LocalDateTime.now().minusHours(3));
        when(roomPlayerRepository.findActiveRoomIdsByUserId("user-host")).thenReturn(List.of("r1"));
        when(roomRepository.findById("r1")).thenReturn(Optional.of(stale));

        roomService.cleanupStaleLobbyForUser("user-host");

        assertEquals(Room.RoomStatus.ENDED, stale.getStatus());
        assertNotNull(stale.getEndedAt());
        verify(roomRepository).save(stale);
        verify(roomPlayerRepository, never()).delete(any());
    }

    @Test
    void cleanupStaleLobbyForUser_whenLobbyIsRecent_doesNothing() {
        Room fresh = lobby("r1", host, LocalDateTime.now().minusMinutes(5));
        when(roomPlayerRepository.findActiveRoomIdsByUserId("user-host")).thenReturn(List.of("r1"));
        when(roomRepository.findById("r1")).thenReturn(Optional.of(fresh));

        roomService.cleanupStaleLobbyForUser("user-host");

        assertEquals(Room.RoomStatus.LOBBY, fresh.getStatus());
        verify(roomRepository, never()).save(any());
    }

    @Test
    void cleanupStaleLobbyForUser_whenUserIsNotHost_removesPlayerOnly() {
        Room stale = lobby("r1", host, LocalDateTime.now().minusHours(3));
        RoomPlayer playerRecord = new RoomPlayer();
        when(roomPlayerRepository.findActiveRoomIdsByUserId("user-other")).thenReturn(List.of("r1"));
        when(roomRepository.findById("r1")).thenReturn(Optional.of(stale));
        when(roomPlayerRepository.findByRoomIdAndUserId("r1", "user-other"))
                .thenReturn(Optional.of(playerRecord));

        roomService.cleanupStaleLobbyForUser("user-other");

        // Room itself stays alive — host decides what to do with remaining players
        assertEquals(Room.RoomStatus.LOBBY, stale.getStatus());
        verify(roomRepository, never()).save(any());
        verify(roomPlayerRepository).delete(playerRecord);
    }

    @Test
    void cleanupStaleLobbyForUser_whenRoomNotInLobbyAnymore_skips() {
        Room ended = lobby("r1", host, LocalDateTime.now().minusHours(3));
        ended.setStatus(Room.RoomStatus.ENDED);
        when(roomPlayerRepository.findActiveRoomIdsByUserId("user-host")).thenReturn(List.of("r1"));
        when(roomRepository.findById("r1")).thenReturn(Optional.of(ended));

        roomService.cleanupStaleLobbyForUser("user-host");

        verify(roomRepository, never()).save(any());
        verify(roomPlayerRepository, never()).delete(any());
    }

    @Test
    void endLobbyRoomsOlderThan_endsAllStaleAndReturnsCount() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        Room a = lobby("ra", host, LocalDateTime.now().minusHours(3));
        Room b = lobby("rb", host, LocalDateTime.now().minusHours(4));
        when(roomRepository.findStaleLobbyRooms(cutoff)).thenReturn(List.of(a, b));

        int closed = roomService.endLobbyRoomsOlderThan(cutoff);

        assertEquals(2, closed);
        assertEquals(Room.RoomStatus.ENDED, a.getStatus());
        assertEquals(Room.RoomStatus.ENDED, b.getStatus());
        assertNotNull(a.getEndedAt());
        assertNotNull(b.getEndedAt());
        verify(roomRepository).saveAll(List.of(a, b));
    }

    @Test
    void endLobbyRoomsOlderThan_whenNoneStale_returnsZeroAndDoesNotSave() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        when(roomRepository.findStaleLobbyRooms(cutoff)).thenReturn(List.of());

        int closed = roomService.endLobbyRoomsOlderThan(cutoff);

        assertEquals(0, closed);
        verify(roomRepository, never()).saveAll(anyList());
    }

    /** L-2: endRoom is idempotent — abandonment scheduler may race the
     *  normal runQuiz finish; second call should be a no-op (no save,
     *  no updated_at bump). */
    @Test
    void endRoom_whenAlreadyEnded_isNoop() {
        Room ended = lobby("r1", host, LocalDateTime.now().minusHours(1));
        ended.setStatus(Room.RoomStatus.ENDED);
        ended.setEndedAt(LocalDateTime.now().minusMinutes(30));
        when(roomRepository.findById("r1")).thenReturn(Optional.of(ended));

        roomService.endRoom("r1");

        verify(roomRepository, never()).save(any());
    }

    @Test
    void endRoom_whenInProgress_flipsToEnded() {
        Room playing = lobby("r1", host, LocalDateTime.now().minusMinutes(10));
        playing.setStatus(Room.RoomStatus.IN_PROGRESS);
        when(roomRepository.findById("r1")).thenReturn(Optional.of(playing));

        roomService.endRoom("r1");

        assertEquals(Room.RoomStatus.ENDED, playing.getStatus());
        assertNotNull(playing.getEndedAt());
        verify(roomRepository).save(playing);
    }
}
