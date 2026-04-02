package com.biblequiz.modules.room.service;

import com.biblequiz.modules.room.entity.RoomAnswer;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.repository.RoomAnswerRepository;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Xử lý điểm số cho chế độ Team vs Team.
 * - Cộng điểm theo đội
 * - Perfect Round bonus (+50 nếu cả đội đúng hết)
 * - Xác định đội thắng
 */
@Service
public class TeamScoringService {

    @Autowired private RoomPlayerRepository roomPlayerRepository;
    @Autowired private RoomAnswerRepository roomAnswerRepository;

    private static final int PERFECT_ROUND_BONUS = 50;

    /** Tính tổng điểm 2 đội */
    public TeamScores calculateTeamScores(String roomId) {
        List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);
        int scoreA = 0, scoreB = 0;
        for (RoomPlayer p : players) {
            if (p.getTeam() == RoomPlayer.Team.A) scoreA += p.getScore();
            else if (p.getTeam() == RoomPlayer.Team.B) scoreB += p.getScore();
        }
        return new TeamScores(scoreA, scoreB);
    }

    /**
     * Kiểm tra Perfect Round: nếu cả đội đều trả lời đúng → cộng bonus.
     * @return kết quả đội nào đạt Perfect Round
     */
    @Transactional
    public PerfectRoundResult processPerfectRound(String roomId, String roundId) {
        List<RoomPlayer> playersA = roomPlayerRepository.findByRoomIdAndTeam(roomId, RoomPlayer.Team.A);
        List<RoomPlayer> playersB = roomPlayerRepository.findByRoomIdAndTeam(roomId, RoomPlayer.Team.B);

        List<RoomAnswer> roundAnswers = roomAnswerRepository.findByRoundId(roundId);
        Map<String, Boolean> correctMap = roundAnswers.stream()
                .collect(Collectors.toMap(RoomAnswer::getUserId, a -> Boolean.TRUE.equals(a.getIsCorrect())));

        boolean perfA = allCorrect(playersA, correctMap);
        boolean perfB = allCorrect(playersB, correctMap);

        if (perfA) {
            playersA.forEach(p -> p.setScore(p.getScore() + PERFECT_ROUND_BONUS));
            roomPlayerRepository.saveAll(playersA);
        }
        if (perfB) {
            playersB.forEach(p -> p.setScore(p.getScore() + PERFECT_ROUND_BONUS));
            roomPlayerRepository.saveAll(playersB);
        }
        return new PerfectRoundResult(perfA, perfB);
    }

    private boolean allCorrect(List<RoomPlayer> players, Map<String, Boolean> correctMap) {
        if (players.isEmpty()) return false;
        for (RoomPlayer p : players) {
            if (!Boolean.TRUE.equals(correctMap.get(p.getUser().getId()))) return false;
        }
        return true;
    }

    /** Xác định đội thắng: "A", "B", hoặc "TIE" */
    public String determineWinner(TeamScores scores) {
        if (scores.teamA > scores.teamB) return "A";
        if (scores.teamB > scores.teamA) return "B";
        return "TIE";
    }

    /**
     * FIX: Tie-break khi 2 đội cùng điểm.
     * 1. So perfectRoundCount → nhiều hơn thắng
     * 2. So totalResponseMs → nhanh hơn thắng
     * 3. Vẫn bằng → "TIE" thật
     */
    public TeamResult determineWinnerWithTieBreak(String roomId, int perfectRoundsA, int perfectRoundsB) {
        TeamScores scores = calculateTeamScores(roomId);

        if (scores.teamA > scores.teamB) return new TeamResult("A", "SCORE", scores);
        if (scores.teamB > scores.teamA) return new TeamResult("B", "SCORE", scores);

        // Tie → compare perfect rounds
        if (perfectRoundsA > perfectRoundsB) return new TeamResult("A", "PERFECT_ROUNDS", scores);
        if (perfectRoundsB > perfectRoundsA) return new TeamResult("B", "PERFECT_ROUNDS", scores);

        // Tie → compare total response time (lower = faster = better)
        List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);
        double totalMsA = 0, totalMsB = 0;
        int countA = 0, countB = 0;
        for (RoomPlayer p : players) {
            if (p.getTeam() == RoomPlayer.Team.A) {
                totalMsA += p.getAverageReactionTime() * p.getTotalAnswered();
                countA++;
            } else if (p.getTeam() == RoomPlayer.Team.B) {
                totalMsB += p.getAverageReactionTime() * p.getTotalAnswered();
                countB++;
            }
        }
        if (countA > 0 && countB > 0 && totalMsA != totalMsB) {
            return new TeamResult(totalMsA < totalMsB ? "A" : "B", "SPEED", scores);
        }

        return new TeamResult("TIE", "TIE", scores);
    }

    public static class TeamResult {
        public final String winningTeam; // "A", "B", or "TIE"
        public final String reason;      // "SCORE", "PERFECT_ROUNDS", "SPEED", "TIE"
        public final TeamScores scores;

        public TeamResult(String winningTeam, String reason, TeamScores scores) {
            this.winningTeam = winningTeam;
            this.reason = reason;
            this.scores = scores;
        }
    }

    // ── DTOs ──

    public static class TeamScores {
        public final int teamA;
        public final int teamB;

        public TeamScores(int teamA, int teamB) {
            this.teamA = teamA;
            this.teamB = teamB;
        }
    }

    public static class PerfectRoundResult {
        public final boolean teamAPerfect;
        public final boolean teamBPerfect;

        public PerfectRoundResult(boolean teamAPerfect, boolean teamBPerfect) {
            this.teamAPerfect = teamAPerfect;
            this.teamBPerfect = teamBPerfect;
        }
    }
}
