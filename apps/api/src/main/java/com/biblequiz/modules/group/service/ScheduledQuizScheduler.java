package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.entity.GroupAnnouncement;
import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.entity.ScheduledQuiz;
import com.biblequiz.modules.group.entity.ScheduledQuizAttempt;
import com.biblequiz.modules.group.repository.GroupAnnouncementRepository;
import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.group.repository.ScheduledQuizAttemptRepository;
import com.biblequiz.modules.group.repository.ScheduledQuizRepository;
import com.biblequiz.modules.notification.service.NotificationService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Cron jobs for scheduled-quiz lifecycle:
 *  - Every minute: freeze any ACTIVE quiz whose deadline has passed; set winner;
 *    post group announcement; notify members.
 *  - Every hour: send 24h-remaining notification (idempotent via noti_24h_sent_at).
 *
 * <p>Atomic transitions: each quiz processed in its own @Transactional method so
 * a failure on one doesn't block the rest, and the ACTIVE-status guard prevents
 * a double-fire (idempotent across cron restarts).
 */
@Service
public class ScheduledQuizScheduler {

    private static final Logger log = LoggerFactory.getLogger(ScheduledQuizScheduler.class);

    @Autowired private ScheduledQuizRepository quizRepository;
    @Autowired private ScheduledQuizAttemptRepository attemptRepository;
    @Autowired private GroupAnnouncementRepository announcementRepository;
    @Autowired private GroupMemberRepository memberRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private UserRepository userRepository;

    /** Sweep ACTIVE quizzes past their deadline → ENDED. Runs every minute. */
    @Scheduled(cron = "0 * * * * *")
    public void freezeExpiredQuizzes() {
        List<ScheduledQuiz> due = quizRepository.findByStatusAndDeadlineBefore(
                ScheduledQuiz.Status.ACTIVE, LocalDateTime.now());
        if (due.isEmpty()) return;
        log.info("[ScheduledQuiz] freezing {} expired quizzes", due.size());
        for (ScheduledQuiz q : due) {
            try {
                freezeOne(q.getId());
            } catch (Exception ex) {
                log.error("[ScheduledQuiz] freeze failed for quiz {}: {}", q.getId(), ex.getMessage(), ex);
            }
        }
    }

    /**
     * Freeze a single quiz atomically. Re-reads the row inside the transaction
     * and double-checks status to dodge a double-fire under cron overlap.
     */
    @Transactional
    public void freezeOne(String quizId) {
        ScheduledQuiz quiz = quizRepository.findById(quizId).orElse(null);
        if (quiz == null || quiz.getStatus() != ScheduledQuiz.Status.ACTIVE) return;

        // Compute winner — best attempt across all users
        List<ScheduledQuizAttempt> all = attemptRepository.findByScheduledQuizId(quizId);
        ScheduledQuizAttempt winner = null;
        for (ScheduledQuizAttempt a : all) {
            if (winner == null || a.getScore() > winner.getScore()
                    || (a.getScore().equals(winner.getScore()) && a.getTimeSeconds() < winner.getTimeSeconds())) {
                winner = a;
            }
        }

        quiz.setStatus(ScheduledQuiz.Status.ENDED);
        quiz.setEndedAt(LocalDateTime.now());
        if (winner != null) {
            quiz.setWinnerUserId(winner.getUser().getId());
            quiz.setWinnerScore(winner.getScore());
        }
        quizRepository.save(quiz);

        // Auto-create group announcement
        GroupAnnouncement ann = new GroupAnnouncement();
        ann.setId(UUID.randomUUID().toString());
        ann.setGroup(quiz.getGroup());
        ann.setAuthor(quiz.getCreatedBy());
        String winnerLine = winner != null
                ? String.format("🎊 Quiz '%s' đã kết thúc! Người chiến thắng: %s với %d điểm",
                        quiz.getName(), winner.getUser().getName(), winner.getScore())
                : String.format("🎊 Quiz '%s' đã kết thúc — không có người tham gia.", quiz.getName());
        ann.setContent(winnerLine);
        announcementRepository.save(ann);

        // In-app notifications for participants + creator (PN-1: in-app only, no FCM)
        if (Boolean.TRUE.equals(quiz.getSendNotifications())) {
            Set<String> recipientIds = new HashSet<>();
            for (ScheduledQuizAttempt a : all) recipientIds.add(a.getUser().getId());
            recipientIds.add(quiz.getCreatedBy().getId());
            String metadata = "{\"scheduledQuizId\":\"" + quiz.getId()
                    + "\",\"groupId\":\"" + quiz.getGroup().getId() + "\"}";
            for (String uid : recipientIds) {
                userRepository.findById(uid).ifPresent(u ->
                        notificationService.createNotification(u, "scheduled_quiz_ended",
                                "Quiz '" + quiz.getName() + "' đã kết thúc", winnerLine, metadata));
            }
        }
        log.info("[ScheduledQuiz] frozen id={} winner={}", quiz.getId(),
                winner != null ? winner.getUser().getName() : "(none)");
    }

    /** Send 24h-remaining notification once per quiz. Runs every hour. */
    @Scheduled(cron = "0 0 * * * *")
    public void send24hRemainingNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime to = now.plusHours(24);
        List<ScheduledQuiz> approaching = quizRepository.findByStatusAndDeadlineBetweenAndNoti24hSentAtIsNull(
                ScheduledQuiz.Status.ACTIVE, now, to);
        if (approaching.isEmpty()) return;
        log.info("[ScheduledQuiz] sending 24h reminders for {} quizzes", approaching.size());
        for (ScheduledQuiz q : approaching) {
            try {
                send24hForOne(q.getId());
            } catch (Exception ex) {
                log.error("[ScheduledQuiz] 24h reminder failed for quiz {}: {}", q.getId(), ex.getMessage(), ex);
            }
        }
    }

    @Transactional
    public void send24hForOne(String quizId) {
        ScheduledQuiz quiz = quizRepository.findById(quizId).orElse(null);
        if (quiz == null || quiz.getStatus() != ScheduledQuiz.Status.ACTIVE
                || quiz.getNoti24hSentAt() != null
                || !Boolean.TRUE.equals(quiz.getSendNotifications())) return;

        List<GroupMember> members = memberRepository.findByGroupId(quiz.getGroup().getId());
        String body = "Còn 24 giờ để chơi quiz '" + quiz.getName() + "'!";
        String metadata = "{\"scheduledQuizId\":\"" + quiz.getId()
                + "\",\"groupId\":\"" + quiz.getGroup().getId() + "\"}";
        for (GroupMember m : members) {
            User u = m.getUser();
            if (u != null) {
                notificationService.createNotification(u, "scheduled_quiz_24h",
                        "Quiz sắp hết hạn", body, metadata);
            }
        }

        quiz.setNoti24hSentAt(LocalDateTime.now());
        quizRepository.save(quiz);
    }
}
