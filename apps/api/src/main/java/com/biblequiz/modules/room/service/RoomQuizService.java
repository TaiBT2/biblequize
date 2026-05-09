package com.biblequiz.modules.room.service;

import com.biblequiz.api.websocket.RoomWebSocketController;
import com.biblequiz.api.websocket.WebSocketMessage;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.entity.RoomRound;
import com.biblequiz.modules.room.repository.RoomAnswerRepository;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;
import com.biblequiz.modules.room.repository.RoomRepository;
import com.biblequiz.modules.room.repository.RoomRoundRepository;
import com.biblequiz.modules.userquiz.entity.UserQuestion;
import com.biblequiz.modules.userquiz.repository.QuestionSetItemRepository;
import com.biblequiz.modules.userquiz.repository.RoomQuestionSelectionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Điều phối luồng quiz bất đồng bộ cho multiplayer room.
 * Hỗ trợ các game mode: Speed Race, Battle Royale (Tuần 2), Team vs Team, Sudden Death (Tuần 3).
 */
@Service
public class RoomQuizService {

    private static final Logger log = LoggerFactory.getLogger(RoomQuizService.class);

    @Autowired private QuestionRepository questionRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private RoomQuestionSelectionRepository roomQuestionSelectionRepo;
    @Autowired private QuestionSetItemRepository questionSetItemRepo;
    @Autowired private RoomWebSocketController wsController;
    @Autowired private RoomService roomService;
    @Autowired private RoomStateService roomStateService;
    @Autowired private RoomRoundRepository roomRoundRepository;
    @Autowired private RoomAnswerRepository roomAnswerRepository;
    @Autowired private RoomPlayerRepository roomPlayerRepository;
    @Autowired private SpeedRaceScoringService speedRaceScoringService;
    @Autowired private BattleRoyaleEngine battleRoyaleEngine;
    @Autowired private TeamScoringService teamScoringService;
    @Autowired private SuddenDeathMatchService suddenDeathMatchService;
    @Autowired private SequentialScoringService sequentialScoringService;

    private static final int BETWEEN_QUESTION_DELAY_MS = 3000;
    /** Poll cadence for the early-end watcher. 250ms = up to 0.25s slack
     *  before the round ends after the last answer arrives — feels
     *  instant to players without hammering the DB. */
    private static final int ROUND_POLL_INTERVAL_MS = 250;

    /**
     * Wait until either the timeLimit elapses or every expected player
     * has answered the round, whichever comes first. Returns early so
     * the next QUESTION_START doesn't sit idle when the room is fast.
     *
     * @param roundId          DB id of the active round
     * @param timeLimitMs      hard timeout (timePerQuestion × 1000)
     * @param expectedAnswers  number of submissions that signals "done"
     *                         (active player count for Speed Race / BR /
     *                         Team modes; 2 for Sudden Death 1v1)
     */
    // package-private for unit test — see RoomQuizServiceWaitTest
    void waitForRoundEnd(String roundId, long timeLimitMs, int expectedAnswers)
            throws InterruptedException {
        if (expectedAnswers <= 0) {
            // Nothing to wait for — no active players. Still respect the
            // full timer so observers see the round play out normally.
            Thread.sleep(timeLimitMs);
            return;
        }
        long deadline = System.currentTimeMillis() + timeLimitMs;
        while (System.currentTimeMillis() < deadline) {
            long submitted = roomAnswerRepository.countByRoundId(roundId);
            if (submitted >= expectedAnswers) return;
            // Sleep up to the poll interval, but never past the deadline.
            long remaining = deadline - System.currentTimeMillis();
            Thread.sleep(Math.min(ROUND_POLL_INTERVAL_MS, Math.max(1, remaining)));
        }
    }
    /** Sprint 2: bumped 3 → 5 to give the cinematic countdown overlay
     *  enough room for "5-4-3-2-1-BẮT ĐẦU!" + the gameStart sound. The
     *  Sprint 1 fix that removed the redundant ROOM_STARTING send means
     *  this is now the single source of truth — every client times off
     *  the same broadcast moment. */
    private static final int GAME_STARTING_COUNTDOWN_S = 5;

    @Async
    public void runQuiz(String roomId, int questionCount, int timePerQuestion, Room.RoomMode mode) {
        log.info("Quiz bắt đầu cho phòng {} | mode={} | {} câu | {}s/câu", roomId, mode, questionCount, timePerQuestion);
        try {
            broadcastGameStarting(roomId, GAME_STARTING_COUNTDOWN_S);
            Thread.sleep(GAME_STARTING_COUNTDOWN_S * 1000L);

            switch (mode) {
                case BATTLE_ROYALE -> runBattleRoyale(roomId, questionCount, timePerQuestion);
                case TEAM_VS_TEAM -> runTeamVsTeam(roomId, questionCount, timePerQuestion);
                case SUDDEN_DEATH -> runSuddenDeath(roomId, questionCount, timePerQuestion);
                case GROUP_LIVE_SEQUENTIAL -> runGroupLiveSequential(roomId, questionCount, timePerQuestion);
                default -> runSpeedRace(roomId, questionCount, timePerQuestion);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Quiz bị ngắt cho phòng {}", roomId);
            safeEndRoom(roomId);
        } catch (Exception e) {
            log.error("Lỗi khi chạy quiz cho phòng {}: {}", roomId, e.getMessage(), e);
            safeEndRoom(roomId);
        }
    }

    // ────────────────────────────── SPEED RACE ──────────────────────────────

    private void runSpeedRace(String roomId, int questionCount, int timePerQuestion) throws InterruptedException {
        List<Question> questions = loadQuestionsForRoom(roomId, questionCount);
        if (questions.isEmpty()) {
            roomService.endRoom(roomId);
            wsController.broadcastQuizEnd(roomId, List.of());
            return;
        }

        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            RoomRound round = saveRound(roomId, new RoomRound(UUID.randomUUID().toString(), null, i, q.getId(), LocalDateTime.now()));
            roomStateService.setCurrentRoundId(roomId, round.getId());

            wsController.broadcastQuestionStart(roomId, i, questions.size(), buildQuestionDto(q), timePerQuestion);
            // End the round as soon as every active player has answered;
            // otherwise wait the full timer.
            int expected = (int) roomPlayerRepository.countByRoomIdAndPlayerStatus(roomId, RoomPlayer.PlayerStatus.ACTIVE);
            waitForRoundEnd(round.getId(), timePerQuestion * 1000L, expected);

            round.setEndedAt(LocalDateTime.now());
            roomRoundRepository.save(round);
            wsController.broadcastRoundEnd(roomId, q.getCorrectAnswer().get(0));

            if (i < questions.size() - 1) Thread.sleep(BETWEEN_QUESTION_DELAY_MS);
        }

        List<RoomService.LeaderboardEntryDTO> finalResults = roomService.getRoomLeaderboard(roomId);
        roomService.endRoom(roomId);
        wsController.broadcastQuizEnd(roomId, finalResults);
        log.info("Speed Race kết thúc cho phòng {}", roomId);
    }

    // ────────────────────────────── BATTLE ROYALE ──────────────────────────────

    private void runBattleRoyale(String roomId, int questionCount, int timePerQuestion) throws InterruptedException {
        List<Question> questions = loadQuestionsForRoom(roomId, questionCount);
        if (questions.isEmpty()) {
            roomService.endRoom(roomId);
            wsController.broadcastQuizEnd(roomId, List.of());
            return;
        }

        int totalPlayers = (int) roomPlayerRepository.countByRoomIdAndPlayerStatus(roomId, RoomPlayer.PlayerStatus.ACTIVE);
        // Broadcast initial count
        wsController.broadcastBattleRoyaleUpdate(roomId, totalPlayers, totalPlayers);

        for (int i = 0; i < questions.size(); i++) {
            long activeCount = roomPlayerRepository.countByRoomIdAndPlayerStatus(roomId, RoomPlayer.PlayerStatus.ACTIVE);
            if (activeCount <= 1) break; // Game ends when ≤ 1 active player

            Question q = questions.get(i);
            RoomRound round = saveRound(roomId, new RoomRound(UUID.randomUUID().toString(), null, i, q.getId(), LocalDateTime.now()));
            roomStateService.setCurrentRoundId(roomId, round.getId());

            wsController.broadcastQuestionStart(roomId, i, questions.size(), buildQuestionDto(q), timePerQuestion);
            // Battle Royale: only ACTIVE players answer (eliminated are
            // out of rotation). End early when all of them submit.
            waitForRoundEnd(round.getId(), timePerQuestion * 1000L, (int) activeCount);

            round.setEndedAt(LocalDateTime.now());
            roomRoundRepository.save(round);

            // Broadcast đáp án đúng
            wsController.broadcastRoundEnd(roomId, q.getCorrectAnswer().get(0));

            // Xử lý elimination
            List<BattleRoyaleEngine.EliminatedPlayerInfo> eliminated = battleRoyaleEngine.processRoundEnd(roomId, round.getId());
            long remaining = roomPlayerRepository.countByRoomIdAndPlayerStatus(roomId, RoomPlayer.PlayerStatus.ACTIVE);

            // Broadcast từng người bị loại
            for (BattleRoyaleEngine.EliminatedPlayerInfo e : eliminated) {
                wsController.broadcastPlayerEliminated(roomId, e.userId, e.username, e.rank, (int) remaining);
            }

            if (!eliminated.isEmpty()) {
                wsController.broadcastBattleRoyaleUpdate(roomId, (int) remaining, totalPlayers);
            }

            if (i < questions.size() - 1) Thread.sleep(BETWEEN_QUESTION_DELAY_MS);
        }

        // Gán rank cuối cho những người còn lại
        battleRoyaleEngine.assignFinalRanks(roomId);

        List<RoomService.LeaderboardEntryDTO> finalResults = roomService.getRoomLeaderboardWithRanks(roomId);
        roomService.endRoom(roomId);
        wsController.broadcastQuizEnd(roomId, finalResults);
        log.info("Battle Royale kết thúc cho phòng {}", roomId);
    }

    // ────────────────────────────── TEAM VS TEAM ──────────────────────────────

    private void runTeamVsTeam(String roomId, int questionCount, int timePerQuestion) throws InterruptedException {
        List<Question> questions = loadQuestionsForRoom(roomId, questionCount);
        if (questions.isEmpty()) {
            roomService.endRoom(roomId);
            wsController.broadcastQuizEnd(roomId, List.of());
            return;
        }

        // Broadcast team assignments
        List<RoomPlayer> allPlayers = roomPlayerRepository.findByRoomId(roomId);
        List<WebSocketMessage.TeamAssignmentData.TeamPlayerInfo> teamInfo = allPlayers.stream()
                .map(p -> new WebSocketMessage.TeamAssignmentData.TeamPlayerInfo(
                        p.getUser().getId(), p.getUsername(),
                        p.getTeam() != null ? p.getTeam().name() : "A"))
                .collect(Collectors.toList());
        wsController.broadcastTeamAssignment(roomId, teamInfo);

        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            RoomRound round = saveRound(roomId, new RoomRound(UUID.randomUUID().toString(), null, i, q.getId(), LocalDateTime.now()));
            roomStateService.setCurrentRoundId(roomId, round.getId());

            wsController.broadcastQuestionStart(roomId, i, questions.size(), buildQuestionDto(q), timePerQuestion);
            // Team vs Team: every player on either side gets to answer.
            int expectedTvT = (int) roomPlayerRepository.countByRoomIdAndPlayerStatus(roomId, RoomPlayer.PlayerStatus.ACTIVE);
            waitForRoundEnd(round.getId(), timePerQuestion * 1000L, expectedTvT);

            round.setEndedAt(LocalDateTime.now());
            roomRoundRepository.save(round);
            wsController.broadcastRoundEnd(roomId, q.getCorrectAnswer().get(0));

            // Perfect Round check
            TeamScoringService.PerfectRoundResult perfect = teamScoringService.processPerfectRound(roomId, round.getId());
            if (perfect.teamAPerfect || perfect.teamBPerfect) {
                wsController.broadcastPerfectRound(roomId, perfect.teamAPerfect, perfect.teamBPerfect);
            }

            // Team score update
            TeamScoringService.TeamScores scores = teamScoringService.calculateTeamScores(roomId);
            wsController.broadcastTeamScoreUpdate(roomId, scores.teamA, scores.teamB);

            if (i < questions.size() - 1) Thread.sleep(BETWEEN_QUESTION_DELAY_MS);
        }

        TeamScoringService.TeamScores finalScores = teamScoringService.calculateTeamScores(roomId);
        String winner = teamScoringService.determineWinner(finalScores);

        List<RoomService.LeaderboardEntryDTO> finalResults = roomService.getRoomLeaderboard(roomId);
        Map<String, Object> endData = Map.of(
                "teamWinner", winner,
                "scoreA", finalScores.teamA,
                "scoreB", finalScores.teamB,
                "leaderboard", finalResults);

        roomService.endRoom(roomId);
        wsController.broadcastQuizEnd(roomId, endData);
        log.info("Team vs Team kết thúc cho phòng {} | winner=Team{}", roomId, winner);
    }

    // ────────────────────────────── SUDDEN DEATH ──────────────────────────────

    private void runSuddenDeath(String roomId, int questionCount, int timePerQuestion) throws InterruptedException {
        List<Question> questions = loadQuestionsForRoom(roomId, questionCount);
        if (questions.isEmpty()) {
            roomService.endRoom(roomId);
            wsController.broadcastQuizEnd(roomId, List.of());
            return;
        }

        // Init queue: all players to SPECTATOR, sorted by join time
        suddenDeathMatchService.initializeQueue(roomId);

        // Start first match
        SuddenDeathMatchService.MatchInfo match = suddenDeathMatchService.startNextMatch(roomId);
        if (match == null) {
            roomService.endRoom(roomId);
            wsController.broadcastQuizEnd(roomId, List.of());
            return;
        }
        wsController.broadcastMatchStart(roomId, match.championId, match.championName, match.championStreak,
                match.challengerId, match.challengerName, suddenDeathMatchService.getQueueSize(roomId));

        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            RoomRound round = saveRound(roomId, new RoomRound(UUID.randomUUID().toString(), null, i, q.getId(), LocalDateTime.now()));
            roomStateService.setCurrentRoundId(roomId, round.getId());

            wsController.broadcastQuestionStart(roomId, i, questions.size(), buildQuestionDto(q), timePerQuestion);
            // Sudden Death: only champion + challenger play this round (1v1).
            // End as soon as both have submitted.
            waitForRoundEnd(round.getId(), timePerQuestion * 1000L, 2);

            round.setEndedAt(LocalDateTime.now());
            roomRoundRepository.save(round);
            wsController.broadcastRoundEnd(roomId, q.getCorrectAnswer().get(0));

            // Process match outcome
            SuddenDeathMatchService.MatchResult result = suddenDeathMatchService.processRound(roomId, round.getId());
            if (result.outcome == SuddenDeathMatchService.MatchOutcome.MATCH_ENDED) {
                wsController.broadcastMatchEnd(roomId,
                        result.winner.userId, result.winner.username, result.winner.streak,
                        result.loser.userId, result.loser.username);

                Thread.sleep(2000L); // pause before next match

                // Start next match if challengers remain
                if (suddenDeathMatchService.hasNextChallenger(roomId)) {
                    match = suddenDeathMatchService.startNextMatch(roomId);
                    if (match != null) {
                        wsController.broadcastMatchStart(roomId, match.championId, match.championName, match.championStreak,
                                match.challengerId, match.challengerName, suddenDeathMatchService.getQueueSize(roomId));
                    }
                } else {
                    // No more challengers → game over
                    if (i < questions.size() - 1) Thread.sleep(BETWEEN_QUESTION_DELAY_MS);
                    break;
                }
            }

            if (i < questions.size() - 1) Thread.sleep(BETWEEN_QUESTION_DELAY_MS);
        }

        suddenDeathMatchService.assignFinalRanks(roomId);
        List<RoomService.LeaderboardEntryDTO> finalResults = roomService.getRoomLeaderboardWithRanks(roomId);
        roomService.endRoom(roomId);
        wsController.broadcastQuizEnd(roomId, finalResults);
        log.info("Sudden Death kết thúc cho phòng {}", roomId);
    }

    // ────────────────────────────── GROUP LIVE SEQUENTIAL ──────────────────────────────

    /**
     * Sequential mode: chờ all players trả lời (early-wake nếu xong sớm) → reveal
     * đáp án + per-player answers → đợi host bấm "Sang câu tiếp" → next question.
     * Khác Speed Race ở chỗ score đơn giản (đúng=100, sai=0) và pause cho thảo luận.
     */
    private void runGroupLiveSequential(String roomId, int questionCount, int timePerQuestion) throws InterruptedException {
        List<Question> questions = loadQuestionsForRoom(roomId, questionCount);
        if (questions.isEmpty()) {
            roomService.endRoom(roomId);
            wsController.broadcastQuizEnd(roomId, List.of());
            return;
        }

        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            RoomRound round = saveRound(roomId, new RoomRound(UUID.randomUUID().toString(), null, i, q.getId(), LocalDateTime.now()));
            roomStateService.setCurrentRoundId(roomId, round.getId());

            int activePlayers = (int) roomPlayerRepository.countByRoomIdAndPlayerStatus(roomId, RoomPlayer.PlayerStatus.ACTIVE);
            sequentialScoringService.beginRound(roomId, activePlayers);

            wsController.broadcastQuestionStart(roomId, i, questions.size(), buildQuestionDto(q), timePerQuestion);

            // Wait until all answered OR timeout (timer câu hỏi)
            boolean allAnswered = sequentialScoringService.awaitAllAnsweredOrTimeout(roomId, timePerQuestion);
            log.info("[Sequential] room={} q={} allAnswered={} answered={}/{}",
                    roomId, i, allAnswered,
                    sequentialScoringService.answeredCount(roomId),
                    sequentialScoringService.totalPlayers(roomId));

            round.setEndedAt(LocalDateTime.now());
            roomRoundRepository.save(round);

            // Reveal — gather per-player answers + correct answer
            wsController.broadcastQuestionRevealed(roomId, round.getId(), q.getCorrectAnswer().get(0), q.getExplanation());

            // Wait host's manual advance (bounded by 10-min safety)
            boolean leaderAdvanced = sequentialScoringService.awaitLeaderAdvance(roomId);
            sequentialScoringService.clearRound(roomId);
            if (!leaderAdvanced) {
                log.warn("[Sequential] room={} leader advance timeout — auto-skip to next", roomId);
            }
        }

        List<RoomService.LeaderboardEntryDTO> finalResults = roomService.getRoomLeaderboard(roomId);
        roomService.endRoom(roomId);
        wsController.broadcastQuizEnd(roomId, finalResults);
        log.info("Group Live Sequential kết thúc cho phòng {}", roomId);
    }

    // ────────────────────────────── HELPERS ──────────────────────────────

    private RoomRound saveRound(String roomId, RoomRound round) {
        roomRoundRepository.findByRoomIdAndRoundNo(roomId, round.getRoundNo())
                .ifPresent(existing -> roomRoundRepository.deleteById(existing.getId()));
        Room roomRef = new Room();
        roomRef.setId(roomId);
        round.setRoom(roomRef);
        return roomRoundRepository.save(round);
    }

    /**
     * Load questions for a room.
     * Priority 0: customQuestionIds on room (group quiz sets, direct IDs)
     * Priority 1: QuestionSet items (personal sets)
     * Priority 2: legacy RoomQuestionSelection
     * Fallback: random from Question DB by scope/difficulty
     */
    private List<Question> loadQuestionsForRoom(String roomId, int questionCount) {
        Room room = roomRepository.findById(roomId).orElseThrow();

        // Priority 0: direct question IDs stored on room (e.g., from group quiz set)
        if (room.getCustomQuestionIds() != null && !room.getCustomQuestionIds().isEmpty()) {
            List<Question> byIds = questionRepository.findAllById(room.getCustomQuestionIds());
            if (!byIds.isEmpty()) {
                log.info("[RoomQuizService] Room {} dùng {} questions từ customQuestionIds", roomId, byIds.size());
                return byIds;
            }
        }

        if (room.getQuestionSource() == Room.QuestionSource.CUSTOM) {
            // Priority 1: QuestionSet (personal sets)
            // Use the JOIN FETCH variant: this method runs inside @Async (no
            // open Hibernate session by default), so accessing the LAZY
            // userQuestion proxy via .findByQuestionSetIdOrderByOrderIndexAsc
            // would throw LazyInitializationException at toTransientQuestion.
            if (room.getQuestionSetId() != null) {
                List<Question> fromSet = questionSetItemRepo
                        .findByQuestionSetIdWithUserQuestion(room.getQuestionSetId())
                        .stream()
                        .map(i -> toTransientQuestion(i.getUserQuestion()))
                        .toList();
                if (!fromSet.isEmpty()) {
                    log.info("[RoomQuizService] Room {} dùng {} questions từ QuestionSet {}", roomId, fromSet.size(), room.getQuestionSetId());
                    return fromSet;
                }
            }
            // Priority 2: legacy RoomQuestionSelection — same JOIN FETCH
            // requirement for the same async-out-of-session reason.
            List<Question> custom = roomQuestionSelectionRepo
                    .findByRoomIdWithUserQuestion(roomId)
                    .stream()
                    .map(s -> toTransientQuestion(s.getUserQuestion()))
                    .toList();
            if (!custom.isEmpty()) {
                log.info("[RoomQuizService] Room {} dùng {} custom questions (legacy)", roomId, custom.size());
                return custom;
            }
            log.warn("[RoomQuizService] Room {} questionSource=CUSTOM nhưng chưa gán câu hỏi — fallback DB", roomId);
        }

        return loadQuestionsFromDatabase(room, questionCount);
    }

    private List<Question> loadQuestionsFromDatabase(Room room, int questionCount) {
        String scope = room.getBookScope() != null ? room.getBookScope() : "ALL";
        Room.RoomDifficulty diff = room.getDifficulty() != null ? room.getDifficulty() : Room.RoomDifficulty.MIXED;
        PageRequest page = PageRequest.of(0, questionCount);
        List<String> empty = List.of();

        boolean isSpecificBook = !"ALL".equals(scope) && !scope.endsWith("_TESTAMENT") && !"GOSPELS".equals(scope);

        if (diff != Room.RoomDifficulty.MIXED) {
            Question.Difficulty qDiff = Question.Difficulty.valueOf(diff.name());
            if (isSpecificBook) {
                return questionRepository.findRandomQuestionsByBookAndDifficultyExcludingIds(scope, qDiff, empty, page);
            }
            return questionRepository.findRandomQuestionsByDifficultyExcludingIds(qDiff, empty, page);
        }
        if (isSpecificBook) {
            return questionRepository.findRandomQuestionsByBookExcludingIds(scope, empty, page);
        }
        return questionRepository.findRandomQuestionsNative(questionCount);
    }

    /** Chuyển UserQuestion thành Question transient (không lưu DB) để dùng trong quiz flow. */
    private Question toTransientQuestion(UserQuestion uq) {
        Question q = new Question();
        q.setId(uq.getId());
        q.setContent(uq.getContent());
        q.setOptions(uq.getOptions());
        q.setCorrectAnswer(List.of(uq.getCorrectAnswer()));
        q.setExplanation(uq.getExplanation());
        q.setBook(uq.getBook() != null ? uq.getBook() : "");
        q.setChapter(uq.getChapterStart() != null ? uq.getChapterStart() : 0);
        q.setVerseStart(uq.getVerseStart() != null ? uq.getVerseStart() : 0);
        q.setVerseEnd(uq.getVerseEnd()   != null ? uq.getVerseEnd()   : 0);
        q.setLanguage(uq.getLanguage() != null ? uq.getLanguage() : "vi");
        return q;
    }

    private Map<String, Object> buildQuestionDto(Question q) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", q.getId());
        dto.put("content", q.getContent());
        dto.put("options", q.getOptions());
        dto.put("type", q.getType() != null ? q.getType().name() : "multiple_choice_single");
        dto.put("book", q.getBook());
        dto.put("chapter", q.getChapter());
        dto.put("correctAnswer", q.getCorrectAnswer() != null && !q.getCorrectAnswer().isEmpty()
                ? q.getCorrectAnswer().get(0) : 0);
        return dto;
    }

    private Map<String, Object> buildQuestionDtoFromUserQuestion(UserQuestion q) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", q.getId());
        dto.put("content", q.getContent());
        dto.put("options", q.getOptions());
        dto.put("type", "multiple_choice_single");
        dto.put("book", q.getBook() != null ? q.getBook() : "");
        dto.put("chapter", q.getChapterStart() != null ? q.getChapterStart() : 0);
        dto.put("correctAnswer", q.getCorrectAnswer());
        return dto;
    }

    private void broadcastGameStarting(String roomId, int countdown) {
        wsController.sendToRoom(roomId, new WebSocketMessage.Message(
                WebSocketMessage.MessageTypes.GAME_STARTING,
                Map.of("countdown", countdown, "roomId", roomId)));
    }

    private void safeEndRoom(String roomId) {
        try {
            roomService.endRoom(roomId);
            wsController.broadcastQuizEnd(roomId, List.of());
        } catch (Exception ex) {
            log.error("Lỗi khi kết thúc phòng {}: {}", roomId, ex.getMessage());
        }
    }
}
