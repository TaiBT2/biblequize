package com.biblequiz.modules.tournament.service;

import com.biblequiz.modules.tournament.entity.TournamentMatch;
import com.biblequiz.modules.tournament.entity.TournamentMatchParticipant;
import com.biblequiz.modules.tournament.repository.TournamentMatchParticipantRepository;
import com.biblequiz.modules.tournament.repository.TournamentMatchRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TournamentMatchService {

    private static final Logger log = LoggerFactory.getLogger(TournamentMatchService.class);

    @Autowired
    private TournamentMatchRepository matchRepository;

    @Autowired
    private TournamentMatchParticipantRepository matchParticipantRepository;

    @Autowired
    private TournamentService tournamentService;

    public Map<String, Object> submitAnswer(String matchId, String userId, boolean isCorrect) {
        Map<String, Object> result = new HashMap<>();

        Optional<TournamentMatch> optMatch = matchRepository.findById(matchId);
        if (optMatch.isEmpty()) {
            result.put("error", "Match not found");
            return result;
        }

        TournamentMatch match = optMatch.get();

        if (match.getStatus() == TournamentMatch.Status.COMPLETED) {
            result.put("error", "Match is already completed");
            return result;
        }

        // If match is PENDING, start it
        if (match.getStatus() == TournamentMatch.Status.PENDING) {
            match.setStatus(TournamentMatch.Status.IN_PROGRESS);
            match.setStartedAt(LocalDateTime.now());
            matchRepository.save(match);
        }

        Optional<TournamentMatchParticipant> optParticipant =
                matchParticipantRepository.findByMatchIdAndUserId(matchId, userId);
        if (optParticipant.isEmpty()) {
            result.put("error", "User is not a participant in this match");
            return result;
        }

        TournamentMatchParticipant participant = optParticipant.get();
        participant.setTotalAnswered(participant.getTotalAnswered() + 1);

        if (isCorrect) {
            participant.setCorrectAnswers(participant.getCorrectAnswers() + 1);
            participant.setScore(participant.getScore() + 10);
        } else {
            participant.setLives(participant.getLives() - 1);
        }

        matchParticipantRepository.save(participant);

        // Check if this player lost all lives
        if (participant.getLives() <= 0) {
            // Find opponent
            List<TournamentMatchParticipant> allParticipants =
                    matchParticipantRepository.findByMatchId(matchId);
            TournamentMatchParticipant opponent = null;
            for (TournamentMatchParticipant mp : allParticipants) {
                if (!mp.getUser().getId().equals(userId)) {
                    opponent = mp;
                    break;
                }
            }

            if (opponent != null) {
                // Opponent wins
                participant.setIsWinner(false);
                matchParticipantRepository.save(participant);

                opponent.setIsWinner(true);
                matchParticipantRepository.save(opponent);

                match.setStatus(TournamentMatch.Status.COMPLETED);
                match.setWinnerId(opponent.getUser().getId());
                match.setEndedAt(LocalDateTime.now());
                matchRepository.save(match);

                // Advance bracket
                tournamentService.advanceWinner(match);

                result.put("matchEnded", true);
                result.put("winnerId", opponent.getUser().getId());
            }
        }

        // Build response with current state
        List<TournamentMatchParticipant> allParticipants =
                matchParticipantRepository.findByMatchId(matchId);

        result.put("matchId", matchId);
        result.put("matchStatus", match.getStatus().name());
        result.put("lives", participant.getLives());
        result.put("score", participant.getScore());

        // Find opponent lives
        for (TournamentMatchParticipant mp : allParticipants) {
            if (!mp.getUser().getId().equals(userId)) {
                result.put("opponentLives", mp.getLives());
                result.put("opponentScore", mp.getScore());
                break;
            }
        }

        return result;
    }

    /**
     * FIX-004: Trigger sudden death when both players finish regular questions with equal lives.
     * Called by the controller/WebSocket when the regular question phase ends.
     */
    public Map<String, Object> triggerSuddenDeath(String matchId) {
        Map<String, Object> result = new HashMap<>();

        Optional<TournamentMatch> optMatch = matchRepository.findById(matchId);
        if (optMatch.isEmpty()) {
            result.put("error", "Match not found");
            return result;
        }

        TournamentMatch match = optMatch.get();
        if (match.getStatus() == TournamentMatch.Status.COMPLETED) {
            result.put("error", "Match is already completed");
            return result;
        }

        List<TournamentMatchParticipant> participants = matchParticipantRepository.findByMatchId(matchId);
        if (participants.size() != 2) {
            result.put("error", "Invalid participant count for sudden death");
            return result;
        }

        TournamentMatchParticipant p1 = participants.get(0);
        TournamentMatchParticipant p2 = participants.get(1);

        if (p1.getLives() != p2.getLives()) {
            // Not a tie — the player with more lives wins
            TournamentMatchParticipant winner = p1.getLives() > p2.getLives() ? p1 : p2;
            TournamentMatchParticipant loser = winner == p1 ? p2 : p1;
            completeMatch(match, winner, loser);
            result.put("matchEnded", true);
            result.put("winnerId", winner.getUser().getId());
            result.put("reason", "more_lives");
            return result;
        }

        // Equal lives → start sudden death
        match.setSuddenDeath(true);
        match.setSuddenDeathRound(1);
        matchRepository.save(match);

        result.put("suddenDeath", true);
        result.put("matchId", matchId);
        result.put("round", 1);
        result.put("timeLimitSec", SUDDEN_DEATH_TIME_LIMIT_SEC);
        log.info("[TOURNAMENT] Sudden death started for match {}", matchId);
        return result;
    }

    private static final int SUDDEN_DEATH_TIME_LIMIT_SEC = 10;
    private static final int SUDDEN_DEATH_MAX_ROUNDS = 5;
    private static final long SUDDEN_DEATH_CLOSE_THRESHOLD_MS = 200;

    /**
     * FIX-004: Submit answer for a sudden death round.
     * Both players' answers are submitted, then the round is resolved.
     *
     * @param p1Correct  whether player 1 answered correctly
     * @param p1ElapsedMs player 1's response time in milliseconds
     * @param p2Correct  whether player 2 answered correctly
     * @param p2ElapsedMs player 2's response time in milliseconds
     */
    public Map<String, Object> resolveSuddenDeathRound(String matchId,
            boolean p1Correct, long p1ElapsedMs,
            boolean p2Correct, long p2ElapsedMs) {
        Map<String, Object> result = new HashMap<>();

        Optional<TournamentMatch> optMatch = matchRepository.findById(matchId);
        if (optMatch.isEmpty()) {
            result.put("error", "Match not found");
            return result;
        }

        TournamentMatch match = optMatch.get();
        if (!match.isSuddenDeath()) {
            result.put("error", "Match is not in sudden death mode");
            return result;
        }
        if (match.getStatus() == TournamentMatch.Status.COMPLETED) {
            result.put("error", "Match is already completed");
            return result;
        }

        List<TournamentMatchParticipant> participants = matchParticipantRepository.findByMatchId(matchId);
        if (participants.size() != 2) {
            result.put("error", "Invalid participant count");
            return result;
        }

        TournamentMatchParticipant p1 = participants.get(0);
        TournamentMatchParticipant p2 = participants.get(1);

        // Accumulate elapsed time
        p1.setTotalElapsedMs(p1.getTotalElapsedMs() + p1ElapsedMs);
        p2.setTotalElapsedMs(p2.getTotalElapsedMs() + p2ElapsedMs);
        matchParticipantRepository.save(p1);
        matchParticipantRepository.save(p2);

        int currentRound = match.getSuddenDeathRound();
        result.put("suddenDeathRound", currentRound);
        result.put("p1Correct", p1Correct);
        result.put("p2Correct", p2Correct);
        result.put("p1ElapsedMs", p1ElapsedMs);
        result.put("p2ElapsedMs", p2ElapsedMs);

        // Resolution per spec FIX-004
        if (p1Correct && !p2Correct) {
            // P1 wins
            completeMatch(match, p1, p2);
            result.put("matchEnded", true);
            result.put("winnerId", p1.getUser().getId());
            result.put("reason", "correct_vs_wrong");
        } else if (!p1Correct && p2Correct) {
            // P2 wins
            completeMatch(match, p2, p1);
            result.put("matchEnded", true);
            result.put("winnerId", p2.getUser().getId());
            result.put("reason", "correct_vs_wrong");
        } else if (p1Correct && p2Correct) {
            // Both correct → compare elapsed time
            long diff = Math.abs(p1ElapsedMs - p2ElapsedMs);
            if (diff >= SUDDEN_DEATH_CLOSE_THRESHOLD_MS) {
                // Faster player wins
                TournamentMatchParticipant winner = p1ElapsedMs < p2ElapsedMs ? p1 : p2;
                TournamentMatchParticipant loser = winner == p1 ? p2 : p1;
                completeMatch(match, winner, loser);
                result.put("matchEnded", true);
                result.put("winnerId", winner.getUser().getId());
                result.put("reason", "faster_answer");
            } else {
                // Too close (<200ms) → continue
                advanceOrFinalizeSD(match, p1, p2, currentRound, result);
            }
        } else {
            // Both wrong or both timeout → continue
            advanceOrFinalizeSD(match, p1, p2, currentRound, result);
        }

        return result;
    }

    /**
     * Advance to next sudden death round, or finalize if max rounds reached.
     */
    private void advanceOrFinalizeSD(TournamentMatch match,
            TournamentMatchParticipant p1, TournamentMatchParticipant p2,
            int currentRound, Map<String, Object> result) {
        if (currentRound >= SUDDEN_DEATH_MAX_ROUNDS) {
            // Max rounds reached → compare total elapsed
            if (p1.getTotalElapsedMs() != p2.getTotalElapsedMs()) {
                TournamentMatchParticipant winner =
                        p1.getTotalElapsedMs() < p2.getTotalElapsedMs() ? p1 : p2;
                TournamentMatchParticipant loser = winner == p1 ? p2 : p1;
                completeMatch(match, winner, loser);
                result.put("matchEnded", true);
                result.put("winnerId", winner.getUser().getId());
                result.put("reason", "total_elapsed");
            } else {
                // Extremely rare: exact same total elapsed → random winner
                TournamentMatchParticipant winner = Math.random() < 0.5 ? p1 : p2;
                TournamentMatchParticipant loser = winner == p1 ? p2 : p1;
                completeMatch(match, winner, loser);
                result.put("matchEnded", true);
                result.put("winnerId", winner.getUser().getId());
                result.put("reason", "random");
            }
        } else {
            // Continue to next round
            match.setSuddenDeathRound(currentRound + 1);
            matchRepository.save(match);
            result.put("continue", true);
            result.put("nextRound", currentRound + 1);
        }
    }

    private void completeMatch(TournamentMatch match,
            TournamentMatchParticipant winner, TournamentMatchParticipant loser) {
        winner.setIsWinner(true);
        loser.setIsWinner(false);
        matchParticipantRepository.save(winner);
        matchParticipantRepository.save(loser);

        match.setStatus(TournamentMatch.Status.COMPLETED);
        match.setWinnerId(winner.getUser().getId());
        match.setEndedAt(LocalDateTime.now());
        matchRepository.save(match);

        tournamentService.advanceWinner(match);
        log.info("[TOURNAMENT] Match {} completed. Winner: {}", match.getId(), winner.getUser().getId());
    }

    public Map<String, Object> getMatchState(String matchId) {
        Map<String, Object> result = new HashMap<>();

        Optional<TournamentMatch> optMatch = matchRepository.findById(matchId);
        if (optMatch.isEmpty()) {
            result.put("error", "Match not found");
            return result;
        }

        TournamentMatch match = optMatch.get();
        result.put("matchId", matchId);
        result.put("status", match.getStatus().name());
        result.put("roundNumber", match.getRoundNumber());
        result.put("matchIndex", match.getMatchIndex());
        result.put("winnerId", match.getWinnerId());
        result.put("isBye", match.isBye());

        List<TournamentMatchParticipant> participants =
                matchParticipantRepository.findByMatchId(matchId);

        List<Map<String, Object>> participantInfos = new ArrayList<>();
        for (TournamentMatchParticipant mp : participants) {
            Map<String, Object> pInfo = new HashMap<>();
            pInfo.put("userId", mp.getUser().getId());
            pInfo.put("userName", mp.getUser().getName());
            pInfo.put("lives", mp.getLives());
            pInfo.put("score", mp.getScore());
            pInfo.put("correctAnswers", mp.getCorrectAnswers());
            pInfo.put("totalAnswered", mp.getTotalAnswered());
            pInfo.put("isWinner", mp.getIsWinner());
            participantInfos.add(pInfo);
        }

        result.put("participants", participantInfos);
        return result;
    }
}
