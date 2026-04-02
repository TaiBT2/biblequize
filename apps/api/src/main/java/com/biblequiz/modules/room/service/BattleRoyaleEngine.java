package com.biblequiz.modules.room.service;

import com.biblequiz.modules.room.entity.RoomAnswer;
import com.biblequiz.modules.room.entity.RoomPlayer;
import com.biblequiz.modules.room.repository.RoomAnswerRepository;
import com.biblequiz.modules.room.repository.RoomPlayerRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Engine xử lý logic Battle Royale:
 * - Sau mỗi round, players trả lời sai (hoặc không trả lời) bị loại
 * - Ngoại lệ: nếu TẤT CẢ active players đều sai → không ai bị loại
 * - Gán finalRank khi bị loại
 */
@Service
public class BattleRoyaleEngine {

    @Autowired
    private RoomPlayerRepository roomPlayerRepository;

    @Autowired
    private RoomAnswerRepository roomAnswerRepository;

    /**
     * Xử lý kết thúc round cho Battle Royale.
     *
     * @return Danh sách players bị loại, rỗng nếu không ai bị loại (all-wrong exception)
     */
    @Transactional
    public List<EliminatedPlayerInfo> processRoundEnd(String roomId, String roundId) {
        List<RoomPlayer> activePlayers = roomPlayerRepository
                .findByRoomIdAndPlayerStatus(roomId, RoomPlayer.PlayerStatus.ACTIVE);

        if (activePlayers.isEmpty()) return List.of();

        // Lấy các userId đã trả lời đúng trong round này
        List<RoomAnswer> answers = roomAnswerRepository.findByRoundId(roundId);
        Set<String> correctAnswerers = answers.stream()
                .filter(RoomAnswer::getIsCorrect)
                .map(RoomAnswer::getUserId)
                .collect(Collectors.toSet());

        // Ai ACTIVE nhưng không có trong correct → bị loại
        List<RoomPlayer> toEliminate = activePlayers.stream()
                .filter(p -> !correctAnswerers.contains(p.getUser().getId()))
                .collect(Collectors.toList());

        // Ngoại lệ: tất cả đều sai → không ai bị loại
        if (toEliminate.size() == activePlayers.size()) {
            return List.of();
        }

        // rank = số người còn sống sau khi loại + 1
        int survivorsCount = activePlayers.size() - toEliminate.size();
        int rank = survivorsCount + 1;

        List<EliminatedPlayerInfo> eliminated = new ArrayList<>();
        for (RoomPlayer p : toEliminate) {
            p.setPlayerStatus(RoomPlayer.PlayerStatus.ELIMINATED);
            p.setFinalRank(rank);
            roomPlayerRepository.save(p);
            eliminated.add(new EliminatedPlayerInfo(
                    p.getUser().getId(), p.getUsername(), rank));
        }

        return eliminated;
    }

    /**
     * Check if max rounds reached and game should end with forced ranking.
     * maxRounds = min(questionCount * 2, 50)
     * @return true if game should end
     */
    public boolean shouldEndGame(int currentRound, int questionCount, int activePlayersCount) {
        if (activePlayersCount <= 1) return true;
        int maxRounds = Math.min(questionCount * 2, 50);
        return currentRound >= maxRounds;
    }

    /**
     * Gán rank cuối cho những active players còn lại khi game kết thúc.
     * Sort theo: correctAnswers DESC → averageReactionTime ASC (faster = better).
     */
    @Transactional
    public void assignFinalRanks(String roomId) {
        List<RoomPlayer> remaining = roomPlayerRepository
                .findByRoomIdAndPlayerStatus(roomId, RoomPlayer.PlayerStatus.ACTIVE);

        // Sort: correctAnswers DESC, then averageReactionTime ASC (faster better)
        remaining.sort((a, b) -> {
            int cmp = Integer.compare(b.getCorrectAnswers(), a.getCorrectAnswers());
            if (cmp != 0) return cmp;
            return Double.compare(a.getAverageReactionTime(), b.getAverageReactionTime());
        });

        for (int i = 0; i < remaining.size(); i++) {
            RoomPlayer p = remaining.get(i);
            p.setFinalRank(i + 1);
            roomPlayerRepository.save(p);
        }
    }

    public static class EliminatedPlayerInfo {
        public final String userId;
        public final String username;
        public final int rank;

        public EliminatedPlayerInfo(String userId, String username, int rank) {
            this.userId = userId;
            this.username = username;
            this.rank = rank;
        }
    }
}
