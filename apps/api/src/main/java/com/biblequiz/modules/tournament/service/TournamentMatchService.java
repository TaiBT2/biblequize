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
