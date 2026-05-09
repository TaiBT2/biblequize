package com.biblequiz.modules.room.service;

import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import com.biblequiz.modules.room.entity.Room;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;
import com.biblequiz.modules.room.repository.RoomRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomPlayerRepository roomPlayerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupQuizSetRepository groupQuizSetRepository;

    /** SPEC §5.4.0 R2 — single source of truth for "lobby idle ⇒ kill"
     *  threshold. Both the per-user lazy cleanup and the global scheduler
     *  sweep read this; previously the two disagreed (1h vs 2h), which the
     *  audit flagged as G8. Default 30 min mirrors the FE admin config
     *  default and SPEC §5.4.0. */
    @org.springframework.beans.factory.annotation.Value("${biblequiz.room.idle-timeout-minutes:30}")
    private long idleTimeoutMinutes;

    long getIdleTimeoutMinutes() { return idleTimeoutMinutes; }

    /**
     * Create a new room
     */
    public Room createRoom(String roomName, User host, Integer maxPlayers, Integer questionCount,
                           Integer timePerQuestion, Room.RoomMode mode, Boolean isPublic,
                           Room.RoomDifficulty difficulty, String bookScope,
                           Room.QuestionSource questionSource, String questionSetId) {
        String roomId = UUID.randomUUID().toString();
        String roomCode = generateRoomCode();

        while (roomRepository.findByRoomCode(roomCode).isPresent()) {
            roomCode = generateRoomCode();
        }

        Room room = new Room();
        room.setId(roomId);
        room.setRoomCode(roomCode);
        room.setRoomName(roomName);
        room.setHost(host);
        room.setMaxPlayers(maxPlayers != null ? maxPlayers : 4);
        room.setQuestionCount(questionCount != null ? questionCount : 10);
        room.setTimePerQuestion(timePerQuestion != null ? timePerQuestion : 30);
        room.setStatus(Room.RoomStatus.LOBBY);
        room.setMode(mode != null ? mode : Room.RoomMode.SPEED_RACE);
        room.setIsPublic(isPublic != null ? isPublic : false);
        room.setDifficulty(difficulty != null ? difficulty : Room.RoomDifficulty.MIXED);
        room.setBookScope(bookScope != null && !bookScope.isBlank() ? bookScope : "ALL");
        room.setQuestionSource(questionSource != null ? questionSource : Room.QuestionSource.DATABASE);
        if (questionSetId != null && !questionSetId.isBlank()) {
            room.setQuestionSetId(questionSetId);
        }

        roomRepository.save(room);

        // Host tự động vào phòng
        addPlayerToRoom(roomId, host);

        return room;
    }

    /**
     * Join a room by room code
     */
    public Room joinRoom(String roomCode, User user) throws Exception {
        Room room = roomRepository.findByRoomCode(roomCode)
            .orElseThrow(() -> new Exception("Phòng không tồn tại"));

        // Look up an existing membership first so we can support rejoin while
        // the room is IN_PROGRESS (Phase 6 case #3 — user left mid-game and
        // wants to come back to the same match).
        var existing = roomPlayerRepository.findByRoomIdAndUserId(room.getId(), user.getId());

        if (room.getStatus() == Room.RoomStatus.ENDED || room.getStatus() == Room.RoomStatus.CANCELLED) {
            throw new Exception("Phòng đã kết thúc");
        }

        if (room.getStatus() == Room.RoomStatus.IN_PROGRESS) {
            // Only previously-registered players can re-enter an in-progress
            // game. Brand-new joiners are blocked because there is no
            // late-join flow into an active quiz.
            if (existing.isEmpty()) {
                throw new Exception("Phòng đã bắt đầu");
            }
            RoomPlayer player = existing.get();
            if (player.getPlayerStatus() == RoomPlayer.PlayerStatus.LEFT) {
                player.setPlayerStatus(RoomPlayer.PlayerStatus.ACTIVE);
                roomPlayerRepository.save(player);
                syncPlayerCount(room);
            }
            return room;
        }

        // From here: status == LOBBY.
        if (room.isFull()) {
            throw new Exception("Phòng đã đầy người");
        }

        // Idempotent join: if user is already a member of this room, just
        // return it so the FE navigates them back into the lobby instead of
        // surfacing a confusing "already a member" error banner.
        if (existing.isPresent()) {
            return room;
        }

        // SPEC v1.1 §8.7: a user can be in only one active room at a time.
        // First, opportunistically clean up *this user's* stale lobby rooms
        // (host abandoned, never started, > idleTimeoutMinutes old) so an old
        // test room doesn't permanently lock them out.
        cleanupStaleLobbyForUser(user.getId());

        // Filter out the room they're trying to join (no-op for normal flow,
        // defensive in case the prior check missed a race).
        List<String> otherActive = roomPlayerRepository.findActiveRoomIdsByUserId(user.getId())
                .stream()
                .filter(id -> !id.equals(room.getId()))
                .toList();
        if (!otherActive.isEmpty()) {
            throw new Exception("ALREADY_IN_ANOTHER_ROOM");
        }

        addPlayerToRoom(room.getId(), user);

        return room;
    }

    // Note: pre-2026-05 a constant STALE_LOBBY_HOURS=1 lived here. It now
    // shares the configured idleTimeoutMinutes value (audit G8). The
    // accessor above is the single source.

    /**
     * B-1: Lazy per-user cleanup. For each LOBBY room the user is still
     * registered in: if the room is older than the configured idle timeout,
     * either end it (when the user is host) or just remove the user
     * (when host is someone else — let the host decide what to do with
     * remaining players).
     *
     * <p>Called on every joinRoom so the cleanup cost is amortised against
     * actual usage; combined with B-2 ({@link RoomCleanupScheduler}) this
     * keeps the "max 1 active room" rule from latching on dead state.
     */
    void cleanupStaleLobbyForUser(String userId) {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(idleTimeoutMinutes);
        List<String> activeRoomIds = roomPlayerRepository.findActiveRoomIdsByUserId(userId);
        for (String roomId : activeRoomIds) {
            Room r = roomRepository.findById(roomId).orElse(null);
            if (r == null || r.getStatus() != Room.RoomStatus.LOBBY) continue;
            if (r.getCreatedAt() != null && r.getCreatedAt().isAfter(cutoff)) continue;
            // Stale.
            if (r.getHost() != null && userId.equals(r.getHost().getId())) {
                r.setStatus(Room.RoomStatus.ENDED);
                r.setEndedAt(LocalDateTime.now());
                roomRepository.save(r);
            } else {
                roomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
                        .ifPresent(roomPlayerRepository::delete);
            }
        }
    }

    /**
     * B-2 helper: end every LOBBY room older than {@code cutoff}. Used by the
     * {@link RoomCleanupScheduler}; returns the number of rooms ended for
     * logging.
     */
    public int endLobbyRoomsOlderThan(LocalDateTime cutoff) {
        List<Room> stale = roomRepository.findStaleLobbyRooms(cutoff);
        LocalDateTime now = LocalDateTime.now();
        for (Room r : stale) {
            r.setStatus(Room.RoomStatus.ENDED);
            r.setEndedAt(now);
        }
        if (!stale.isEmpty()) roomRepository.saveAll(stale);
        return stale.size();
    }

    /**
     * Add player to room (auto-assign team for Team vs Team).
     *
     * <p>Source of truth = RoomPlayer rows. We previously also maintained a
     * parallel {@code @ElementCollection} on {@link Room#players} plus a
     * cached {@link Room#currentPlayers} counter, both mutated via
     * {@code Room.addPlayer()}. That denormalised state drifted out of sync
     * with the RoomPlayer table (lobby UI showed 2 players while the counter
     * stayed at 1, blocking start). The collection has been removed
     * (V45 migration) and {@code currentPlayers} is now always recomputed
     * from {@link RoomPlayerRepository#countByRoomId(String)} after each
     * insert/delete.
     */
    private void addPlayerToRoom(String roomId, User user) {
        Room room = roomRepository.findById(roomId).orElseThrow();

        // Idempotent: if user is already a member, don't insert a duplicate.
        if (roomPlayerRepository.findByRoomIdAndUserId(roomId, user.getId()).isPresent()) {
            return;
        }
        if (room.isFull()) {
            throw new RuntimeException("Phòng đã đầy người");
        }

        String playerId = UUID.randomUUID().toString();
        RoomPlayer roomPlayer = new RoomPlayer(playerId, room, user, user.getName());

        // Auto-balance teams for Team vs Team
        if (room.getMode() == Room.RoomMode.TEAM_VS_TEAM) {
            List<RoomPlayer> existing = roomPlayerRepository.findByRoomId(roomId);
            long countA = existing.stream().filter(p -> p.getTeam() == RoomPlayer.Team.A).count();
            long countB = existing.stream().filter(p -> p.getTeam() == RoomPlayer.Team.B).count();
            roomPlayer.setTeam(countA <= countB ? RoomPlayer.Team.A : RoomPlayer.Team.B);
        }

        roomPlayerRepository.save(roomPlayer);
        syncPlayerCount(room);
    }

    /**
     * Recompute {@link Room#currentPlayers} from the RoomPlayer table (the
     * authoritative source) and persist. Call after every insert/delete of a
     * RoomPlayer row so the cached counter stays in sync.
     */
    private void syncPlayerCount(Room room) {
        // currentPlayers reflects slots in use. Mid-game LEFT rows are
        // preserved for rejoin but should NOT block new joiners or inflate
        // the lobby roster count.
        int actual = (int) roomPlayerRepository.countOccupiedByRoomId(room.getId());
        room.setCurrentPlayers(actual);
        roomRepository.save(room);
    }

    /**
     * Switch player's team (Team vs Team, lobby only)
     */
    public void switchTeam(String roomId, String userId) throws Exception {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new Exception("Phòng không tồn tại"));
        if (room.getMode() != Room.RoomMode.TEAM_VS_TEAM) throw new Exception("Chỉ dùng cho Team vs Team");
        if (room.getStatus() != Room.RoomStatus.LOBBY) throw new Exception("Không thể đổi đội khi game đang chạy");

        RoomPlayer player = roomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new Exception("Người chơi không tìm thấy"));
        player.setTeam(player.getTeam() == RoomPlayer.Team.A ? RoomPlayer.Team.B : RoomPlayer.Team.A);
        roomPlayerRepository.save(player);
    }

    /**
     * Remove player from room
     */
    public void leaveRoom(String roomId, String userId) {
        Room room = roomRepository.findById(roomId).orElseThrow();

        // SPEC §5.4 / Phase 6 case #3: while a quiz is in progress we keep
        // the RoomPlayer row (status=LEFT) so the user can rejoin via
        // joinRoom. Hard-delete only happens in LOBBY (or after the game has
        // ended), so an interrupted-mid-game leave does not lock the user
        // out of their own match.
        boolean keepForRejoin = room.getStatus() == Room.RoomStatus.IN_PROGRESS;

        roomPlayerRepository.findByRoomIdAndUserId(roomId, userId).ifPresent(player -> {
            if (keepForRejoin) {
                player.setPlayerStatus(RoomPlayer.PlayerStatus.LEFT);
                player.setIsReady(false);
                roomPlayerRepository.save(player);
            } else {
                roomPlayerRepository.delete(player);
            }
        });
        syncPlayerCount(room);

        if (room.getCurrentPlayers() == 0 && !keepForRejoin) {
            roomRepository.delete(room);
        }
    }

    /**
     * Kick player from room (host only, lobby only)
     */
    public void kickPlayer(String roomId, String hostUserId, String targetUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại"));

        if (!room.getHost().getId().equals(hostUserId)) {
            throw new RuntimeException("FORBIDDEN");
        }

        if (room.getStatus() != Room.RoomStatus.LOBBY) {
            throw new RuntimeException("Chỉ kick được khi phòng đang ở lobby");
        }

        if (hostUserId.equals(targetUserId)) {
            throw new RuntimeException("Host không thể kick chính mình");
        }

        roomPlayerRepository.findByRoomIdAndUserId(roomId, targetUserId)
                .ifPresent(roomPlayerRepository::delete);
        syncPlayerCount(room);
    }

    /**
     * Toggle player ready status
     */
    public void togglePlayerReady(String roomId, String userId) throws Exception {
        roomRepository.findById(roomId).orElseThrow(() -> new Exception("Phòng không tồn tại"));
        RoomPlayer roomPlayer = roomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
            .orElseThrow(() -> new Exception("Người chơi không tìm thấy"));

        roomPlayer.setIsReady(!roomPlayer.getIsReady());
        roomPlayerRepository.save(roomPlayer);
    }

    /**
     * Start quiz for room
     */
    public void startRoom(String roomId, String userId) throws Exception {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new Exception("Phòng không tồn tại"));

        if (!room.getHost().getId().equals(userId)) {
            throw new Exception("Chỉ chủ phòng mới có thể bắt đầu");
        }

        // Source of truth = RoomPlayer rows. Room.currentPlayers/Room.players is a
        // denormalised counter that has been observed to drift out of sync with the
        // RoomPlayer table (see lobby UI showing 2 players while currentPlayers=1).
        long actualPlayers = roomPlayerRepository.findByRoomId(roomId).size();
        if (room.getStatus() != Room.RoomStatus.LOBBY || actualPlayers <= 1) {
            throw new Exception("Cần ít nhất 2 người chơi để bắt đầu");
        }

        // GROUP_LIVE_SEQUENTIAL: leader dẫn dắt session, không cần ceremony "ready" như các mode khác.
        // Các mode khác (SPEED_RACE, BATTLE_ROYALE, ...) yêu cầu non-host players ready
        // trước khi bắt đầu. Host được coi là implicitly ready khi bấm "Bắt đầu" — không
        // cần phải tự bấm "Sẵn sàng" cho chính mình (UI ở các mode hiện tại không hiển thị
        // toggle ready cho host).
        if (room.getMode() != Room.RoomMode.GROUP_LIVE_SEQUENTIAL) {
            List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);
            boolean allOthersReady = players.stream()
                    .filter(p -> !p.getUser().getId().equals(userId))
                    .allMatch(RoomPlayer::getIsReady);
            if (!allOthersReady) {
                throw new Exception("Tất cả người chơi phải sẵn sàng");
            }
        }

        room.setStatus(Room.RoomStatus.IN_PROGRESS);
        room.setStartedAt(LocalDateTime.now());
        roomRepository.save(room);
    }

    /**
     * End quiz for room
     */
    public void endRoom(String roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        // Idempotent: a second end (e.g. abandonment scheduler racing the
        // normal runQuiz finish) is a no-op. Avoids bumping updated_at and
        // re-triggering downstream side-effects.
        if (room.getStatus() == Room.RoomStatus.ENDED) {
            return;
        }
        room.setStatus(Room.RoomStatus.ENDED);
        room.setEndedAt(LocalDateTime.now());
        roomRepository.save(room);
    }

    /**
     * Get room details with players
     */
    public RoomDetailsDTO getRoomDetails(String roomId) throws Exception {
        return getRoomDetails(roomId, null);
    }

    /**
     * Get room details with viewer's userId so FE can identify "me" reliably
     * without falling back to username matching (which collides on duplicate names).
     */
    public RoomDetailsDTO getRoomDetails(String roomId, String viewerUserId) throws Exception {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new Exception("Phòng không tồn tại"));
        List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);

        // Derive owning group when room was created from a group quiz set, so
        // FE can reliably "back to group" even when react-router state was
        // dropped (page refresh, deep link, fresh tab joining via room code).
        String groupId = null;
        if (room.getGroupQuizSetId() != null) {
            groupId = groupQuizSetRepository.findById(room.getGroupQuizSetId())
                    .map(s -> s.getGroup() != null ? s.getGroup().getId() : null)
                    .orElse(null);
        }

        return new RoomDetailsDTO(room, players, viewerUserId, groupId);
    }

    /**
     * Get leaderboard for room (sorted by score)
     */
    public List<LeaderboardEntryDTO> getRoomLeaderboard(String roomId) {
        List<RoomPlayer> players = roomPlayerRepository.findByRoomIdOrderByScoreDesc(roomId);

        return players.stream()
            .map(player -> new LeaderboardEntryDTO(
                player.getUser().getId(),
                player.getUsername(),
                player.getAvatarUrl(),
                player.getScore(),
                player.getCorrectAnswers(),
                player.getTotalAnswered(),
                player.getAccuracy(),
                player.getFinalRank(),
                player.getPlayerStatus()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get leaderboard sorted by finalRank (for Battle Royale game end)
     */
    public List<LeaderboardEntryDTO> getRoomLeaderboardWithRanks(String roomId) {
        List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);

        return players.stream()
            .sorted(Comparator.comparingInt(p -> (p.getFinalRank() != null ? p.getFinalRank() : Integer.MAX_VALUE)))
            .map(player -> new LeaderboardEntryDTO(
                player.getUser().getId(),
                player.getUsername(),
                player.getAvatarUrl(),
                player.getScore(),
                player.getCorrectAnswers(),
                player.getTotalAnswered(),
                player.getAccuracy(),
                player.getFinalRank(),
                player.getPlayerStatus()
            ))
            .collect(Collectors.toList());
    }

    private static final List<String> TEST_ROOM_PREFIXES = List.of("WS Test", "E2E Test", "[TEST]", "[test]");

    private boolean isTestRoom(Room room) {
        return TEST_ROOM_PREFIXES.stream().anyMatch(prefix -> room.getRoomName().startsWith(prefix));
    }

    /**
     * Get public lobby rooms (all modes), filtered of test rooms
     */
    public List<PublicRoomDTO> getPublicRooms() {
        return roomRepository.findPublicLobbyRooms().stream()
            .filter(r -> !isTestRoom(r))
            .map(r -> {
                List<RoomPlayer> players = roomPlayerRepository.findByRoomId(r.getId());
                return new PublicRoomDTO(r, players);
            })
            .collect(Collectors.toList());
    }

    // SecureRandom shared across calls — Random was predictable enough that
    // a determined attacker could brute-force lobby codes. SecureRandom is
    // thread-safe per Sun JDK contract, so a static instance is fine.
    private static final SecureRandom CODE_RANDOM = new SecureRandom();
    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private String generateRoomCode() {
        StringBuilder code = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            code.append(CODE_CHARS.charAt(CODE_RANDOM.nextInt(CODE_CHARS.length())));
        }
        return code.toString();
    }

    // ===== DTOs =====

    public static class RoomDetailsDTO {
        public final String id;
        public final String roomCode;
        public final String roomName;
        public final Room.RoomStatus status;
        public final Room.RoomMode mode;
        public final Boolean isPublic;
        public final Integer maxPlayers;
        public final Integer currentPlayers;
        public final Integer questionCount;
        public final Integer timePerQuestion;
        public final String hostId;
        public final String hostName;
        public final String questionSource;
        public final String questionSetId;
        public final String bookScope;
        public final String difficulty;
        public final String createdAt;
        public final String myUserId;
        /** Owning group when room was spawned from a group quiz set; null otherwise. */
        public final String groupId;
        public final List<PlayerInfoDTO> players;

        public RoomDetailsDTO(Room room, List<RoomPlayer> roomPlayers) {
            this(room, roomPlayers, null, null);
        }

        public RoomDetailsDTO(Room room, List<RoomPlayer> roomPlayers, String viewerUserId) {
            this(room, roomPlayers, viewerUserId, null);
        }

        public RoomDetailsDTO(Room room, List<RoomPlayer> roomPlayers, String viewerUserId, String groupId) {
            this.id = room.getId();
            this.roomCode = room.getRoomCode();
            this.roomName = room.getRoomName();
            this.status = room.getStatus();
            this.mode = room.getMode();
            this.isPublic = room.getIsPublic();
            this.maxPlayers = room.getMaxPlayers();
            this.currentPlayers = roomPlayers.size();
            this.questionCount = room.getQuestionCount();
            this.timePerQuestion = room.getTimePerQuestion();
            this.hostId = room.getHost().getId();
            this.hostName = room.getHost().getName();
            this.questionSource = room.getQuestionSource() != null
                    ? room.getQuestionSource().name() : "DATABASE";
            this.questionSetId = room.getQuestionSetId();
            this.bookScope = room.getBookScope();
            this.difficulty = room.getDifficulty() != null ? room.getDifficulty().name() : "MIXED";
            this.createdAt = room.getCreatedAt() != null ? room.getCreatedAt().toString() : null;
            this.myUserId = viewerUserId;
            this.groupId = groupId;

            this.players = roomPlayers.stream()
                .map(player -> new PlayerInfoDTO(
                    player.getId(),
                    player.getUser().getId(),
                    player.getUsername(),
                    player.getAvatarUrl(),
                    player.getIsReady(),
                    player.getScore(),
                    player.getTeam(),
                    player.getPlayerStatus()
                ))
                .collect(Collectors.toList());
        }
    }

    public static class PlayerInfoDTO {
        public final String id;
        public final String userId;
        public final String username;
        public final String avatarUrl;
        public final Boolean isReady;
        public final Integer score;
        public final RoomPlayer.Team team;
        public final RoomPlayer.PlayerStatus playerStatus;

        public PlayerInfoDTO(String id, String userId, String username, String avatarUrl,
                             Boolean isReady, Integer score,
                             RoomPlayer.Team team, RoomPlayer.PlayerStatus playerStatus) {
            this.id = id;
            this.userId = userId;
            this.username = username;
            this.avatarUrl = avatarUrl;
            this.isReady = isReady;
            this.score = score;
            this.team = team;
            this.playerStatus = playerStatus;
        }
    }

    public static class LeaderboardEntryDTO {
        public final String playerId;
        public final String username;
        public final String avatarUrl;
        public final Integer score;
        public final Integer correctAnswers;
        public final Integer totalAnswered;
        public final Double accuracy;
        public final Integer finalRank;
        public final String playerStatus;

        public LeaderboardEntryDTO(String playerId, String username, String avatarUrl,
                                   Integer score, Integer correctAnswers, Integer totalAnswered, Double accuracy,
                                   Integer finalRank, RoomPlayer.PlayerStatus playerStatus) {
            this.playerId = playerId;
            this.username = username;
            this.avatarUrl = avatarUrl;
            this.score = score;
            this.correctAnswers = correctAnswers;
            this.totalAnswered = totalAnswered;
            this.accuracy = accuracy;
            this.finalRank = finalRank;
            this.playerStatus = playerStatus != null ? playerStatus.name() : null;
        }
    }

    public static class PublicRoomDTO {
        public final String id;
        public final String roomCode;
        public final String roomName;
        public final Room.RoomMode mode;
        public final Room.RoomStatus status;
        public final Boolean isPublic;
        public final Integer currentPlayers;
        public final Integer maxPlayers;
        public final Integer questionCount;
        public final Integer timePerQuestion;
        public final Room.RoomDifficulty difficulty;
        public final String bookScope;
        public final String hostName;
        public final String createdAt;
        public final List<String> playerInitials;

        public PublicRoomDTO(Room room, List<RoomPlayer> players) {
            this.id = room.getId();
            this.roomCode = room.getRoomCode();
            this.roomName = room.getRoomName();
            this.mode = room.getMode();
            this.status = room.getStatus();
            this.isPublic = room.getIsPublic();
            this.currentPlayers = room.getCurrentPlayers();
            this.maxPlayers = room.getMaxPlayers();
            this.questionCount = room.getQuestionCount();
            this.timePerQuestion = room.getTimePerQuestion();
            this.difficulty = room.getDifficulty();
            this.bookScope = room.getBookScope();
            this.hostName = room.getHost() != null ? room.getHost().getName() : null;
            this.createdAt = room.getCreatedAt() != null ? room.getCreatedAt().toString() : null;
            this.playerInitials = players.stream()
                .map(p -> p.getUsername() != null && !p.getUsername().isEmpty()
                    ? p.getUsername().substring(0, 1).toUpperCase()
                    : "?")
                .collect(Collectors.toList());
        }
    }
}
