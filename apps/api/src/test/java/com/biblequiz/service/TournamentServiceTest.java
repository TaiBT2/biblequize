package com.biblequiz.service;

import com.biblequiz.modules.tournament.entity.Tournament;
import com.biblequiz.modules.tournament.entity.TournamentMatch;
import com.biblequiz.modules.tournament.entity.TournamentMatchParticipant;
import com.biblequiz.modules.tournament.entity.TournamentParticipant;
import com.biblequiz.modules.tournament.repository.TournamentMatchParticipantRepository;
import com.biblequiz.modules.tournament.repository.TournamentMatchRepository;
import com.biblequiz.modules.tournament.repository.TournamentParticipantRepository;
import com.biblequiz.modules.tournament.repository.TournamentRepository;
import com.biblequiz.modules.tournament.service.TournamentService;
import com.biblequiz.modules.user.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TournamentServiceTest {

    @Mock
    private TournamentRepository tournamentRepository;

    @Mock
    private TournamentParticipantRepository participantRepository;

    @Mock
    private TournamentMatchRepository matchRepository;

    @Mock
    private TournamentMatchParticipantRepository matchParticipantRepository;

    @InjectMocks
    private TournamentService tournamentService;

    private User creatorUser;
    private User playerUser;
    private Tournament testTournament;

    @BeforeEach
    void setUp() {
        creatorUser = new User();
        creatorUser.setId("creator-1");
        creatorUser.setName("Creator");
        creatorUser.setEmail("creator@example.com");

        playerUser = new User();
        playerUser.setId("player-1");
        playerUser.setName("Player");
        playerUser.setEmail("player@example.com");

        testTournament = new Tournament("tourn-1", "Test Tournament", creatorUser, 8);
        testTournament.setStatus(Tournament.Status.LOBBY);
    }

    // ── createTournament ─────────────────────────────────────────────────────

    @Test
    void createTournament_withValidBracketSize_shouldCreateAndReturnId() {
        when(tournamentRepository.save(any(Tournament.class))).thenAnswer(inv -> inv.getArgument(0));
        when(participantRepository.save(any(TournamentParticipant.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = tournamentService.createTournament("My Tournament", creatorUser, 8);

        assertNotNull(result.get("tournamentId"));
        assertEquals("My Tournament", result.get("name"));
        assertEquals(8, result.get("bracketSize"));
        assertEquals("LOBBY", result.get("status"));
        assertEquals("creator-1", result.get("creatorId"));
        assertNull(result.get("error"));
        verify(tournamentRepository).save(any(Tournament.class));
        verify(participantRepository).save(any(TournamentParticipant.class));
    }

    @Test
    void createTournament_withInvalidBracketSize_shouldReturnError() {
        Map<String, Object> result = tournamentService.createTournament("Bad Tournament", creatorUser, 7);

        assertNotNull(result.get("error"));
        assertEquals("bracketSize must be a power of 2 (4, 8, 16, or 32)", result.get("error"));
        verify(tournamentRepository, never()).save(any());
    }

    // ── joinTournament ───────────────────────────────────────────────────────

    @Test
    void joinTournament_shouldAddParticipant() {
        when(tournamentRepository.findById("tourn-1")).thenReturn(Optional.of(testTournament));
        when(participantRepository.countByTournamentId("tourn-1")).thenReturn(1L);
        when(participantRepository.findByTournamentIdAndUserId("tourn-1", "player-1")).thenReturn(Optional.empty());
        when(participantRepository.save(any(TournamentParticipant.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = tournamentService.joinTournament("tourn-1", playerUser);

        assertNull(result.get("error"));
        assertEquals("tourn-1", result.get("tournamentId"));
        assertEquals("player-1", result.get("userId"));
        assertEquals(2L, result.get("participantCount"));
        verify(participantRepository).save(any(TournamentParticipant.class));
    }

    @Test
    void joinTournament_alreadyJoined_shouldReturnError() {
        when(tournamentRepository.findById("tourn-1")).thenReturn(Optional.of(testTournament));
        when(participantRepository.countByTournamentId("tourn-1")).thenReturn(1L);
        when(participantRepository.findByTournamentIdAndUserId("tourn-1", "player-1"))
                .thenReturn(Optional.of(new TournamentParticipant("p-1", testTournament, playerUser)));

        Map<String, Object> result = tournamentService.joinTournament("tourn-1", playerUser);

        assertEquals("Already joined this tournament", result.get("error"));
        verify(participantRepository, never()).save(any());
    }

    @Test
    void joinTournament_tournamentFull_shouldReturnError() {
        when(tournamentRepository.findById("tourn-1")).thenReturn(Optional.of(testTournament));
        when(participantRepository.countByTournamentId("tourn-1")).thenReturn(8L);

        Map<String, Object> result = tournamentService.joinTournament("tourn-1", playerUser);

        assertEquals("Tournament is full", result.get("error"));
        verify(participantRepository, never()).save(any());
    }

    // ── startTournament ──────────────────────────────────────────────────────

    @Test
    void startTournament_with8Players_shouldGenerate4Matches() {
        // Create 8 players
        List<TournamentParticipant> participants = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            User u = new User();
            u.setId("user-" + i);
            u.setName("Player " + i);
            TournamentParticipant p = new TournamentParticipant("p-" + i, testTournament, u);
            participants.add(p);
        }

        when(tournamentRepository.findById("tourn-1")).thenReturn(Optional.of(testTournament));
        when(participantRepository.findByTournamentId("tourn-1")).thenReturn(participants);
        when(participantRepository.save(any(TournamentParticipant.class))).thenAnswer(inv -> inv.getArgument(0));
        when(matchRepository.save(any(TournamentMatch.class))).thenAnswer(inv -> inv.getArgument(0));
        when(matchParticipantRepository.save(any(TournamentMatchParticipant.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tournamentRepository.save(any(Tournament.class))).thenAnswer(inv -> inv.getArgument(0));

        // For checkAndAdvanceRound - return the matches we just created (none completed yet)
        lenient().when(matchRepository.findByTournamentIdAndRoundNumber(eq("tourn-1"), eq(1)))
                .thenReturn(List.of(
                        createPendingMatch(testTournament, 1, 0),
                        createPendingMatch(testTournament, 1, 1),
                        createPendingMatch(testTournament, 1, 2),
                        createPendingMatch(testTournament, 1, 3)
                ));

        Map<String, Object> result = tournamentService.startTournament("tourn-1", "creator-1");

        assertNull(result.get("error"));
        assertEquals("tourn-1", result.get("tournamentId"));
        assertEquals(8, result.get("participantCount"));
        // 8 players => bracketSize 8 => 4 matches in round 1
        verify(matchRepository, times(4)).save(any(TournamentMatch.class));
    }

    @Test
    void startTournament_notCreator_shouldReturnError() {
        when(tournamentRepository.findById("tourn-1")).thenReturn(Optional.of(testTournament));

        Map<String, Object> result = tournamentService.startTournament("tourn-1", "player-1");

        assertEquals("Only the creator can start the tournament", result.get("error"));
    }

    // ── forfeitMatch ─────────────────────────────────────────────────────────

    @Test
    void forfeitMatch_shouldSetOpponentAsWinner() {
        User user1 = new User();
        user1.setId("user-1");
        user1.setName("User 1");
        User user2 = new User();
        user2.setId("user-2");
        user2.setName("User 2");

        TournamentMatch match = new TournamentMatch("match-1", testTournament, 1, 0);
        match.setStatus(TournamentMatch.Status.IN_PROGRESS);

        TournamentMatchParticipant mp1 = new TournamentMatchParticipant("mp-1", match, user1);
        TournamentMatchParticipant mp2 = new TournamentMatchParticipant("mp-2", match, user2);

        when(matchRepository.findById("match-1")).thenReturn(Optional.of(match));
        when(matchParticipantRepository.findByMatchId("match-1")).thenReturn(List.of(mp1, mp2));
        when(matchParticipantRepository.save(any(TournamentMatchParticipant.class))).thenAnswer(inv -> inv.getArgument(0));
        when(matchRepository.save(any(TournamentMatch.class))).thenAnswer(inv -> inv.getArgument(0));

        // Mocks for advanceWinner -> checkAndAdvanceRound
        lenient().when(matchRepository.findByTournamentIdAndRoundNumber(eq("tourn-1"), eq(1)))
                .thenReturn(List.of(match));
        lenient().when(participantRepository.findByTournamentIdAndUserId(anyString(), anyString()))
                .thenReturn(Optional.empty());

        Map<String, Object> result = tournamentService.forfeitMatch("tourn-1", "match-1", "user-1");

        assertNull(result.get("error"));
        assertEquals("match-1", result.get("matchId"));
        assertEquals("user-2", result.get("winnerId"));
        assertEquals("user-1", result.get("forfeitedBy"));
        assertEquals(TournamentMatch.Status.COMPLETED, match.getStatus());
        assertEquals("user-2", match.getWinnerId());
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private TournamentMatch createPendingMatch(Tournament tournament, int round, int index) {
        TournamentMatch match = new TournamentMatch(UUID.randomUUID().toString(), tournament, round, index);
        match.setStatus(TournamentMatch.Status.PENDING);
        return match;
    }
}
