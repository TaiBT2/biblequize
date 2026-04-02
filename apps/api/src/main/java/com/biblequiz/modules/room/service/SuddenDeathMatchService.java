package com.biblequiz.modules.room.service;

import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.repository.RoomAnswerRepository;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Quản lý luồng trận đấu Sudden Death 1v1.
 * - "King of the Hill": Champion giữ ghế nóng, Challenger lần lượt từ hàng chờ
 * - Ai trả lời sai → thua trận
 * - Cả hai đúng/sai → hòa, tiếp tục câu tiếp
 */
@Service
public class SuddenDeathMatchService {

    private static final int MAX_CONTINUES = 3;
    private static final long CLOSE_THRESHOLD_MS = 200;

    @Autowired private RoomPlayerRepository roomPlayerRepository;
    @Autowired private RoomAnswerRepository roomAnswerRepository;
    @Autowired private RoomStateService roomStateService;

    // Track continue count per matchup (in-memory, reset when new challenger)
    private final Map<String, Integer> continueCountMap = new HashMap<>();

    /**
     * Khởi tạo hàng chờ từ tất cả players (sắp xếp theo thứ tự vào phòng).
     * Tất cả ban đầu là SPECTATOR.
     */
    @Transactional
    public void initializeQueue(String roomId) {
        List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);
        players.sort(Comparator.comparing(RoomPlayer::getJoinedAt));

        players.forEach(p -> {
            p.setPlayerStatus(RoomPlayer.PlayerStatus.SPECTATOR);
            p.setWinningStreak(0);
        });
        roomPlayerRepository.saveAll(players);

        List<String> queue = players.stream()
                .map(p -> p.getUser().getId())
                .collect(Collectors.toList());
        roomStateService.setSdQueue(roomId, queue);
    }

    /**
     * Bắt đầu trận tiếp theo.
     * - Lần đầu: lấy 2 người đầu từ queue
     * - Trận tiếp: champion giữ, lấy tiếp người từ queue
     * @return MatchInfo nếu còn có thể thi đấu, null nếu kết thúc game
     */
    @Transactional
    public MatchInfo startNextMatch(String roomId) {
        String champion = roomStateService.getSdChampion(roomId);
        List<String> queue = roomStateService.getSdQueue(roomId);

        if (champion == null) {
            // Trận đầu tiên
            if (queue == null || queue.size() < 2) return null;
            champion = queue.remove(0);
            String challenger = queue.remove(0);
            roomStateService.setSdChampion(roomId, champion);
            roomStateService.setSdChallenger(roomId, challenger);
            roomStateService.setSdQueue(roomId, queue);
        } else {
            // Trận tiếp: champion giữ ghế
            if (queue == null || queue.isEmpty()) return null;
            String challenger = queue.remove(0);
            roomStateService.setSdChallenger(roomId, challenger);
            roomStateService.setSdQueue(roomId, queue);
        }

        String challengerId = roomStateService.getSdChallenger(roomId);
        setStatus(roomId, champion, RoomPlayer.PlayerStatus.ACTIVE);
        setStatus(roomId, challengerId, RoomPlayer.PlayerStatus.ACTIVE);
        continueCountMap.put(roomId, 0); // reset continues for new matchup

        String championName = getUsername(roomId, champion);
        String challengerName = getUsername(roomId, challengerId);
        int championStreak = getStreak(roomId, champion);

        return new MatchInfo(champion, championName, championStreak, challengerId, challengerName);
    }

    /**
     * Xử lý kết quả round cho trận hiện tại.
     * @return MatchResult với outcome CONTINUE, MATCH_ENDED, hoặc NO_MATCH
     */
    @Transactional
    public MatchResult processRound(String roomId, String roundId) {
        String champion = roomStateService.getSdChampion(roomId);
        String challenger = roomStateService.getSdChallenger(roomId);

        if (champion == null || challenger == null) {
            return new MatchResult(MatchOutcome.NO_MATCH, null, null);
        }

        boolean champCorrect = getIsCorrect(roundId, champion);
        boolean challCorrect = getIsCorrect(roundId, challenger);

        if (champCorrect && challCorrect) {
            // Cả 2 đúng → so elapsedMs
            int champMs = getResponseMs(roundId, champion);
            int challMs = getResponseMs(roundId, challenger);
            long diff = Math.abs((long) champMs - challMs);
            if (diff >= CLOSE_THRESHOLD_MS) {
                // Faster wins
                String winnerId = champMs < challMs ? champion : challenger;
                String loserId = winnerId.equals(champion) ? challenger : champion;
                return resolveMatchEnd(roomId, winnerId, loserId);
            }
            // Too close → check max continues
            return handleContinue(roomId, champion);
        }

        if (!champCorrect && !challCorrect) {
            // Cả 2 sai → check max continues
            return handleContinue(roomId, champion);
        }

        // One correct, one wrong → winner determined
        String winnerId = champCorrect ? champion : challenger;
        String loserId = champCorrect ? challenger : champion;
        return resolveMatchEnd(roomId, winnerId, loserId);
    }

    /** Gán finalRank cuối game dựa trên winningStreak (cao nhất = hạng 1) */
    @Transactional
    public void assignFinalRanks(String roomId) {
        List<RoomPlayer> players = roomPlayerRepository.findByRoomId(roomId);
        players.sort(Comparator.comparingInt(RoomPlayer::getWinningStreak).reversed());
        for (int i = 0; i < players.size(); i++) {
            players.get(i).setFinalRank(i + 1);
        }
        roomPlayerRepository.saveAll(players);
    }

    public boolean hasNextChallenger(String roomId) {
        List<String> queue = roomStateService.getSdQueue(roomId);
        return queue != null && !queue.isEmpty();
    }

    public int getQueueSize(String roomId) {
        List<String> queue = roomStateService.getSdQueue(roomId);
        return queue != null ? queue.size() : 0;
    }

    private MatchResult handleContinue(String roomId, String champion) {
        int count = continueCountMap.getOrDefault(roomId, 0) + 1;
        continueCountMap.put(roomId, count);
        if (count >= MAX_CONTINUES) {
            // Champion advantage: keeps throne after max continues
            return resolveMatchEnd(roomId, champion, roomStateService.getSdChallenger(roomId));
        }
        return new MatchResult(MatchOutcome.CONTINUE, null, null);
    }

    private MatchResult resolveMatchEnd(String roomId, String winnerId, String loserId) {
        roomPlayerRepository.findByRoomIdAndUserId(roomId, winnerId).ifPresent(p -> {
            p.setWinningStreak(p.getWinningStreak() + 1);
            p.setPlayerStatus(RoomPlayer.PlayerStatus.ACTIVE);
            roomPlayerRepository.save(p);
        });
        roomPlayerRepository.findByRoomIdAndUserId(roomId, loserId).ifPresent(p -> {
            p.setWinningStreak(0);
            p.setPlayerStatus(RoomPlayer.PlayerStatus.SPECTATOR);
            roomPlayerRepository.save(p);
        });
        String winnerName = getUsername(roomId, winnerId);
        String loserName = getUsername(roomId, loserId);
        int newStreak = getStreak(roomId, winnerId);
        roomStateService.setSdChampion(roomId, winnerId);
        roomStateService.clearSdChallenger(roomId);
        return new MatchResult(MatchOutcome.MATCH_ENDED,
                new PlayerRef(winnerId, winnerName, newStreak),
                new PlayerRef(loserId, loserName, 0));
    }

    private int getResponseMs(String roundId, String userId) {
        return roomAnswerRepository.findByRoundIdAndUserId(roundId, userId)
                .map(a -> a.getResponseMs() != null ? a.getResponseMs() : 10000)
                .orElse(10000); // timeout = 10s
    }

    // ── Helpers ──

    private void setStatus(String roomId, String userId, RoomPlayer.PlayerStatus status) {
        roomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
                .ifPresent(p -> { p.setPlayerStatus(status); roomPlayerRepository.save(p); });
    }

    private boolean getIsCorrect(String roundId, String userId) {
        return roomAnswerRepository.findByRoundIdAndUserId(roundId, userId)
                .map(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .orElse(false);
    }

    private String getUsername(String roomId, String userId) {
        return roomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
                .map(RoomPlayer::getUsername).orElse("Unknown");
    }

    private int getStreak(String roomId, String userId) {
        return roomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
                .map(RoomPlayer::getWinningStreak).orElse(0);
    }

    // ── DTOs ──

    public static class MatchInfo {
        public final String championId;
        public final String championName;
        public final int championStreak;
        public final String challengerId;
        public final String challengerName;

        public MatchInfo(String championId, String championName, int championStreak,
                         String challengerId, String challengerName) {
            this.championId = championId;
            this.championName = championName;
            this.championStreak = championStreak;
            this.challengerId = challengerId;
            this.challengerName = challengerName;
        }
    }

    public enum MatchOutcome { CONTINUE, MATCH_ENDED, NO_MATCH }

    public static class MatchResult {
        public final MatchOutcome outcome;
        public final PlayerRef winner;
        public final PlayerRef loser;

        public MatchResult(MatchOutcome outcome, PlayerRef winner, PlayerRef loser) {
            this.outcome = outcome;
            this.winner = winner;
            this.loser = loser;
        }
    }

    public static class PlayerRef {
        public final String userId;
        public final String username;
        public final int streak;

        public PlayerRef(String userId, String username, int streak) {
            this.userId = userId;
            this.username = username;
            this.streak = streak;
        }
    }
}
