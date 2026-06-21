package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.entity.GroupJourney;
import com.biblequiz.modules.group.entity.GroupJourneyWeek;
import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.entity.ScheduledQuiz;
import com.biblequiz.modules.group.entity.ScheduledQuizAttempt;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;
import com.biblequiz.modules.group.repository.GroupJourneyRepository;
import com.biblequiz.modules.group.repository.GroupJourneyWeekRepository;
import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import com.biblequiz.modules.group.repository.ScheduledQuizAttemptRepository;
import com.biblequiz.modules.group.repository.ScheduledQuizRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * BL-25 — Hành Trình Nhóm. Leader builds a journey of N weeks (chặng); each
 * week's checkpoint is a {@link ScheduledQuiz} created on
 * {@link #openNextWeek}. Progress ({@link #getJourneyWithProgress}) is
 * aggregated live from {@link ScheduledQuizAttempt} — NOT a separate progress
 * table, and NOT the dead solo-practice source that left Collective Growth
 * empty.
 *
 * <p>Reuses {@link ScheduledQuizService} verbatim for checkpoint creation
 * (snapshot + member notification), so journeys inherit the async primitive
 * that is already wired end-to-end.
 */
@Service
public class GroupJourneyService {

    private static final Logger log = LoggerFactory.getLogger(GroupJourneyService.class);

    private final GroupJourneyRepository journeyRepository;
    private final GroupJourneyWeekRepository weekRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupQuizSetRepository quizSetRepository;
    private final ChurchGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final ScheduledQuizRepository scheduledQuizRepository;
    private final ScheduledQuizAttemptRepository attemptRepository;
    private final ScheduledQuizService scheduledQuizService;

    public GroupJourneyService(GroupJourneyRepository journeyRepository,
                               GroupJourneyWeekRepository weekRepository,
                               GroupMemberRepository memberRepository,
                               GroupQuizSetRepository quizSetRepository,
                               ChurchGroupRepository groupRepository,
                               UserRepository userRepository,
                               ScheduledQuizRepository scheduledQuizRepository,
                               ScheduledQuizAttemptRepository attemptRepository,
                               ScheduledQuizService scheduledQuizService) {
        this.journeyRepository = journeyRepository;
        this.weekRepository = weekRepository;
        this.memberRepository = memberRepository;
        this.quizSetRepository = quizSetRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.scheduledQuizRepository = scheduledQuizRepository;
        this.attemptRepository = attemptRepository;
        this.scheduledQuizService = scheduledQuizService;
    }

    // ── write (leader/mod) ──────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> createJourney(String groupId, String userId,
                                             String title, String description) {
        requireLeaderOrMod(groupId, userId);
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Thieu tieu de hanh trinh");
        }
        ChurchGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Nguoi tao khong ton tai"));

        GroupJourney journey = new GroupJourney();
        journey.setId(UUID.randomUUID().toString());
        journey.setGroup(group);
        journey.setTitle(title.trim());
        journey.setDescription(description);
        journey.setStatus(GroupJourney.Status.DRAFT);
        journey.setCreatedBy(creator);
        journey = journeyRepository.save(journey);
        log.info("[GroupJourney] created id={} group={}", journey.getId(), groupId);
        return toJourneySummary(journey, 0L);
    }

    @Transactional
    public Map<String, Object> updateJourney(String journeyId, String userId,
                                             String title, String description) {
        GroupJourney journey = loadJourney(journeyId);
        requireLeaderOrMod(journey.getGroup().getId(), userId);
        if (title != null && !title.isBlank()) journey.setTitle(title.trim());
        if (description != null) journey.setDescription(description);
        journeyRepository.save(journey);
        return toJourneySummary(journey, weekRepository.countByJourneyId(journeyId));
    }

    @Transactional
    public Map<String, Object> addWeek(String journeyId, String userId,
                                       String title, String quizSetId) {
        GroupJourney journey = loadJourney(journeyId);
        String groupId = journey.getGroup().getId();
        requireLeaderOrMod(groupId, userId);

        GroupQuizSet qs = quizSetRepository.findById(quizSetId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay bo cau hoi"));
        if (qs.getGroup() == null || !qs.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Bo cau hoi khong thuoc nhom nay");
        }

        long existing = weekRepository.countByJourneyId(journeyId);
        GroupJourneyWeek week = new GroupJourneyWeek();
        week.setId(UUID.randomUUID().toString());
        week.setJourney(journey);
        week.setWeekNumber((int) existing + 1);
        week.setTitle(title != null && !title.isBlank() ? title.trim() : qs.getName());
        week.setQuizSetId(quizSetId);
        week.setStatus(GroupJourneyWeek.Status.LOCKED);
        week = weekRepository.save(week);
        return toWeekSummary(week, null);
    }

    /** Remove a not-yet-opened week (LOCKED only) while still building. */
    @Transactional
    public void removeWeek(String weekId, String userId) {
        GroupJourneyWeek week = weekRepository.findById(weekId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay chang"));
        requireLeaderOrMod(week.getJourney().getGroup().getId(), userId);
        if (week.getStatus() != GroupJourneyWeek.Status.LOCKED) {
            throw new IllegalStateException("Chi xoa duoc chang chua mo");
        }
        weekRepository.delete(week);
    }

    @Transactional
    public Map<String, Object> startJourney(String journeyId, String userId) {
        GroupJourney journey = loadJourney(journeyId);
        requireLeaderOrMod(journey.getGroup().getId(), userId);
        if (journey.getStatus() != GroupJourney.Status.DRAFT) {
            throw new IllegalStateException("Hanh trinh da bat dau");
        }
        if (weekRepository.countByJourneyId(journeyId) == 0) {
            throw new IllegalStateException("Hanh trinh can it nhat 1 chang");
        }
        journey.setStatus(GroupJourney.Status.ACTIVE);
        journey.setStartedAt(LocalDateTime.now());
        journeyRepository.save(journey);
        return toJourneySummary(journey, weekRepository.countByJourneyId(journeyId));
    }

    /**
     * Open the next LOCKED week: delegate to {@link ScheduledQuizService#create}
     * (snapshot + member notification) and pin the new scheduledQuizId on the
     * week. The week's deadline = the scheduled quiz deadline (D1).
     */
    @Transactional
    public Map<String, Object> openNextWeek(String journeyId, String userId,
                                            LocalDateTime deadline) {
        GroupJourney journey = loadJourney(journeyId);
        String groupId = journey.getGroup().getId();
        requireLeaderOrMod(groupId, userId);
        if (journey.getStatus() != GroupJourney.Status.ACTIVE) {
            throw new IllegalStateException("Hay bat dau hanh trinh truoc");
        }
        GroupJourneyWeek next = weekRepository.findByJourneyIdOrderByWeekNumberAsc(journeyId).stream()
                .filter(w -> w.getStatus() == GroupJourneyWeek.Status.LOCKED)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Tat ca chang da duoc mo"));

        Map<String, Object> created = scheduledQuizService.create(
                groupId, userId, next.getQuizSetId(), next.getTitle(),
                journey.getTitle(), deadline, null, true, true);

        next.setScheduledQuizId((String) created.get("id"));
        next.setStatus(GroupJourneyWeek.Status.OPEN);
        weekRepository.save(next);
        log.info("[GroupJourney] opened week={} journey={} scheduledQuiz={}",
                next.getWeekNumber(), journeyId, next.getScheduledQuizId());
        return toWeekSummary(next, (String) created.get("deadline"));
    }

    // ── read ────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> listJourneys(String groupId) {
        return journeyRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(j -> toJourneySummary(j, weekRepository.countByJourneyId(j.getId())))
                .collect(Collectors.toList());
    }

    /**
     * Journey + live progress aggregated from {@link ScheduledQuizAttempt}:
     * overall stage k/N, per-week done X/Y, the viewer's personal done-list,
     * and (leader/mod only) the not-done roster per open week.
     */
    public Map<String, Object> getJourneyWithProgress(String journeyId, String viewerId) {
        GroupJourney journey = loadJourney(journeyId);
        String groupId = journey.getGroup().getId();
        List<GroupJourneyWeek> weeks = weekRepository.findByJourneyIdOrderByWeekNumberAsc(journeyId);

        List<GroupMember> members = memberRepository.findByGroupId(groupId);
        int totalMembers = members.size();
        boolean viewerIsLeader = members.stream().anyMatch(m ->
                m.getUser() != null && m.getUser().getId().equals(viewerId)
                && (m.getRole() == GroupMember.GroupRole.LEADER || m.getRole() == GroupMember.GroupRole.MOD));

        int weeksOpened = 0;
        int viewerDoneCount = 0;
        List<Map<String, Object>> weekDtos = new ArrayList<>();
        for (GroupJourneyWeek w : weeks) {
            Map<String, Object> dto = toWeekSummary(w, null);
            if (w.getScheduledQuizId() != null) {
                weeksOpened++;
                ScheduledQuiz sq = scheduledQuizRepository.findById(w.getScheduledQuizId()).orElse(null);
                if (sq != null) {
                    dto.put("deadline", sq.getDeadline());
                    dto.put("scheduledStatus", sq.getStatus().name());
                }
                Set<String> doneUserIds = attemptRepository.findByScheduledQuizId(w.getScheduledQuizId())
                        .stream().map(a -> a.getUser().getId()).collect(Collectors.toSet());
                dto.put("doneCount", doneUserIds.size());
                boolean viewerDone = doneUserIds.contains(viewerId);
                dto.put("viewerDone", viewerDone);
                if (viewerDone) viewerDoneCount++;
                if (viewerIsLeader) {
                    dto.put("notDone", members.stream()
                            .filter(m -> m.getUser() != null && !doneUserIds.contains(m.getUser().getId()))
                            .map(m -> Map.of("userId", m.getUser().getId(),
                                    "name", m.getUser().getName() != null ? m.getUser().getName() : ""))
                            .collect(Collectors.toList()));
                }
            } else {
                dto.put("doneCount", 0);
                dto.put("viewerDone", false);
            }
            weekDtos.add(dto);
        }

        Map<String, Object> result = toJourneySummary(journey, (long) weeks.size());
        result.put("totalMembers", totalMembers);
        result.put("weeksTotal", weeks.size());
        result.put("weeksOpened", weeksOpened);
        result.put("viewerDoneCount", viewerDoneCount);
        result.put("viewerIsLeader", viewerIsLeader);
        result.put("weeks", weekDtos);
        return result;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private GroupMember requireLeaderOrMod(String groupId, String userId) {
        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Ban khong phai thanh vien cua nhom"));
        if (member.getRole() != GroupMember.GroupRole.LEADER
                && member.getRole() != GroupMember.GroupRole.MOD) {
            throw new IllegalArgumentException("Chi leader hoac mod moi co the quan ly hanh trinh");
        }
        return member;
    }

    private GroupJourney loadJourney(String journeyId) {
        return journeyRepository.findById(journeyId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay hanh trinh"));
    }

    private Map<String, Object> toJourneySummary(GroupJourney j, long weekCount) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", j.getId());
        m.put("groupId", j.getGroup().getId());
        m.put("title", j.getTitle());
        m.put("description", j.getDescription());
        m.put("status", j.getStatus().name());
        m.put("weekCount", weekCount);
        m.put("createdBy", j.getCreatedBy() != null ? j.getCreatedBy().getId() : null);
        m.put("createdAt", j.getCreatedAt());
        m.put("startedAt", j.getStartedAt());
        m.put("completedAt", j.getCompletedAt());
        return m;
    }

    private Map<String, Object> toWeekSummary(GroupJourneyWeek w, Object deadline) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", w.getId());
        m.put("weekNumber", w.getWeekNumber());
        m.put("title", w.getTitle());
        m.put("quizSetId", w.getQuizSetId());
        m.put("scheduledQuizId", w.getScheduledQuizId());
        m.put("status", w.getStatus().name());
        if (deadline != null) m.put("deadline", deadline);
        return m;
    }
}
