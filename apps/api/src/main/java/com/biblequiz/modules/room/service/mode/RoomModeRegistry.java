package com.biblequiz.modules.room.service.mode;

import com.biblequiz.modules.room.entity.Room;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Mode → strategy lookup. Mirrors the legacy {@code switch} in
 * RoomQuizService.runQuiz: any unmapped/null mode falls back to Speed Race
 * (the old {@code default ->} branch).
 */
@Component
public class RoomModeRegistry {

    private final Map<Room.RoomMode, RoomModeStrategy> strategies;
    private final RoomModeStrategy fallback;

    public RoomModeRegistry(List<RoomModeStrategy> beans) {
        EnumMap<Room.RoomMode, RoomModeStrategy> map = new EnumMap<>(Room.RoomMode.class);
        for (RoomModeStrategy s : beans) {
            map.put(s.mode(), s);
        }
        this.strategies = Collections.unmodifiableMap(map);
        this.fallback = map.get(Room.RoomMode.SPEED_RACE);
        if (this.fallback == null) {
            throw new IllegalStateException("SPEED_RACE strategy bean is required as the default mode");
        }
    }

    public RoomModeStrategy get(Room.RoomMode mode) {
        if (mode == null) {
            return fallback;
        }
        return strategies.getOrDefault(mode, fallback);
    }
}
