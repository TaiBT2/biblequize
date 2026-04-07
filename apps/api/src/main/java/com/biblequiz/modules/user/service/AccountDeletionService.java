package com.biblequiz.modules.user.service;

import com.biblequiz.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

/**
 * Handles complete account deletion with cascade cleanup.
 * Order matters due to foreign key constraints.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccountDeletionService {

    private final UserRepository userRepository;
    private final EntityManager entityManager;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public void deleteUserAccount(String userId) {
        // 1. Quiz data (answers reference sessions, sessions reference user)
        entityManager.createQuery("DELETE FROM Answer a WHERE a.session.id IN (SELECT s.id FROM QuizSession s WHERE s.owner.id = :uid)")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM QuizSession s WHERE s.owner.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM UserQuestionHistory h WHERE h.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Bookmark b WHERE b.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM UserBookProgress p WHERE p.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // 2. Daily progress & ranked
        entityManager.createQuery("DELETE FROM UserDailyProgress p WHERE p.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM SeasonRanking r WHERE r.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // 3. Social data
        entityManager.createQuery("DELETE FROM GroupMember m WHERE m.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM TournamentMatchParticipant p WHERE p.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM TournamentParticipant p WHERE p.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Challenge c WHERE c.challenger.id = :uid OR c.challenged.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // 4. Room data
        entityManager.createQuery("DELETE FROM RoomAnswer a WHERE a.player.id IN (SELECT rp.id FROM RoomPlayer rp WHERE rp.user.id = :uid)")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM RoomPlayer rp WHERE rp.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // 5. Achievements & notifications
        entityManager.createQuery("DELETE FROM UserAchievement ua WHERE ua.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Notification n WHERE n.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // 6. Feedback & share cards
        entityManager.createQuery("DELETE FROM Feedback f WHERE f.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM ShareCard s WHERE s.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // 7. Audit events (optional — keep for audit trail or delete)
        entityManager.createQuery("DELETE FROM AuditEvent a WHERE a.userId = :uid")
                .setParameter("uid", userId).executeUpdate();

        // 8. Delete user record
        userRepository.deleteById(userId);

        // 9. Clean up Redis
        try {
            redisTemplate.delete("user:online:" + userId);
        } catch (Exception e) {
            log.warn("Failed to clean Redis for user {}: {}", userId, e.getMessage());
        }

        log.info("Account deleted: userId={}", userId);
    }
}
