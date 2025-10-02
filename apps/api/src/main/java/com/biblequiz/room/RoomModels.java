package com.biblequiz.room;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class RoomModels {

    public enum RoomStatus { LOBBY, IN_PROGRESS, ENDED }

    public static class Player {
        public String id;
        public String name;
        public Instant joinedAt = Instant.now();
    }

    public static class Room {
        public String id;
        public String hostId;
        public RoomStatus status = RoomStatus.LOBBY;
        public Instant createdAt = Instant.now();
        public List<Player> players = new ArrayList<>();
    }

    public static class CreateRoomRequest {
        public String hostName;
    }

    public static class JoinRoomRequest {
        public String playerName;
    }
}


