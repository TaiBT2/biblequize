package com.biblequiz.service;

import com.biblequiz.modules.tournament.entity.TournamentMatch;
import com.biblequiz.modules.tournament.entity.TournamentMatchParticipant;
import com.biblequiz.modules.tournament.repository.TournamentMatchParticipantRepository;
import com.biblequiz.modules.tournament.repository.TournamentMatchRepository;
import com.biblequiz.modules.tournament.service.TournamentMatchService;
import com.biblequiz.modules.tournament.service.TournamentService;
import com.biblequiz.modules.user.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TournamentMatchServiceTest {

    @Mock
    private TournamentMatchRepository matchRepository;

    @Mock
    private TournamentMatchParticipantRepository matchParticipantRepository;

    @Mock
    private TournamentService tournamentService;

    @InjectMocks
    private TournamentMatchService matchService;

    private static final String MATCH_ID = "match-1";
    private static final String USER_P1 = "player-1";
    private static final String USER_P2 = "player-2";

    private TournamentMatch match;
    private TournamentMatchParticipant p1;
    private TournamentMatchParticipant p2;
    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        match = new TournamentMatch();
        match.setId(MATCH_ID);
        match.setStatus(TournamentMatch.Status.IN_PROGRESS);

        user1 = new User();
        user1.setId(USER_P1);
        user1.setName("Player 1");

        user2 = new User();
        user2.setId(USER_P2);
        user2.setName("Player 2");

        p1 = new TournamentMatchParticipant("mp-1", match, user1);
        p1.setLives(3);
        p1.setScore(0);
        p1.setCorrectAnswers(0);
        p1.setTotalAnswered(0);

        p2 = new TournamentMatchParticipant("mp-2", match, user2);
        p2.setLives(3);
        p2.setScore(0);
        p2.setCorrectAnswers(0);
        p2.setTotalAnswered(0);

        lenient().when(matchRepository.findById(MATCH_ID)).thenReturn(Optional.of(match));
        lenient().when(matchParticipantRepository.findByMatchIdAndUserId(MATCH_ID, USER_P1))
                .thenReturn(Optional.of(p1));
        lenient().when(matchParticipantRepository.findByMatchIdAndUserId(MATCH_ID, USER_P2))
                .thenReturn(Optional.of(p2));
        lenient().when(matchParticipantRepository.findByMatchId(MATCH_ID))
                .thenReturn(List.of(p1, p2));
        lenient().when(matchParticipantRepository.save(any(TournamentMatchParticipant.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        lenient().when(matchRepository.save(any(TournamentMatch.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // ── TC-TOURN-003: Player answers wrong 3 times → lives=0 → match ends ───

    @Order(1)
    @Test
    void TC_TOURN_003_playerLosesAllLives_matchEndsOpponentWins() {
        // P1 answers wrong 3 times
        Map<String, Object> result1 = matchService.submitAnswer(MATCH_ID, USER_P1, false);
        assertEquals(2, p1.getLives());
        assertNull(result1.get("matchEnded")); // Not ended yet

        Map<String, Object> result2 = matchService.submitAnswer(MATCH_ID, USER_P1, false);
        assertEquals(1, p1.getLives());
        assertNull(result2.get("matchEnded"));

        Map<String, Object> result3 = matchService.submitAnswer(MATCH_ID, USER_P1, false);
        assertEquals(0, p1.getLives());

        // Match should be completed, P2 wins
        assertTrue((Boolean) result3.get("matchEnded"));
        assertEquals(USER_P2, result3.get("winnerId"));
        assertEquals(TournamentMatch.Status.COMPLETED, match.getStatus());
        assertEquals(USER_P2, match.getWinnerId());
        assertFalse(p1.getIsWinner());
        assertTrue(p2.getIsWinner());

        verify(tournamentService).advanceWinner(match);
    }

    // ── TC-TOURN-005: submitAnswer when match COMPLETED → returns error ──────

    @Order(2)
    @Test
    void TC_TOURN_005_submitAnswer_whenMatchCompleted_shouldReturnError() {
        match.setStatus(TournamentMatch.Status.COMPLETED);

        Map<String, Object> result = matchService.submitAnswer(MATCH_ID, USER_P1, true);

        assertEquals("Match is already completed", result.get("error"));
        verify(matchParticipantRepository, never()).save(any());
    }

    // ── submitAnswer correct → score increases, lives unchanged ──────────────

    @Order(3)
    @Test
    void submitAnswer_correctAnswer_shouldIncreaseScoreAndKeepLives() {
        Map<String, Object> result = matchService.submitAnswer(MATCH_ID, USER_P1, true);

        assertEquals(3, p1.getLives()); // Lives unchanged
        assertEquals(10, p1.getScore()); // +10 per correct
        assertEquals(1, p1.getCorrectAnswers());
        assertEquals(1, p1.getTotalAnswered());
        assertNull(result.get("matchEnded"));
    }

    // ── getMatchState returns both participants' data ─────────────────────────

    @Order(4)
    @Test
    void getMatchState_shouldReturnBothParticipantsData() {
        p1.setScore(30);
        p1.setLives(2);
        p1.setCorrectAnswers(3);
        p2.setScore(20);
        p2.setLives(3);
        p2.setCorrectAnswers(2);

        Map<String, Object> state = matchService.getMatchState(MATCH_ID);

        assertEquals(MATCH_ID, state.get("matchId"));
        assertEquals("IN_PROGRESS", state.get("status"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> participants = (List<Map<String, Object>>) state.get("participants");
        assertNotNull(participants);
        assertEquals(2, participants.size());

        // Verify participant data is present
        boolean foundP1 = false, foundP2 = false;
        for (Map<String, Object> pInfo : participants) {
            if (USER_P1.equals(pInfo.get("userId"))) {
                assertEquals(30, pInfo.get("score"));
                assertEquals(2, pInfo.get("lives"));
                foundP1 = true;
            } else if (USER_P2.equals(pInfo.get("userId"))) {
                assertEquals(20, pInfo.get("score"));
                assertEquals(3, pInfo.get("lives"));
                foundP2 = true;
            }
        }
        assertTrue(foundP1, "P1 data should be in participants");
        assertTrue(foundP2, "P2 data should be in participants");
    }

    // ── getMatchState for non-existent match → error ─────────────────────────

    @Order(5)
    @Test
    void getMatchState_nonExistentMatch_shouldReturnError() {
        when(matchRepository.findById("no-such-match")).thenReturn(Optional.empty());

        Map<String, Object> result = matchService.getMatchState("no-such-match");

        assertEquals("Match not found", result.get("error"));
    }

    // ── FIX-004: Sudden Death tie-break tests ───────────────────────────────

    @Order(6)
    @Test
    void triggerSuddenDeath_equalLives_shouldStartSuddenDeath() {
        p1.setLives(2);
        p2.setLives(2);

        Map<String, Object> result = matchService.triggerSuddenDeath(MATCH_ID);

        assertTrue((Boolean) result.get("suddenDeath"));
        assertEquals(1, result.get("round"));
        assertEquals(10, result.get("timeLimitSec"));
        assertTrue(match.isSuddenDeath());
        assertEquals(1, match.getSuddenDeathRound());
    }

    @Order(7)
    @Test
    void triggerSuddenDeath_unequalLives_shouldEndMatchImmediately() {
        p1.setLives(2);
        p2.setLives(1);

        Map<String, Object> result = matchService.triggerSuddenDeath(MATCH_ID);

        assertTrue((Boolean) result.get("matchEnded"));
        assertEquals(USER_P1, result.get("winnerId"));
        assertEquals("more_lives", result.get("reason"));
    }

    @Order(8)
    @Test
    void resolveSuddenDeath_p1CorrectP2Wrong_p1Wins() {
        match.setSuddenDeath(true);
        match.setSuddenDeathRound(1);

        Map<String, Object> result = matchService.resolveSuddenDeathRound(
                MATCH_ID, true, 3000, false, 5000);

        assertTrue((Boolean) result.get("matchEnded"));
        assertEquals(USER_P1, result.get("winnerId"));
        assertEquals("correct_vs_wrong", result.get("reason"));
    }

    @Order(9)
    @Test
    void resolveSuddenDeath_p2CorrectP1Wrong_p2Wins() {
        match.setSuddenDeath(true);
        match.setSuddenDeathRound(1);

        Map<String, Object> result = matchService.resolveSuddenDeathRound(
                MATCH_ID, false, 5000, true, 3000);

        assertTrue((Boolean) result.get("matchEnded"));
        assertEquals(USER_P2, result.get("winnerId"));
        assertEquals("correct_vs_wrong", result.get("reason"));
    }

    @Order(10)
    @Test
    void resolveSuddenDeath_bothCorrect_fasterWins() {
        match.setSuddenDeath(true);
        match.setSuddenDeathRound(1);

        // P1 answers in 2000ms, P2 in 5000ms (diff=3000ms > 200ms threshold)
        Map<String, Object> result = matchService.resolveSuddenDeathRound(
                MATCH_ID, true, 2000, true, 5000);

        assertTrue((Boolean) result.get("matchEnded"));
        assertEquals(USER_P1, result.get("winnerId"));
        assertEquals("faster_answer", result.get("reason"));
    }

    @Order(11)
    @Test
    void resolveSuddenDeath_bothCorrect_closeTimes_continues() {
        match.setSuddenDeath(true);
        match.setSuddenDeathRound(1);

        // Both correct, diff < 200ms → continue
        Map<String, Object> result = matchService.resolveSuddenDeathRound(
                MATCH_ID, true, 3000, true, 3100);

        assertTrue((Boolean) result.get("continue"));
        assertEquals(2, result.get("nextRound"));
        assertEquals(2, match.getSuddenDeathRound());
    }

    @Order(12)
    @Test
    void resolveSuddenDeath_bothWrong_continues() {
        match.setSuddenDeath(true);
        match.setSuddenDeathRound(1);

        Map<String, Object> result = matchService.resolveSuddenDeathRound(
                MATCH_ID, false, 5000, false, 6000);

        assertTrue((Boolean) result.get("continue"));
        assertEquals(2, result.get("nextRound"));
    }

    @Order(13)
    @Test
    void resolveSuddenDeath_maxRoundsReached_totalElapsedWins() {
        match.setSuddenDeath(true);
        match.setSuddenDeathRound(5); // max round

        // Set accumulated elapsed: P1 total faster
        p1.setTotalElapsedMs(10000);
        p2.setTotalElapsedMs(15000);

        Map<String, Object> result = matchService.resolveSuddenDeathRound(
                MATCH_ID, false, 3000, false, 4000);

        // P1 total: 10000+3000=13000, P2 total: 15000+4000=19000 → P1 wins
        assertTrue((Boolean) result.get("matchEnded"));
        assertEquals(USER_P1, result.get("winnerId"));
        assertEquals("total_elapsed", result.get("reason"));
    }

    @Order(14)
    @Test
    void resolveSuddenDeath_p1CorrectP2Timeout_p1Wins() {
        match.setSuddenDeath(true);
        match.setSuddenDeathRound(1);

        // P2 timeout = treated as wrong (isCorrect=false), elapsedMs = timeLimitMs (10000)
        Map<String, Object> result = matchService.resolveSuddenDeathRound(
                MATCH_ID, true, 3000, false, 10000);

        assertTrue((Boolean) result.get("matchEnded"));
        assertEquals(USER_P1, result.get("winnerId"));
        assertEquals("correct_vs_wrong", result.get("reason"));
    }
}
