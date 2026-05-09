package com.biblequiz.modules.room.service;

import com.biblequiz.api.websocket.RoomWebSocketController;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.repository.RoomRepository;
import com.biblequiz.modules.user.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HostControlServiceTest {

    @Mock private RoomRepository roomRepository;
    @Mock private RoomService roomService;
    @Mock private RoomWebSocketController wsController;

    @InjectMocks private HostControlService hostControlService;

    private Room quanTroRoom;
    private User host;

    @BeforeEach
    void setUp() {
        host = new User();
        host.setId("host-1");
        host.setName("Bui");

        quanTroRoom = new Room();
        quanTroRoom.setId("room-1");
        quanTroRoom.setHost(host);
        quanTroRoom.setHostPlaysGame(false);
        quanTroRoom.setStatus(Room.RoomStatus.IN_PROGRESS);
    }

    @Test
    void pauseAndResume_followsLatchLifecycle() {
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(quanTroRoom));

        hostControlService.pauseGame("room-1", "host-1");
        assertTrue(hostControlService.isPaused("room-1"));
        verify(wsController).broadcastGamePaused("room-1");

        hostControlService.resumeGame("room-1", "host-1");
        assertFalse(hostControlService.isPaused("room-1"));
        verify(wsController).broadcastGameResumed("room-1");
    }

    @Test
    void skipQuestion_setsConsumableFlag() {
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(quanTroRoom));

        hostControlService.skipQuestion("room-1", "host-1");

        assertTrue(hostControlService.consumeSkipFlag("room-1"));
        // Flag is consumed → second call returns false.
        assertFalse(hostControlService.consumeSkipFlag("room-1"));
        verify(wsController).broadcastQuestionSkipped("room-1");
    }

    @Test
    void broadcastHostMessage_validMessage_passesThrough() {
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(quanTroRoom));

        hostControlService.broadcastHostMessage("room-1", "host-1", "Đọc kỹ Sáng Thế Ký 1 nhé!");

        verify(wsController).broadcastHostMessage("room-1", "host-1", "Bui",
                "Đọc kỹ Sáng Thế Ký 1 nhé!");
    }

    @Test
    void broadcastHostMessage_tooLong_throws() {
        String longMsg = "a".repeat(201);
        Exception ex = assertThrows(IllegalStateException.class,
                () -> hostControlService.broadcastHostMessage("room-1", "host-1", longMsg));
        assertEquals("Tin nhắn tối đa 200 ký tự", ex.getMessage());
    }

    @Test
    void validateHostAction_legacyRoom_throws() {
        quanTroRoom.setHostPlaysGame(true);
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(quanTroRoom));

        Exception ex = assertThrows(IllegalStateException.class,
                () -> hostControlService.pauseGame("room-1", "host-1"));
        assertEquals("Phòng này không ở chế độ Quản trò", ex.getMessage());
    }

    @Test
    void validateHostAction_nonHost_throws() {
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(quanTroRoom));

        Exception ex = assertThrows(IllegalStateException.class,
                () -> hostControlService.pauseGame("room-1", "intruder"));
        assertEquals("Chỉ Quản trò mới được điều khiển", ex.getMessage());
    }

    @Test
    void endGameEarly_endsRoomAndBroadcasts() {
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(quanTroRoom));

        // Simulate a paused state — endGameEarly must drain the latch so the
        // runner thread doesn't wedge.
        hostControlService.pauseGame("room-1", "host-1");
        assertTrue(hostControlService.isPaused("room-1"));

        hostControlService.endGameEarly("room-1", "host-1");

        assertFalse(hostControlService.isPaused("room-1"));
        verify(roomService).endRoom("room-1");
        verify(wsController).broadcastRoomEnded("room-1",
                com.biblequiz.api.websocket.WebSocketMessage.RoomEndedReason.HOST_ENDED_EARLY);
    }
}
