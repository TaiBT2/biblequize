package com.biblequiz.room;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static com.biblequiz.room.RoomModels.*;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final SimpMessagingTemplate messagingTemplate;

    public RoomController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    private String generateCode() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
        }
        return sb.toString();
    }

    @PostMapping
    public ResponseEntity<Room> create(@RequestBody CreateRoomRequest req) {
        Room room = new Room();
        room.id = generateCode();
        Player host = new Player();
        host.id = "host";
        host.name = req != null ? req.hostName : "Host";
        room.hostId = host.id;
        room.players.add(host);
        rooms.put(room.id, room);
        return ResponseEntity.ok(room);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Room> join(@PathVariable String id, @RequestBody JoinRoomRequest req) {
        Room room = rooms.get(id);
        if (room == null) return ResponseEntity.notFound().build();
        if (room.status != RoomStatus.LOBBY) return ResponseEntity.badRequest().build();
        Player p = new Player();
        p.id = "p" + (room.players.size() + 1);
        p.name = req != null ? req.playerName : ("Player " + room.players.size());
        room.players.add(p);
        return ResponseEntity.ok(room);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Room> start(@PathVariable String id) {
        Room room = rooms.get(id);
        if (room == null) return ResponseEntity.notFound().build();
        room.status = RoomStatus.IN_PROGRESS;
        // Broadcast room starting via WS for clients already subscribed
        messagingTemplate.convertAndSend("/topic/room/" + id,
                Map.of(
                        "type", "ROOM_STARTING",
                        "data", Map.of("roomId", id, "timestamp", System.currentTimeMillis())
                ));
        // Send a demo first question so the UI can render immediately (MVP)
        Map<String, Object> demoQuestion = Map.of(
                "id", "demo-1",
                "content", "Ai dẫn dân Israel ra khỏi Ai Cập?",
                "options", java.util.List.of("Môi-se", "Giô-suê", "Đa-vít", "Sa-lô-môn"),
                "timeLimit", 20,
                "questionIndex", 0,
                "totalQuestions", 10
        );
        messagingTemplate.convertAndSend("/topic/room/" + id,
                Map.of("type", "QUESTION_START", "data", demoQuestion));
        return ResponseEntity.ok(room);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> get(@PathVariable String id) {
        Room room = rooms.get(id);
        if (room == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(room);
    }
}


