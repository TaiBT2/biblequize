package com.biblequiz.modules.room.service.mode;

import com.biblequiz.api.websocket.WebSocketMessage;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.entity.RoomRound;
import com.biblequiz.modules.room.service.RoomService;
import com.biblequiz.modules.room.service.SpeedRaceScoringService;
import com.biblequiz.modules.room.service.TeamScoringService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Team vs Team — team score totals each round, Perfect Round bonus, and a
 * QUIZ_END payload that carries the winner + both team scores.
 */
@Component
public class TeamVsTeamStrategy implements RoomModeStrategy {

    private static final Logger log = LoggerFactory.getLogger(TeamVsTeamStrategy.class);

    private final TeamScoringService teamScoringService;
    private final SpeedRaceScoringService speedRaceScoringService;

    public TeamVsTeamStrategy(TeamScoringService teamScoringService,
                              SpeedRaceScoringService speedRaceScoringService) {
        this.teamScoringService = teamScoringService;
        this.speedRaceScoringService = speedRaceScoringService;
    }

    @Override
    public Room.RoomMode mode() {
        return Room.RoomMode.TEAM_VS_TEAM;
    }

    @Override
    public String displayName() {
        return "Team vs Team";
    }

    @Override
    public int calculateScore(boolean isCorrect, int timeLimitSeconds, int reactionTimeMs) {
        // Legacy quirk: individual TvT answers score with the Speed Race formula.
        return speedRaceScoringService.calculateScore(isCorrect, timeLimitSeconds, reactionTimeMs);
    }

    @Override
    public Comparator<RoomPlayer> leaderboardComparator() {
        return RoomService.ORDER_BY_SCORE_DESC;
    }

    @Override
    public boolean beforeLoop(GameLoopContext ctx) {
        // Broadcast team assignments
        List<RoomPlayer> allPlayers = ctx.roomPlayerRepository.findByRoomId(ctx.roomId);
        List<WebSocketMessage.TeamAssignmentData.TeamPlayerInfo> teamInfo = allPlayers.stream()
                .map(p -> new WebSocketMessage.TeamAssignmentData.TeamPlayerInfo(
                        p.getUser().getId(), p.getUsername(),
                        p.getTeam() != null ? p.getTeam().name() : "A"))
                .collect(Collectors.toList());
        ctx.ws.broadcastTeamAssignment(ctx.roomId, teamInfo);
        return true;
    }

    @Override
    public boolean afterRound(GameLoopContext ctx, RoomRound round, int questionIndex) {
        // Perfect Round check
        TeamScoringService.PerfectRoundResult perfect =
                teamScoringService.processPerfectRound(ctx.roomId, round.getId());
        if (perfect.teamAPerfect || perfect.teamBPerfect) {
            ctx.ws.broadcastPerfectRound(ctx.roomId, perfect.teamAPerfect, perfect.teamBPerfect);
        }

        // Team score update
        TeamScoringService.TeamScores scores = teamScoringService.calculateTeamScores(ctx.roomId);
        ctx.ws.broadcastTeamScoreUpdate(ctx.roomId, scores.teamA, scores.teamB);
        return false;
    }

    @Override
    public void finishGame(GameLoopContext ctx) {
        TeamScoringService.TeamScores finalScores = teamScoringService.calculateTeamScores(ctx.roomId);
        String winner = teamScoringService.determineWinner(finalScores);

        List<RoomService.LeaderboardEntryDTO> finalResults =
                ctx.roomService.buildLeaderboard(ctx.roomId, leaderboardComparator());
        Map<String, Object> endData = Map.of(
                "teamWinner", winner,
                "scoreA", finalScores.teamA,
                "scoreB", finalScores.teamB,
                "leaderboard", finalResults);

        ctx.roomService.endRoom(ctx.roomId);
        ctx.ws.broadcastQuizEnd(ctx.roomId, endData);
        log.info("Team vs Team kết thúc cho phòng {} | winner=Team{}", ctx.roomId, winner);
    }
}
