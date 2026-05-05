package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.entity.ScheduledQuiz;
import com.biblequiz.modules.group.entity.ScheduledQuizAttempt;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;
import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import com.biblequiz.modules.group.repository.ScheduledQuizAttemptRepository;
import com.biblequiz.modules.group.repository.ScheduledQuizRepository;
import com.biblequiz.modules.notification.service.NotificationService;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature B — Scheduled async quiz lifecycle: create / list / detail / play /
 * submit / leaderboard. Cron-driven freeze + announcement lives in
 * {@link ScheduledQuizScheduler}.
 */
@Service
public class ScheduledQuizService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledQuizService.class);
    public static final int MAX_ACTIVE_PER_GROUP = 3;

    @Autowired private ScheduledQuizRepository quizRepository;
    @Autowired private ScheduledQuizAttemptRepository attemptRepository;
    @Autowired private GroupQuizSetRepository quizSetRepository;
    @Autowired private GroupMemberRepository memberRepository;
    @Autowired private ChurchGroupRepository groupRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;

    /** PN-3 enforcement code returned in error message. */
    public static final String ERR_MAX_ACTIVE = "MAX_ACTIVE_QUIZZES_REACHED";

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> create(String groupId, String creatorId,
                                      String quizSetId, String name, String description,
                                      LocalDateTime deadline, Integer maxAttempts,
                                      Boolean isLeaderboardPublic, Boolean sendNotifications) {
        // Authorize LEADER/MOD
        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, creatorId)
                .orElseThrow(() -> new IllegalArgumentException("Ban khong phai thanh vien cua nhom"));
        if (member.getRole() != GroupMember.GroupRole.LEADER && member.getRole() != GroupMember.GroupRole.MOD) {
            throw new IllegalArgumentException("Chi leader hoac mod moi co the dat lich quiz");
        }

        // PN-3: enforce max 3 ACTIVE concurrent per group
        long activeCount = quizRepository.countByGroupIdAndStatus(groupId, ScheduledQuiz.Status.ACTIVE);
        if (activeCount >= MAX_ACTIVE_PER_GROUP) {
            throw new IllegalStateException(ERR_MAX_ACTIVE);
        }

        if (deadline == null || deadline.isBefore(LocalDateTime.now().plusMinutes(5))) {
            throw new IllegalArgumentException("Han chot phai sau hien tai it nhat 5 phut");
        }

        GroupQuizSet qs = quizSetRepository.findById(quizSetId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay quiz set"));
        if (!qs.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Quiz set khong thuoc nhom nay");
        }
        List<String> questionIds = (List<String>) qs.getQuestionIds();
        if (questionIds == null || questionIds.isEmpty()) {
            throw new IllegalArgumentException("Quiz set chua co cau hoi nao");
        }

        ChurchGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Nguoi tao khong ton tai"));

        ScheduledQuiz quiz = new ScheduledQuiz();
        quiz.setId(UUID.randomUUID().toString());
        quiz.setGroup(group);
        quiz.setQuizSet(qs);
        quiz.setSnapshotQuestionIds(new ArrayList<>(questionIds));
        quiz.setName(name != null ? name : qs.getName());
        quiz.setDescription(description);
        quiz.setDeadline(deadline);
        quiz.setMaxAttempts(maxAttempts != null ? Math.max(1, Math.min(10, maxAttempts)) : 3);
        quiz.setIsLeaderboardPublic(isLeaderboardPublic == null || isLeaderboardPublic);
        quiz.setSendNotifications(sendNotifications == null || sendNotifications);
        quiz.setCreatedBy(creator);
        quiz = quizRepository.save(quiz);

        // PN-1: in-app notification on publish for all group members
        if (Boolean.TRUE.equals(quiz.getSendNotifications())) {
            String metadata = "{\"scheduledQuizId\":\"" + quiz.getId() + "\",\"groupId\":\"" + groupId + "\"}";
            String body = "Quiz mới: '" + quiz.getName() + "' - hạn chót " + deadline;
            memberRepository.findByGroupId(groupId).forEach(m -> {
                if (m.getUser() != null) {
                    notificationService.createNotification(m.getUser(), "scheduled_quiz_published",
                            "Quiz nhóm mới", body, metadata);
                }
            });
        }

        log.info("[ScheduledQuiz] created id={} group={} deadline={}", quiz.getId(), groupId, deadline);
        return toSummary(quiz);
    }

    public List<Map<String, Object>> list(String groupId, String statusFilter) {
        List<ScheduledQuiz> quizzes;
        if (statusFilter == null || statusFilter.isBlank()) {
            quizzes = quizRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        } else {
            quizzes = quizRepository.findByGroupIdAndStatusOrderByDeadlineAsc(
                    groupId, ScheduledQuiz.Status.valueOf(statusFilter.toUpperCase()));
        }
        return quizzes.stream().map(this::toSummary).collect(Collectors.toList());
    }

    public Map<String, Object> getDetail(String quizId, String viewerId) {
        ScheduledQuiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay quiz"));
        Map<String, Object> base = toSummary(quiz);

        long myAttempts = attemptRepository.countByScheduledQuizIdAndUserId(quizId, viewerId);
        Optional<ScheduledQuizAttempt> myBest = attemptRepository
                .findFirstByScheduledQuizIdAndUserIdOrderByScoreDesc(quizId, viewerId);

        Map<String, Object> myStatus = new LinkedHashMap<>();
        myStatus.put("attemptsUsed", (int) myAttempts);
        myStatus.put("attemptsRemaining", Math.max(0, quiz.getMaxAttempts() - (int) myAttempts));
        myStatus.put("bestScore", myBest.map(ScheduledQuizAttempt::getScore).orElse(null));
        myStatus.put("bestCorrectCount", myBest.map(ScheduledQuizAttempt::getCorrectCount).orElse(null));
        myStatus.put("bestTimeSeconds", myBest.map(ScheduledQuizAttempt::getTimeSeconds).orElse(null));
        base.put("myStatus", myStatus);
        return base;
    }

    /**
     * Start a new attempt. Returns the questions for the FE to render.
     * Validates deadline + attempt count.
     */
    @Transactional
    public Map<String, Object> startAttempt(String quizId, String userId) {
        ScheduledQuiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay quiz"));
        if (quiz.getStatus() != ScheduledQuiz.Status.ACTIVE) {
            throw new IllegalStateException("Quiz khong con dien ra");
        }
        if (quiz.getDeadline().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Da qua han chot");
        }
        long used = attemptRepository.countByScheduledQuizIdAndUserId(quizId, userId);
        if (used >= quiz.getMaxAttempts()) {
            throw new IllegalStateException("Da het luot choi");
        }

        // Snapshot question IDs → fetch full questions (preserve order)
        List<String> questionIds = quiz.getSnapshotQuestionIds();
        List<Question> questions = questionRepository.findAllById(questionIds);
        Map<String, Question> byId = questions.stream().collect(Collectors.toMap(Question::getId, q -> q));
        List<Map<String, Object>> orderedQuestions = questionIds.stream()
                .map(byId::get).filter(Objects::nonNull)
                .map(this::buildQuestionDto)
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("quizId", quizId);
        result.put("attemptNumber", (int) used + 1);
        result.put("questions", orderedQuestions);
        return result;
    }

    /**
     * Submit attempt result from FE. FE sends array of {questionId, answerIndex}.
     * BE recomputes correctness server-side using the snapshot question IDs.
     */
    @Transactional
    public Map<String, Object> submitAttempt(String quizId, String userId,
                                             List<Map<String, Object>> answers,
                                             Integer timeSeconds) {
        ScheduledQuiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay quiz"));
        if (quiz.getDeadline().isBefore(LocalDateTime.now())
                || quiz.getStatus() != ScheduledQuiz.Status.ACTIVE) {
            throw new IllegalStateException("Da qua han chot");
        }
        long used = attemptRepository.countByScheduledQuizIdAndUserId(quizId, userId);
        if (used >= quiz.getMaxAttempts()) {
            throw new IllegalStateException("Da het luot choi");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Nguoi dung khong ton tai"));

        // Score server-side
        List<String> snapshotIds = quiz.getSnapshotQuestionIds();
        Map<String, Question> byId = questionRepository.findAllById(snapshotIds).stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        int correctCount = 0;
        int totalQuestions = snapshotIds.size();
        if (answers != null) {
            for (Map<String, Object> ans : answers) {
                String qid = (String) ans.get("questionId");
                Object idxObj = ans.get("answerIndex");
                if (qid == null || !(idxObj instanceof Number)) continue;
                Question q = byId.get(qid);
                if (q == null || q.getCorrectAnswer() == null || q.getCorrectAnswer().isEmpty()) continue;
                int answerIndex = ((Number) idxObj).intValue();
                if (answerIndex == q.getCorrectAnswer().get(0)) correctCount++;
            }
        }
        int score = correctCount * 100;

        ScheduledQuizAttempt attempt = new ScheduledQuizAttempt();
        attempt.setId(UUID.randomUUID().toString());
        attempt.setScheduledQuiz(quiz);
        attempt.setUser(user);
        attempt.setAttemptNumber((int) used + 1);
        attempt.setScore(score);
        attempt.setCorrectCount(correctCount);
        attempt.setTotalQuestions(totalQuestions);
        attempt.setTimeSeconds(timeSeconds != null ? timeSeconds : 0);
        attempt.setCompletedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("attemptNumber", attempt.getAttemptNumber());
        result.put("score", score);
        result.put("correctCount", correctCount);
        result.put("totalQuestions", totalQuestions);
        result.put("timeSeconds", attempt.getTimeSeconds());
        return result;
    }

    /**
     * Best score per user. Respects {@code is_leaderboard_public}: if false,
     * non-creator + non-self entries are hidden.
     */
    public List<Map<String, Object>> getLeaderboard(String quizId, String viewerId) {
        ScheduledQuiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay quiz"));

        List<ScheduledQuizAttempt> all = attemptRepository.findByScheduledQuizId(quizId);
        Map<String, ScheduledQuizAttempt> bestByUser = new HashMap<>();
        for (ScheduledQuizAttempt a : all) {
            String uid = a.getUser().getId();
            ScheduledQuizAttempt cur = bestByUser.get(uid);
            if (cur == null || a.getScore() > cur.getScore()
                    || (a.getScore().equals(cur.getScore()) && a.getTimeSeconds() < cur.getTimeSeconds())) {
                bestByUser.put(uid, a);
            }
        }
        List<ScheduledQuizAttempt> ranked = bestByUser.values().stream()
                .sorted((x, y) -> {
                    int s = Integer.compare(y.getScore(), x.getScore());
                    if (s != 0) return s;
                    return Integer.compare(x.getTimeSeconds(), y.getTimeSeconds());
                })
                .collect(Collectors.toList());

        boolean publicLb = Boolean.TRUE.equals(quiz.getIsLeaderboardPublic());
        boolean isCreator = viewerId != null && viewerId.equals(quiz.getCreatedBy().getId());

        List<Map<String, Object>> rows = new ArrayList<>();
        int rank = 1;
        for (ScheduledQuizAttempt a : ranked) {
            boolean isMe = viewerId != null && viewerId.equals(a.getUser().getId());
            if (!publicLb && !isCreator && !isMe) {
                rank++;
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank", rank++);
            row.put("userId", a.getUser().getId());
            row.put("name", a.getUser().getName());
            row.put("avatarUrl", a.getUser().getAvatarUrl());
            row.put("score", a.getScore());
            row.put("correctCount", a.getCorrectCount());
            row.put("totalQuestions", a.getTotalQuestions());
            row.put("timeSeconds", a.getTimeSeconds());
            row.put("attemptsUsed", attemptRepository.countByScheduledQuizIdAndUserId(quizId, a.getUser().getId()));
            row.put("isMe", isMe);
            rows.add(row);
        }
        return rows;
    }

    @Transactional
    public void cancel(String quizId, String userId) {
        ScheduledQuiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay quiz"));
        GroupMember m = memberRepository.findByGroupIdAndUserId(quiz.getGroup().getId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Ban khong phai thanh vien"));
        if (m.getRole() != GroupMember.GroupRole.LEADER && m.getRole() != GroupMember.GroupRole.MOD) {
            throw new IllegalArgumentException("Chi leader hoac mod moi duoc huy");
        }
        quiz.setStatus(ScheduledQuiz.Status.CANCELLED);
        quiz.setEndedAt(LocalDateTime.now());
        quizRepository.save(quiz);
    }

    // ── helpers ──

    private Map<String, Object> toSummary(ScheduledQuiz quiz) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", quiz.getId());
        m.put("groupId", quiz.getGroup().getId());
        m.put("quizSetId", quiz.getQuizSet().getId());
        m.put("name", quiz.getName());
        m.put("description", quiz.getDescription());
        m.put("deadline", quiz.getDeadline());
        m.put("status", quiz.getStatus().name());
        m.put("maxAttempts", quiz.getMaxAttempts());
        m.put("isLeaderboardPublic", quiz.getIsLeaderboardPublic());
        m.put("sendNotifications", quiz.getSendNotifications());
        m.put("questionCount", quiz.getSnapshotQuestionIds() != null ? quiz.getSnapshotQuestionIds().size() : 0);
        m.put("winnerUserId", quiz.getWinnerUserId());
        m.put("winnerScore", quiz.getWinnerScore());
        m.put("createdBy", quiz.getCreatedBy().getId());
        m.put("createdAt", quiz.getCreatedAt());
        m.put("endedAt", quiz.getEndedAt());
        return m;
    }

    private Map<String, Object> buildQuestionDto(Question q) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", q.getId());
        dto.put("content", q.getContent());
        dto.put("options", q.getOptions());
        dto.put("type", q.getType() != null ? q.getType().name() : "multiple_choice_single");
        dto.put("book", q.getBook());
        dto.put("chapter", q.getChapter());
        dto.put("explanation", q.getExplanation());
        return dto;
    }
}
