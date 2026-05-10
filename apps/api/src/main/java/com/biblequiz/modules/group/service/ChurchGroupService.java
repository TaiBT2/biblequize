package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.entity.GroupAnnouncement;
import com.biblequiz.modules.group.entity.GroupKickLog;
import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.entity.GroupReport;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;
import com.biblequiz.modules.group.repository.GroupAnnouncementRepository;
import com.biblequiz.modules.group.repository.GroupKickLogRepository;
import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import com.biblequiz.modules.group.repository.GroupReportRepository;
import com.biblequiz.modules.group.entity.ScheduledQuiz;
import com.biblequiz.modules.group.repository.ScheduledQuizRepository;
import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
public class ChurchGroupService {

    @Autowired
    private ChurchGroupRepository churchGroupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupAnnouncementRepository groupAnnouncementRepository;

    @Autowired
    private GroupQuizSetRepository groupQuizSetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDailyProgressRepository udpRepository;

    @Autowired
    private GroupKickLogRepository groupKickLogRepository;

    @Autowired
    private GroupReportRepository groupReportRepository;

    @Autowired(required = false)
    private ScheduledQuizRepository scheduledQuizRepository;

    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    // SPEC v1.1 §12.2 + Phụ lục A — kicked user can't rejoin within 7 days.
    private static final int KICK_COOLDOWN_DAYS = 7;

    public Map<String, Object> createGroup(String name, String description, User leader) {
        return createGroup(name, description, true, leader);
    }

    // SPEC v1.1 §4.2 + Phụ lục A: max groups owned per user.
    private static final int MAX_GROUPS_OWNED = 2;
    // SPEC v1.1 §4.3 + Phụ lục A: max groups joined per user (anti-spam).
    private static final int MAX_GROUPS_JOINED = 5;

    public Map<String, Object> createGroup(String name, String description, boolean isPublic, User leader) {
        long owned = churchGroupRepository.countActiveByLeaderId(leader.getId());
        if (owned >= MAX_GROUPS_OWNED) {
            throw new RuntimeException("MAX_GROUPS_OWNED");
        }

        String code = generateGroupCode();

        ChurchGroup group = new ChurchGroup();
        group.setId(UUID.randomUUID().toString());
        group.setName(name);
        group.setGroupCode(code);
        group.setDescription(description);
        group.setIsPublic(isPublic);
        group.setLeader(leader);
        group.setMemberCount(1);
        churchGroupRepository.save(group);

        GroupMember leaderMember = new GroupMember();
        leaderMember.setId(UUID.randomUUID().toString());
        leaderMember.setGroup(group);
        leaderMember.setUser(leader);
        leaderMember.setRole(GroupMember.GroupRole.LEADER);
        groupMemberRepository.save(leaderMember);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", group.getId());
        result.put("name", group.getName());
        result.put("code", group.getGroupCode());
        result.put("isPublic", group.getIsPublic());
        result.put("memberCount", group.getMemberCount());
        return result;
    }

    public Map<String, Object> joinGroup(String groupCode, User user) {
        ChurchGroup group = churchGroupRepository.findByGroupCode(groupCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        if (group.isFull()) {
            throw new RuntimeException("Nhom da day");
        }

        Optional<GroupMember> existing = groupMemberRepository.findByGroupIdAndUserId(group.getId(), user.getId());
        if (existing.isPresent()) {
            throw new RuntimeException("Ban da la thanh vien cua nhom nay");
        }

        // SPEC v1.1 §4.3: max 5 groups joined per user.
        long joined = groupMemberRepository.countByUserId(user.getId());
        if (joined >= MAX_GROUPS_JOINED) {
            throw new RuntimeException("MAX_GROUPS_JOINED");
        }

        // SPEC v1.1 §12.2: 7-day cooldown after a kick. Surface the structured
        // code so the controller can respond 422 with i18n-friendly copy.
        LocalDateTime cooldownCutoff = LocalDateTime.now().minusDays(KICK_COOLDOWN_DAYS);
        if (groupKickLogRepository.existsRecentKick(group.getId(), user.getId(), cooldownCutoff)) {
            throw new RuntimeException("KICK_COOLDOWN_ACTIVE");
        }

        GroupMember member = new GroupMember();
        member.setId(UUID.randomUUID().toString());
        member.setGroup(group);
        member.setUser(user);
        member.setRole(GroupMember.GroupRole.MEMBER);
        groupMemberRepository.save(member);

        group.setMemberCount(group.getMemberCount() + 1);
        churchGroupRepository.save(group);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("groupId", group.getId());
        result.put("role", member.getRole().name());
        return result;
    }

    public Map<String, Object> leaveGroup(String groupId, User user) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));

        if (member.getRole() == GroupMember.GroupRole.LEADER) {
            throw new RuntimeException("LEADER_CANNOT_LEAVE");
        }

        groupMemberRepository.delete(member);

        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        churchGroupRepository.save(group);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        return result;
    }

    /**
     * Returns a small "is the user in any group?" payload for the
     * Home mode-card live hint (HM-P1-1). When the user is in
     * multiple groups, picks the first by joined-at order — the home
     * card just needs ONE name to render "Trong {groupName}".
     */
    public Map<String, Object> getMyGroup(String userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserId(userId);
        if (memberships.isEmpty()) {
            return Map.of("hasGroup", false);
        }
        GroupMember primary = memberships.get(0);
        ChurchGroup group = primary.getGroup();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hasGroup", true);
        result.put("groupId", group.getId());
        result.put("groupName", group.getName());
        result.put("memberCount", groupMemberRepository.countByGroupId(group.getId()));
        result.put("role", primary.getRole().name());
        return result;
    }

    /**
     * List ALL groups the user belongs to with embedded weekly summary
     * (memberCount, avgScore, accuracy, activeWeek, lastActivityAt, myRank).
     * Powers the multi-group /groups index page. Stats are NOT role-gated —
     * any member can see the group's basic weekly numbers.
     */
    public List<Map<String, Object>> listMyGroupsWithSummary(String userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserId(userId);
        if (memberships.isEmpty()) return new ArrayList<>();

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate weekStart = today.minusDays(6);

        List<Map<String, Object>> result = new ArrayList<>();
        for (GroupMember mySeat : memberships) {
            ChurchGroup group = mySeat.getGroup();
            List<GroupMember> members = groupMemberRepository.findByGroupId(group.getId());

            long totalPoints = 0;
            long totalQuestions = 0;
            int activeMembers = 0;
            int myWeekPoints = 0;
            List<Integer> memberWeekPoints = new ArrayList<>();
            LocalDateTime maxActivity = null;

            for (GroupMember m : members) {
                String mUserId = m.getUser().getId();
                if (m.getLastActiveAt() != null
                        && (maxActivity == null || m.getLastActiveAt().isAfter(maxActivity))) {
                    maxActivity = m.getLastActiveAt();
                }
                int memberPts = 0;
                int memberQs = 0;
                for (UserDailyProgress udp : udpRepository.findByUserIdAndDateBetween(mUserId, weekStart, today)) {
                    memberPts += udp.getPointsCounted() != null ? udp.getPointsCounted() : 0;
                    memberQs += udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0;
                }
                if (memberQs > 0) activeMembers++;
                totalPoints += memberPts;
                totalQuestions += memberQs;
                memberWeekPoints.add(memberPts);
                if (mUserId.equals(userId)) myWeekPoints = memberPts;
            }

            int avgScore = activeMembers > 0
                    ? (int) Math.round((double) totalPoints / activeMembers)
                    : 0;
            int accuracy = totalQuestions > 0
                    ? (int) Math.min(100, Math.round((double) totalPoints / (totalQuestions * 10) * 100))
                    : 0;
            final int myPoints = myWeekPoints;
            long myRank = 1 + memberWeekPoints.stream().filter(p -> p > myPoints).count();

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", group.getId());
            entry.put("name", group.getName());
            entry.put("description", group.getDescription());
            entry.put("avatarUrl", group.getAvatarUrl());
            entry.put("code", group.getGroupCode());
            entry.put("isPublic", group.getIsPublic());
            entry.put("role", mySeat.getRole().name());
            entry.put("memberCount", members.size());
            entry.put("avgScore", avgScore);
            entry.put("accuracy", accuracy);
            entry.put("activeWeek", activeMembers);
            entry.put("lastActivityAt", maxActivity);
            entry.put("myWeekPoints", myWeekPoints);
            entry.put("myRank", (int) myRank);
            result.add(entry);
        }
        return result;
    }

    public Map<String, Object> getGroupDetails(String groupId) {
        return getGroupDetails(groupId, null);
    }

    /**
     * Detail with optional viewer context. When {@code viewerUserId} is passed,
     * the response includes {@code myRole} so the FE doesn't have to guess
     * leadership by matching names (which fails when display names differ from
     * the user record).
     */
    public Map<String, Object> getGroupDetails(String groupId, String viewerUserId) {
        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);

        String myRole = null;
        for (GroupMember m : members) {
            if (viewerUserId != null && viewerUserId.equals(m.getUser().getId())) {
                myRole = m.getRole().name();
                break;
            }
        }

        List<Map<String, Object>> memberList = members.stream().map(m -> {
            Map<String, Object> memberMap = new LinkedHashMap<>();
            memberMap.put("id", m.getUser().getId());
            memberMap.put("userId", m.getUser().getId()); // FE compatibility — Member interface expects userId
            memberMap.put("name", m.getUser().getName());
            memberMap.put("avatarUrl", m.getUser().getAvatarUrl());
            memberMap.put("role", m.getRole().name());
            memberMap.put("joinedAt", m.getJoinedAt());
            return memberMap;
        }).collect(Collectors.toList());

        // Self-heal: cached memberCount may drift from actual member rows (legacy data,
        // race conditions, soft-delete edge cases). Always reconcile on read.
        int actualCount = members.size();
        if (actualCount != group.getMemberCount()) {
            group.setMemberCount(actualCount);
            churchGroupRepository.save(group);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", group.getId());
        result.put("name", group.getName());
        result.put("code", group.getGroupCode());
        result.put("description", group.getDescription());
        result.put("avatarUrl", group.getAvatarUrl());
        result.put("isPublic", group.getIsPublic());
        result.put("maxMembers", group.getMaxMembers());
        result.put("memberCount", actualCount);
        result.put("leaderId", group.getLeader().getId());
        result.put("leaderUserId", group.getLeader().getId()); // FE compatibility
        result.put("createdAt", group.getCreatedAt());
        result.put("members", memberList);
        if (myRole != null) result.put("myRole", myRole);
        return result;
    }

    /**
     * Discovery widget on the empty-state Groups page. Returns up to {@code limit}
     * public, non-deleted, non-locked groups. {@code featured=true} sorts by
     * memberCount (engagement proxy); {@code featured=false} sorts by createdAt
     * (newest first). No auth required — intentionally public-readable.
     */
    public List<Map<String, Object>> listPublicGroups(int limit, boolean featured) {
        int safeLimit = Math.max(1, Math.min(50, limit));
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, safeLimit);
        List<ChurchGroup> groups = featured
                ? churchGroupRepository.findPublicGroupsByMemberCountDesc(pageable)
                : churchGroupRepository.findPublicGroupsByCreatedAtDesc(pageable);

        return groups.stream().map(g -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", g.getId());
            entry.put("name", g.getName());
            entry.put("code", g.getGroupCode());
            entry.put("description", g.getDescription());
            entry.put("avatarUrl", g.getAvatarUrl());
            entry.put("memberCount", g.getMemberCount());
            entry.put("maxMembers", g.getMaxMembers());
            entry.put("createdAt", g.getCreatedAt());
            return entry;
        }).collect(Collectors.toList());
    }

    /**
     * Paginated, searchable, filterable members list for the GroupDetail
     * "members" tab. Sort options: score (joins UserDailyProgress 7-day
     * window), tier (proxy via score), activity (lastActiveAt), joined
     * (joinedAt). Filter values: leader / mod / member / inactive.
     * Inactive = lastActiveAt < now() - 7 days (or NULL fallback).
     *
     * <p>The cursor is a 1-based offset encoded as String for parity with
     * future opaque-cursor migrations; "null cursor" means start at 0.
     */
    public Map<String, Object> listMembers(String groupId, String search, String sort, String order,
                                            String filter, int limit, String cursor) {
        int safeLimit = Math.max(1, Math.min(50, limit));
        int offset = 0;
        if (cursor != null && !cursor.isBlank()) {
            try { offset = Math.max(0, Integer.parseInt(cursor)); } catch (NumberFormatException ignored) {}
        }

        List<GroupMember> all = groupMemberRepository.findByGroupId(groupId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate weekStart = today.minusDays(6);
        LocalDateTime inactiveThreshold = LocalDateTime.now(ZoneOffset.UTC).minusDays(7);

        // Pre-compute weekly score per member for sort=score (single pass)
        Map<String, Integer> weeklyScores = new HashMap<>();
        for (GroupMember m : all) {
            int score = udpRepository.findByUserIdAndDateBetween(m.getUser().getId(), weekStart, today).stream()
                    .mapToInt(u -> u.getPointsCounted() != null ? u.getPointsCounted() : 0)
                    .sum();
            weeklyScores.put(m.getUser().getId(), score);
        }

        // Filter
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase();
        String normalizedFilter = filter == null ? "" : filter.trim().toLowerCase();

        List<GroupMember> filtered = all.stream()
                .filter(m -> {
                    if (!normalizedSearch.isEmpty()) {
                        String name = m.getUser().getName();
                        if (name == null || !name.toLowerCase().contains(normalizedSearch)) return false;
                    }
                    if (normalizedFilter.isEmpty()) return true;
                    if ("leader".equals(normalizedFilter)) return m.getRole() == GroupMember.GroupRole.LEADER;
                    if ("mod".equals(normalizedFilter)) return m.getRole() == GroupMember.GroupRole.MOD;
                    if ("member".equals(normalizedFilter)) return m.getRole() == GroupMember.GroupRole.MEMBER;
                    if ("inactive".equals(normalizedFilter)) {
                        LocalDateTime last = m.getLastActiveAt();
                        return last == null || last.isBefore(inactiveThreshold);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // Sort
        String sortKey = sort == null ? "score" : sort.toLowerCase();
        boolean asc = "asc".equalsIgnoreCase(order);
        Comparator<GroupMember> cmp;
        switch (sortKey) {
            case "joined":
                cmp = Comparator.comparing(GroupMember::getJoinedAt,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "activity":
                cmp = Comparator.comparing(GroupMember::getLastActiveAt,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "tier":
                // Proxy: same direction as score ranking
                cmp = Comparator.comparingInt(m -> -weeklyScores.getOrDefault(m.getUser().getId(), 0));
                break;
            case "score":
            default:
                cmp = Comparator.comparingInt(m -> -weeklyScores.getOrDefault(m.getUser().getId(), 0));
                break;
        }
        if (asc) cmp = cmp.reversed();
        filtered.sort(cmp);

        int total = filtered.size();
        int end = Math.min(offset + safeLimit, total);
        List<GroupMember> page = offset < total ? filtered.subList(offset, end) : List.of();

        List<Map<String, Object>> items = page.stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", m.getUser().getId());
            row.put("name", m.getUser().getName());
            row.put("avatarUrl", m.getUser().getAvatarUrl());
            row.put("role", m.getRole().name());
            row.put("joinedAt", m.getJoinedAt());
            row.put("lastActiveAt", m.getLastActiveAt());
            row.put("score", weeklyScores.getOrDefault(m.getUser().getId(), 0));
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("nextCursor", end < total ? String.valueOf(end) : null);
        result.put("hasMore", end < total);
        return result;
    }

    /**
     * Promote/demote a group member. Only the LEADER can call. Cannot
     * change another LEADER's role (single-leader invariant — transfer
     * ownership is a separate flow not part of this sprint).
     */
    public Map<String, Object> changeMemberRole(String groupId, String requesterId, String targetUserId, String newRole) {
        if (newRole == null || newRole.isBlank()) {
            throw new RuntimeException("Vai tro moi khong duoc de trong");
        }
        GroupMember.GroupRole parsed;
        try {
            parsed = GroupMember.GroupRole.valueOf(newRole.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Vai tro khong hop le: " + newRole);
        }
        if (parsed == GroupMember.GroupRole.LEADER) {
            throw new RuntimeException("Khong the gan vai tro LEADER (chuyen quyen leader la quy trinh rieng)");
        }

        GroupMember requester = groupMemberRepository.findByGroupIdAndUserId(groupId, requesterId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));
        if (requester.getRole() != GroupMember.GroupRole.LEADER) {
            throw new RuntimeException("Chi leader moi duoc doi vai tro thanh vien");
        }

        if (requesterId.equals(targetUserId)) {
            throw new RuntimeException("Khong the doi vai tro chinh minh");
        }

        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Nguoi dung khong phai thanh vien cua nhom"));
        if (target.getRole() == GroupMember.GroupRole.LEADER) {
            throw new RuntimeException("Khong the doi vai tro cua leader hien tai");
        }

        target.setRole(parsed);
        groupMemberRepository.save(target);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", targetUserId);
        result.put("role", parsed.name());
        return result;
    }

    public List<Map<String, Object>> getLeaderboard(String groupId, String period) {
        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        List<Map<String, Object>> entries = members.stream().map(m -> {
            String userId = m.getUser().getId();
            int score = 0;
            int questionsAnswered = 0;

            if ("daily".equalsIgnoreCase(period)) {
                Optional<UserDailyProgress> udp = udpRepository.findByUserIdAndDate(userId, today);
                if (udp.isPresent()) {
                    score = udp.get().getPointsCounted() != null ? udp.get().getPointsCounted() : 0;
                    questionsAnswered = udp.get().getQuestionsCounted() != null ? udp.get().getQuestionsCounted() : 0;
                }
            } else if ("weekly".equalsIgnoreCase(period)) {
                LocalDate weekStart = today.minusDays(6);
                List<UserDailyProgress> udps = udpRepository.findByUserIdAndDateBetween(userId, weekStart, today);
                score = udps.stream().mapToInt(u -> u.getPointsCounted() != null ? u.getPointsCounted() : 0).sum();
                questionsAnswered = udps.stream().mapToInt(u -> u.getQuestionsCounted() != null ? u.getQuestionsCounted() : 0).sum();
            } else {
                // all_time
                List<UserDailyProgress> all = udpRepository.findByUserIdOrderByDateDesc(userId);
                score = all.stream().mapToInt(u -> u.getPointsCounted() != null ? u.getPointsCounted() : 0).sum();
                questionsAnswered = all.stream().mapToInt(u -> u.getQuestionsCounted() != null ? u.getQuestionsCounted() : 0).sum();
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId", userId);
            entry.put("name", m.getUser().getName());
            entry.put("avatarUrl", m.getUser().getAvatarUrl());
            entry.put("role", m.getRole().name());
            entry.put("period", period);
            entry.put("score", score);
            entry.put("questionsAnswered", questionsAnswered);
            return entry;
        }).collect(Collectors.toList());

        // Sort by score descending
        entries.sort((a, b) -> Integer.compare((int) b.get("score"), (int) a.get("score")));
        return entries;
    }

    public Map<String, Object> getAnalytics(String groupId, String requesterId) {
        GroupMember requester = groupMemberRepository.findByGroupIdAndUserId(groupId, requesterId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));

        if (requester.getRole() != GroupMember.GroupRole.LEADER && requester.getRole() != GroupMember.GroupRole.MOD) {
            throw new RuntimeException("Khong co quyen truy cap");
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate weekStart = today.minusDays(6);

        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        int totalMembers = members.size();

        // ── Active counts ───────────────────────────────────────────────
        long activeToday = 0;
        long activeWeek = 0;
        long inactiveCount = 0;
        // ── Aggregates over the past 7 days for KPI panel ────────────────
        long totalQuestionsWeek = 0;
        long totalPointsWeek = 0;
        // ── Per-member tally for top contributors ratting ────────────────
        List<Map<String, Object>> contributorRows = new ArrayList<>();
        // ── Daily bucket for weekly activity chart (Mon..Sun aligned to today-6..today) ──
        int[] dailyActiveCounts = new int[7];

        for (GroupMember m : members) {
            String userId = m.getUser().getId();
            Optional<UserDailyProgress> todayUdp = udpRepository.findByUserIdAndDate(userId, today);
            boolean playedToday = todayUdp.isPresent()
                    && todayUdp.get().getQuestionsCounted() != null
                    && todayUdp.get().getQuestionsCounted() > 0;
            if (playedToday) activeToday++;

            List<UserDailyProgress> weekUdps = udpRepository.findByUserIdAndDateBetween(userId, weekStart, today);
            int memberWeekPoints = 0;
            int memberWeekQuestions = 0;
            boolean activeAnyDay = false;
            for (UserDailyProgress udp : weekUdps) {
                int q = udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0;
                int p = udp.getPointsCounted() != null ? udp.getPointsCounted() : 0;
                memberWeekPoints += p;
                memberWeekQuestions += q;
                if (q > 0) {
                    activeAnyDay = true;
                    int dayIdx = (int) java.time.temporal.ChronoUnit.DAYS.between(weekStart, udp.getDate());
                    if (dayIdx >= 0 && dayIdx < 7) {
                        dailyActiveCounts[dayIdx] += 1;
                    }
                }
            }
            if (activeAnyDay) activeWeek++;
            else inactiveCount++;

            totalQuestionsWeek += memberWeekQuestions;
            totalPointsWeek += memberWeekPoints;

            if (memberWeekQuestions > 0) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("userId", userId);
                row.put("name", m.getUser().getName());
                row.put("avatarUrl", m.getUser().getAvatarUrl());
                row.put("score", memberWeekPoints);
                row.put("questionsAnswered", memberWeekQuestions);
                contributorRows.add(row);
            }
        }

        // Top contributors: sort by score DESC, take 5
        contributorRows.sort((a, b) -> Integer.compare((int) b.get("score"), (int) a.get("score")));
        List<Map<String, Object>> topContributors = contributorRows.stream().limit(5).collect(Collectors.toList());

        // Weekly activity series — index 0 = oldest day, 6 = today
        List<Map<String, Object>> weeklyActivity = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", weekStart.plusDays(i).toString());
            day.put("activeCount", dailyActiveCounts[i]);
            weeklyActivity.add(day);
        }

        int avgScore = activeWeek > 0 ? (int) Math.round((double) totalPointsWeek / activeWeek) : 0;
        // Accuracy proxy: pointsPerQuestion ≈ 10 in BibleQuiz scoring. Pure derivation
        // until UserDailyProgress carries an explicit correct-count column.
        int accuracy = totalQuestionsWeek > 0
                ? (int) Math.min(100, Math.round((double) totalPointsWeek / (totalQuestionsWeek * 10) * 100))
                : 0;
        // Approximate quiz session count as questions / 10 (5-question quizzes are also possible
        // but 10-question is the dominant default). Real distinct-session count would require
        // joining QuizSession — defer until that becomes a sprint priority.
        int totalQuizzes = (int) Math.round((double) totalQuestionsWeek / 10);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalMembers", totalMembers);
        result.put("activeToday", (int) activeToday);
        result.put("activeWeek", (int) activeWeek);
        result.put("inactiveCount", (int) inactiveCount);
        result.put("avgScore", avgScore);
        result.put("accuracy", accuracy);
        result.put("totalQuizzes", totalQuizzes);
        result.put("totalPointsWeek", (int) totalPointsWeek);
        result.put("totalQuestionsWeek", (int) totalQuestionsWeek);
        result.put("weeklyActivity", weeklyActivity);
        result.put("topContributors", topContributors);
        return result;
    }

    public Map<String, Object> createQuizSet(String groupId, String userId, String name, List<String> questionIds) {
        return createQuizSet(groupId, userId, name, questionIds, null);
    }

    /** Sprint 5: create với optional metadata. metadata keys: description, coverImageUrl,
     *  tags (List), coverScripture, authorNote, suggestedMode, folderId, language. */
    public Map<String, Object> createQuizSet(String groupId, String userId, String name,
                                              List<String> questionIds, Map<String, Object> metadata) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));

        if (member.getRole() != GroupMember.GroupRole.LEADER && member.getRole() != GroupMember.GroupRole.MOD) {
            throw new RuntimeException("Khong co quyen tao quiz set");
        }

        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        GroupQuizSet quizSet = new GroupQuizSet();
        quizSet.setId(UUID.randomUUID().toString());
        quizSet.setGroup(group);
        quizSet.setCreatedBy(member.getUser());
        quizSet.setName(name);
        quizSet.setQuestionIds(questionIds);
        quizSet.setTotalQuestions(questionIds == null ? 0 : questionIds.size());
        // Sprint 5: default DRAFT cho quiz set mới (cần publish thủ công).
        quizSet.setPublishStatus(GroupQuizSet.PublishStatus.DRAFT);
        applyMetadata(quizSet, metadata);
        groupQuizSetRepository.save(quizSet);

        return quizSetToMap(quizSet);
    }

    /** Sprint 5: PATCH metadata. Owner (creator) hoặc LEADER được sửa. */
    public Map<String, Object> updateQuizSet(String groupId, String setId, String userId,
                                              String name, List<String> questionIds, Map<String, Object> metadata) {
        GroupQuizSet set = groupQuizSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Quiz set khong ton tai"));
        if (!set.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Quiz set khong thuoc nhom nay");
        }
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));
        boolean isOwner = set.getCreatedBy().getId().equals(userId);
        boolean isLeader = member.getRole() == GroupMember.GroupRole.LEADER;
        if (!isOwner && !isLeader) {
            throw new RuntimeException("Khong co quyen sua quiz set nay");
        }
        if (name != null && !name.isBlank()) set.setName(name);
        if (questionIds != null) {
            set.setQuestionIds(questionIds);
            set.setTotalQuestions(questionIds.size());
        }
        applyMetadata(set, metadata);
        groupQuizSetRepository.save(set);
        return quizSetToMap(set);
    }

    @SuppressWarnings("unchecked")
    private void applyMetadata(GroupQuizSet set, Map<String, Object> m) {
        if (m == null) return;
        if (m.containsKey("description")) set.setDescription((String) m.get("description"));
        if (m.containsKey("coverImageUrl")) set.setCoverImageUrl((String) m.get("coverImageUrl"));
        if (m.containsKey("tags") && m.get("tags") instanceof List<?> tagList) {
            // Cap tối đa 5 tags theo SPEC v1.3.
            set.setTags(tagList.size() > 5 ? tagList.subList(0, 5) : tagList);
        }
        if (m.containsKey("coverScripture")) set.setCoverScripture((String) m.get("coverScripture"));
        if (m.containsKey("authorNote")) set.setAuthorNote((String) m.get("authorNote"));
        if (m.containsKey("suggestedMode")) set.setSuggestedMode((String) m.get("suggestedMode"));
        if (m.containsKey("folderId")) set.setFolderId((String) m.get("folderId"));
        if (m.containsKey("language")) set.setLanguage((String) m.get("language"));
    }

    /** Map GroupQuizSet → response. Reuse cho create/update/list/detail. */
    public static Map<String, Object> quizSetToMap(GroupQuizSet qs) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", qs.getId());
        map.put("groupId", qs.getGroup() != null ? qs.getGroup().getId() : null);
        map.put("name", qs.getName());
        map.put("questionIds", qs.getQuestionIds());
        map.put("totalQuestions", qs.getTotalQuestions());
        map.put("createdBy", qs.getCreatedBy() != null ? qs.getCreatedBy().getId() : null);
        map.put("createdAt", qs.getCreatedAt());
        map.put("updatedAt", qs.getUpdatedAt());
        map.put("language", qs.getLanguage());
        // Sprint 5 metadata
        map.put("description", qs.getDescription());
        map.put("coverImageUrl", qs.getCoverImageUrl());
        map.put("tags", qs.getTags());
        map.put("coverScripture", qs.getCoverScripture());
        map.put("authorNote", qs.getAuthorNote());
        map.put("difficulty", qs.getDifficulty() != null ? qs.getDifficulty().name() : null);
        map.put("estimatedDurationMin", qs.getEstimatedDurationMin());
        map.put("suggestedMode", qs.getSuggestedMode());
        map.put("playCount", qs.getPlayCount());
        map.put("averageRating", qs.getAverageRating());
        map.put("totalRatings", qs.getTotalRatings());
        map.put("lastPlayedAt", qs.getLastPlayedAt());
        map.put("publishStatus", qs.getPublishStatus() != null ? qs.getPublishStatus().name() : null);
        map.put("publishedAt", qs.getPublishedAt());
        map.put("archivedAt", qs.getArchivedAt());
        map.put("folderId", qs.getFolderId());
        return map;
    }

    // ── Sprint 5 Q-5: Quiz set workflow (publish/archive/unarchive/clone/soft-delete) ──

    @Transactional
    public Map<String, Object> publishQuizSet(String groupId, String setId, String userId) {
        GroupQuizSet set = ownerOrLeaderOnly(groupId, setId, userId);
        if (set.getPublishStatus() != GroupQuizSet.PublishStatus.DRAFT) {
            throw new RuntimeException("Chi quiz set DRAFT moi co the xuat ban (hien: " + set.getPublishStatus() + ")");
        }
        if (set.getTotalQuestions() == null || set.getTotalQuestions() < 5) {
            throw new RuntimeException("Can toi thieu 5 cau hoi de xuat ban");
        }
        set.setPublishStatus(GroupQuizSet.PublishStatus.PUBLISHED);
        set.setPublishedAt(LocalDateTime.now());
        // Auto-derive: defer Sprint 6 (Question.Difficulty enum mismatch) — fallback MEDIUM.
        if (set.getDifficulty() == null) set.setDifficulty(GroupQuizSet.Difficulty.MEDIUM);
        if (set.getEstimatedDurationMin() == null) {
            set.setEstimatedDurationMin(Math.max(1, set.getTotalQuestions() * 30 / 60));
        }
        groupQuizSetRepository.save(set);
        return quizSetToMap(set);
    }

    @Transactional
    public Map<String, Object> archiveQuizSet(String groupId, String setId, String userId) {
        GroupQuizSet set = ownerOrLeaderOnly(groupId, setId, userId);
        if (set.getPublishStatus() != GroupQuizSet.PublishStatus.PUBLISHED) {
            throw new RuntimeException("Chi quiz set PUBLISHED moi co the luu tru");
        }
        if (scheduledQuizRepository != null
                && scheduledQuizRepository.existsByQuizSetIdAndStatus(setId, ScheduledQuiz.Status.ACTIVE)) {
            throw new RuntimeException("Khong the luu tru — co bai quiz len lich dang dung bo nay");
        }
        set.setPublishStatus(GroupQuizSet.PublishStatus.ARCHIVED);
        set.setArchivedAt(LocalDateTime.now());
        groupQuizSetRepository.save(set);
        return quizSetToMap(set);
    }

    @Transactional
    public Map<String, Object> unarchiveQuizSet(String groupId, String setId, String userId) {
        GroupQuizSet set = ownerOrLeaderOnly(groupId, setId, userId);
        if (set.getPublishStatus() != GroupQuizSet.PublishStatus.ARCHIVED) {
            throw new RuntimeException("Chi quiz set ARCHIVED moi co the khoi phuc");
        }
        set.setPublishStatus(GroupQuizSet.PublishStatus.PUBLISHED);
        set.setArchivedAt(null);
        // Giữ playCount + averageRating; reset publishedAt = now (treated as re-publish moment).
        set.setPublishedAt(LocalDateTime.now());
        groupQuizSetRepository.save(set);
        return quizSetToMap(set);
    }

    @Transactional
    public Map<String, Object> softDeleteQuizSet(String groupId, String setId, String userId) {
        GroupQuizSet set = ownerOrLeaderOnly(groupId, setId, userId);
        if (scheduledQuizRepository != null
                && scheduledQuizRepository.existsByQuizSetIdAndStatus(setId, ScheduledQuiz.Status.ACTIVE)) {
            throw new RuntimeException("Khong the xoa — co bai quiz len lich dang dung bo nay");
        }
        set.setPublishStatus(GroupQuizSet.PublishStatus.SOFT_DELETED);
        set.setDeletedAt(LocalDateTime.now());
        groupQuizSetRepository.save(set);
        return quizSetToMap(set);
    }

    @Transactional
    public Map<String, Object> cloneQuizSet(String groupId, String setId, String userId) {
        GroupQuizSet origin = groupQuizSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Quiz set khong ton tai"));
        if (!origin.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Quiz set khong thuoc nhom nay");
        }
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));
        if (member.getRole() != GroupMember.GroupRole.LEADER && member.getRole() != GroupMember.GroupRole.MOD) {
            throw new RuntimeException("Khong co quyen clone");
        }
        GroupQuizSet copy = new GroupQuizSet();
        copy.setId(UUID.randomUUID().toString());
        copy.setGroup(origin.getGroup());
        copy.setCreatedBy(member.getUser());
        copy.setName(origin.getName() + " (Bản sao)");
        copy.setQuestionIds(origin.getQuestionIds());
        copy.setTotalQuestions(origin.getTotalQuestions());
        copy.setLanguage(origin.getLanguage());
        copy.setDescription(origin.getDescription());
        copy.setCoverImageUrl(origin.getCoverImageUrl());
        copy.setTags(origin.getTags());
        copy.setCoverScripture(origin.getCoverScripture());
        copy.setAuthorNote(origin.getAuthorNote());
        copy.setSuggestedMode(origin.getSuggestedMode());
        copy.setFolderId(origin.getFolderId());
        copy.setPublishStatus(GroupQuizSet.PublishStatus.DRAFT);
        // KHÔNG copy: playCount, averageRating, totalRatings, lastPlayedAt — bắt đầu lại từ 0.
        groupQuizSetRepository.save(copy);
        return quizSetToMap(copy);
    }

    private GroupQuizSet ownerOrLeaderOnly(String groupId, String setId, String userId) {
        GroupQuizSet set = groupQuizSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Quiz set khong ton tai"));
        if (!set.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Quiz set khong thuoc nhom nay");
        }
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));
        boolean isOwner = set.getCreatedBy().getId().equals(userId);
        boolean isLeader = member.getRole() == GroupMember.GroupRole.LEADER;
        boolean isMod = member.getRole() == GroupMember.GroupRole.MOD;
        // LEADER có quyền với mọi quiz set; MOD chỉ với quiz set của chính mình.
        if (!isLeader && !(isMod && isOwner) && !isOwner) {
            throw new RuntimeException("Khong co quyen thuc hien hanh dong nay");
        }
        return set;
    }

    // ── PATCH /groups/{id} ─────────────────────────────────────────────────

    public Map<String, Object> updateGroup(String groupId, String requesterId,
                                            String name, String description, Boolean isPublic, Integer maxMembers) {
        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        if (group.isDeleted()) throw new RuntimeException("Nhom da bi xoa");

        if (!group.getLeader().getId().equals(requesterId)) {
            throw new RuntimeException("Chi leader moi duoc cap nhat nhom");
        }

        if (name != null && !name.isBlank()) group.setName(name);
        if (description != null) group.setDescription(description);
        if (isPublic != null) group.setIsPublic(isPublic);
        if (maxMembers != null) {
            if (maxMembers < group.getMemberCount()) {
                throw new RuntimeException("maxMembers khong the nho hon so thanh vien hien tai (" + group.getMemberCount() + ")");
            }
            group.setMaxMembers(maxMembers);
        }

        churchGroupRepository.save(group);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", group.getId());
        result.put("name", group.getName());
        result.put("description", group.getDescription());
        result.put("isPublic", group.getIsPublic());
        result.put("maxMembers", group.getMaxMembers());
        return result;
    }

    // ── DELETE /groups/{id} ──────────────────────────────────────────────

    @Transactional
    public Map<String, Object> deleteGroup(String groupId, String requesterId) {
        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        if (!group.getLeader().getId().equals(requesterId)) {
            throw new RuntimeException("Chi leader moi duoc xoa nhom");
        }

        // Soft delete
        group.setDeletedAt(LocalDateTime.now(ZoneOffset.UTC));
        churchGroupRepository.save(group);

        // Remove all members
        groupMemberRepository.deleteByGroupId(groupId);
        group.setMemberCount(0);
        churchGroupRepository.save(group);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("groupId", groupId);
        return result;
    }

    // ── DELETE /groups/{id}/members/{userId} ─────────────────────────────

    public Map<String, Object> kickMember(String groupId, String requesterId, String targetUserId) {
        return kickMember(groupId, requesterId, targetUserId, null);
    }

    @Transactional
    public Map<String, Object> kickMember(String groupId, String requesterId,
                                          String targetUserId, String reason) {
        if (requesterId.equals(targetUserId)) {
            throw new RuntimeException("Khong the kick chinh minh");
        }

        GroupMember requester = groupMemberRepository.findByGroupIdAndUserId(groupId, requesterId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));

        if (requester.getRole() != GroupMember.GroupRole.LEADER && requester.getRole() != GroupMember.GroupRole.MOD) {
            throw new RuntimeException("Chi leader hoac mod moi duoc kick");
        }

        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Nguoi dung khong phai thanh vien cua nhom"));

        if (target.getRole() == GroupMember.GroupRole.LEADER) {
            throw new RuntimeException("Khong the kick leader");
        }

        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        // SPEC v1.1 §12.2: write audit row before deleting the membership so
        // joinGroup can enforce the 7-day cooldown. Bounded reason (500 chars
        // matches column).
        GroupKickLog log = new GroupKickLog();
        log.setId(UUID.randomUUID().toString());
        log.setGroup(group);
        log.setKickedUser(target.getUser());
        log.setKickedBy(requester.getUser());
        if (reason != null && !reason.isBlank()) {
            log.setReason(reason.length() > 500 ? reason.substring(0, 500) : reason);
        }
        groupKickLogRepository.save(log);

        groupMemberRepository.delete(target);

        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        churchGroupRepository.save(group);

        Map<String, Object> kickResult = new LinkedHashMap<>();
        kickResult.put("success", true);
        kickResult.put("kickedUserId", targetUserId);
        return kickResult;
    }

    /**
     * SPEC v1.1 §12.4 + §13.9: member submits a report against a group.
     * Validation: must be authenticated; can't have an existing OPEN report
     * for the same group (prevent spam-reporting). Reason is required and
     * must match the enum; note is optional.
     */
    @Transactional
    public Map<String, Object> reportGroup(String groupId, User reporter,
                                           String reasonStr, String note) {
        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        GroupReport.Reason reason;
        try {
            reason = GroupReport.Reason.valueOf(reasonStr == null ? "" : reasonStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("INVALID_REASON");
        }

        if (groupReportRepository.existsByGroupIdAndReporterIdAndStatus(
                groupId, reporter.getId(), GroupReport.Status.OPEN)) {
            throw new RuntimeException("ALREADY_REPORTED");
        }

        GroupReport report = new GroupReport();
        report.setId(UUID.randomUUID().toString());
        report.setGroup(group);
        report.setReporter(reporter);
        report.setReason(reason);
        if (note != null && !note.isBlank()) {
            // Hard cap at 1000 chars — the column is TEXT but we shouldn't
            // accept arbitrary blobs through a public endpoint.
            report.setNote(note.length() > 1000 ? note.substring(0, 1000) : note);
        }
        groupReportRepository.save(report);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", report.getId());
        result.put("status", report.getStatus().name());
        return result;
    }

    // ── POST /groups/{id}/announcements ──────────────────────────────────

    public Map<String, Object> createAnnouncement(String groupId, String userId, String content) {
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Noi dung thong bao khong duoc de trong");
        }
        if (content.length() > 500) {
            throw new RuntimeException("Noi dung thong bao khong duoc vuot qua 500 ky tu");
        }

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));

        if (member.getRole() != GroupMember.GroupRole.LEADER && member.getRole() != GroupMember.GroupRole.MOD) {
            throw new RuntimeException("Chi leader hoac mod moi duoc tao thong bao");
        }

        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        GroupAnnouncement announcement = new GroupAnnouncement();
        announcement.setId(UUID.randomUUID().toString());
        announcement.setGroup(group);
        announcement.setAuthor(member.getUser());
        announcement.setContent(content);
        groupAnnouncementRepository.save(announcement);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", announcement.getId());
        result.put("body", announcement.getContent());
        result.put("authorId", member.getUser().getId());
        result.put("author", member.getUser().getName());
        result.put("createdAt", announcement.getCreatedAt());
        return result;
    }

    // ── GET /groups/{id}/announcements ───────────────────────────────────

    public Map<String, Object> getAnnouncements(String groupId, int limit, int offset) {
        List<GroupAnnouncement> announcements = groupAnnouncementRepository
                .findByGroupIdPaginated(groupId, PageRequest.of(offset / Math.max(1, limit), limit));

        List<Map<String, Object>> items = announcements.stream().map(a -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", a.getId());
            item.put("body", a.getContent());
            item.put("authorId", a.getAuthor().getId());
            item.put("author", a.getAuthor().getName());
            item.put("createdAt", a.getCreatedAt());
            return item;
        }).collect(Collectors.toList());

        long total = groupAnnouncementRepository.countByGroupId(groupId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("hasMore", offset + limit < total);
        return result;
    }

    private String generateGroupCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (churchGroupRepository.findByGroupCode(code).isPresent());
        return code;
    }
}
