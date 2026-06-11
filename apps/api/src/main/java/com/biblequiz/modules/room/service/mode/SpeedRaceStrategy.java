package com.biblequiz.modules.room.service.mode;

import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.service.RoomService;
import com.biblequiz.modules.room.service.SpeedRaceScoringService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

/**
 * Default mode — the race for points. Wraps {@link SpeedRaceScoringService};
 * the standard loop needs no extra hooks beyond the shared structure.
 */
@Component
public class SpeedRaceStrategy implements RoomModeStrategy {

    private static final Logger log = LoggerFactory.getLogger(SpeedRaceStrategy.class);

    private final SpeedRaceScoringService speedRaceScoringService;

    public SpeedRaceStrategy(SpeedRaceScoringService speedRaceScoringService) {
        this.speedRaceScoringService = speedRaceScoringService;
    }

    @Override
    public Room.RoomMode mode() {
        return Room.RoomMode.SPEED_RACE;
    }

    @Override
    public String displayName() {
        return "Speed Race";
    }

    @Override
    public int calculateScore(boolean isCorrect, int timeLimitSeconds, int reactionTimeMs) {
        return speedRaceScoringService.calculateScore(isCorrect, timeLimitSeconds, reactionTimeMs);
    }

    @Override
    public Comparator<RoomPlayer> leaderboardComparator() {
        return RoomService.ORDER_BY_SCORE_DESC;
    }

    @Override
    public void finishGame(GameLoopContext ctx) {
        List<RoomService.LeaderboardEntryDTO> finalResults =
                ctx.roomService.buildLeaderboard(ctx.roomId, leaderboardComparator());
        ctx.roomService.endRoom(ctx.roomId);
        ctx.ws.broadcastQuizEnd(ctx.roomId, finalResults);
        log.info("Speed Race kết thúc cho phòng {}", ctx.roomId);
    }
}
