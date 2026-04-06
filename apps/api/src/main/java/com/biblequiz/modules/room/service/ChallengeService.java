package com.biblequiz.modules.room.service;

import com.biblequiz.modules.room.entity.Challenge;
import com.biblequiz.modules.room.repository.ChallengeRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.biblequiz.api.websocket.WebSocketMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChallengeService(ChallengeRepository challengeRepository,
                            UserRepository userRepository,
                            SimpMessagingTemplate messagingTemplate) {
        this.challengeRepository = challengeRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Challenge createChallenge(String challengerId, String challengedId) {
        if (challengerId.equals(challengedId)) {
            throw new IllegalArgumentException("Cannot challenge yourself");
        }

        User challenger = userRepository.findById(challengerId).orElseThrow();
        User challenged = userRepository.findById(challengedId).orElseThrow();

        Challenge challenge = new Challenge(
                UUID.randomUUID().toString(),
                challenger,
                challenged,
                LocalDateTime.now().plusMinutes(5)
        );
        challengeRepository.save(challenge);

        // Send WebSocket notification to challenged user
        messagingTemplate.convertAndSendToUser(
                challenged.getEmail(),
                "/queue/challenges",
                new WebSocketMessage.Message(
                        WebSocketMessage.MessageTypes.CHALLENGE_RECEIVED,
                        Map.of(
                                "challengeId", challenge.getId(),
                                "challengerName", challenger.getName(),
                                "challengerId", challenger.getId(),
                                "expiresAt", challenge.getExpiresAt().toString()
                        )
                )
        );

        return challenge;
    }

    @Transactional
    public Map<String, String> acceptChallenge(String challengeId, String userId) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));

        if (!challenge.getChallenged().getId().equals(userId)) {
            throw new IllegalArgumentException("Not your challenge to accept");
        }
        if (challenge.isExpired()) {
            challenge.setStatus(Challenge.Status.EXPIRED);
            challengeRepository.save(challenge);
            throw new IllegalArgumentException("Challenge has expired");
        }

        challenge.setStatus(Challenge.Status.ACCEPTED);
        // Room creation would be handled by RoomService — return challenge info for now
        challengeRepository.save(challenge);

        return Map.of(
                "challengeId", challenge.getId(),
                "challengerId", challenge.getChallenger().getId(),
                "challengedId", challenge.getChallenged().getId(),
                "status", "ACCEPTED"
        );
    }

    @Transactional
    public void declineChallenge(String challengeId, String userId) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));

        if (!challenge.getChallenged().getId().equals(userId)) {
            throw new IllegalArgumentException("Not your challenge to decline");
        }

        challenge.setStatus(Challenge.Status.DECLINED);
        challengeRepository.save(challenge);
    }

    public List<Challenge> getPendingChallenges(String userId) {
        return challengeRepository.findByChallengedIdAndStatus(userId, Challenge.Status.PENDING)
                .stream()
                .filter(c -> !c.isExpired())
                .toList();
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void expirePendingChallenges() {
        List<Challenge> expired = challengeRepository.findExpiredPending(LocalDateTime.now());
        for (Challenge c : expired) {
            c.setStatus(Challenge.Status.EXPIRED);
        }
        if (!expired.isEmpty()) {
            challengeRepository.saveAll(expired);
        }
    }
}
