package com.biblequiz.service;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;
import com.biblequiz.modules.group.repository.GroupAnnouncementRepository;
import com.biblequiz.modules.group.repository.GroupKickLogRepository;
import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import com.biblequiz.modules.group.repository.GroupReportRepository;
import com.biblequiz.modules.group.entity.GroupAnnouncement;
import com.biblequiz.modules.group.entity.GroupKickLog;
import com.biblequiz.modules.group.entity.GroupReport;
import com.biblequiz.modules.group.service.ChurchGroupService;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.notification.service.NotificationService;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChurchGroupServiceTest {

    @Mock
    private ChurchGroupRepository churchGroupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private GroupAnnouncementRepository groupAnnouncementRepository;

    @Mock
    private GroupQuizSetRepository groupQuizSetRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserDailyProgressRepository udpRepository;

    @Mock
    private GroupKickLogRepository groupKickLogRepository;

    @Mock
    private GroupReportRepository groupReportRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ChurchGroupService churchGroupService;

    private User leaderUser;
    private User memberUser;
    private ChurchGroup testGroup;

    @BeforeEach
    void setUp() {
        leaderUser = new User();
        leaderUser.setId("leader-1");
        leaderUser.setName("Leader");
        leaderUser.setEmail("leader@example.com");

        memberUser = new User();
        memberUser.setId("member-1");
        memberUser.setName("Member");
        memberUser.setEmail("member@example.com");

        testGroup = new ChurchGroup();
        testGroup.setId("group-1");
        testGroup.setName("Test Group");
        testGroup.setGroupCode("ABC123");
        testGroup.setLeader(leaderUser);
        testGroup.setMemberCount(1);
        testGroup.setMaxMembers(200);
    }

    // ── BL-24: announcement → notify members ─────────────────────────────────

    private GroupMember mem(GroupMember.GroupRole role, User u) {
        GroupMember m = new GroupMember();
        m.setRole(role);
        m.setUser(u);
        return m;
    }

    @Test
    void createAnnouncement_asLeader_notifiesEveryMemberExceptAuthor() {
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(mem(GroupMember.GroupRole.LEADER, leaderUser)));
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(groupMemberRepository.findByGroupId("group-1"))
                .thenReturn(List.of(mem(GroupMember.GroupRole.LEADER, leaderUser),
                                    mem(GroupMember.GroupRole.MEMBER, memberUser)));

        churchGroupService.createAnnouncement("group-1", "leader-1", "Họp lúc 7h tối nay");

        verify(notificationService).createNotification(eq(memberUser), eq("group_announcement"),
                anyString(), anyString(), anyString());
        verify(notificationService, never()).createNotification(eq(leaderUser),
                anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void createAnnouncement_notificationFailure_stillCreatesAnnouncement() {
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(mem(GroupMember.GroupRole.LEADER, leaderUser)));
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(groupMemberRepository.findByGroupId("group-1"))
                .thenReturn(List.of(mem(GroupMember.GroupRole.MEMBER, memberUser)));
        when(notificationService.createNotification(any(), anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("noti down"));

        Map<String, Object> result = churchGroupService.createAnnouncement("group-1", "leader-1", "Test");

        assertNotNull(result.get("id"));
        verify(groupAnnouncementRepository).save(any(GroupAnnouncement.class));
    }

    // ── createGroup (TC-GROUP-001) ───────────────────────────────────────────

    @Test
    void createGroup_shouldCreateGroupAndLeaderMember() {
        when(churchGroupRepository.findByGroupCode(anyString())).thenReturn(Optional.empty());
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.createGroup("My Group", "A description", leaderUser);

        assertNotNull(result.get("id"));
        assertEquals("My Group", result.get("name"));
        assertNotNull(result.get("code"));
        assertEquals(1, result.get("memberCount"));
        verify(churchGroupRepository).save(any(ChurchGroup.class));
        verify(groupMemberRepository).save(argThat(member ->
                member.getRole() == GroupMember.GroupRole.LEADER));
    }

    // ── joinGroup (TC-GROUP-002) ─────────────────────────────────────────────

    @Test
    void joinGroup_shouldCreateMember() {
        when(churchGroupRepository.findByGroupCode("ABC123")).thenReturn(Optional.of(testGroup));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1")).thenReturn(Optional.empty());
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.joinGroup("ABC123", memberUser);

        assertEquals("group-1", result.get("groupId"));
        assertEquals("MEMBER", result.get("role"));
        verify(groupMemberRepository).save(argThat(member ->
                member.getRole() == GroupMember.GroupRole.MEMBER));
        verify(churchGroupRepository).save(argThat(group ->
                group.getMemberCount() == 2));
    }

    // ── joinGroup full (TC-GROUP-006) ────────────────────────────────────────

    @Test
    void joinGroup_fullGroup_shouldThrow() {
        testGroup.setMemberCount(200);
        testGroup.setMaxMembers(200);
        when(churchGroupRepository.findByGroupCode("ABC123")).thenReturn(Optional.of(testGroup));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.joinGroup("ABC123", memberUser));

        assertEquals("Nhom da day", ex.getMessage());
        verify(groupMemberRepository, never()).save(any());
    }

    @Test
    void joinGroup_alreadyMember_shouldThrow() {
        GroupMember existingMember = new GroupMember();
        existingMember.setId("gm-1");
        existingMember.setGroup(testGroup);
        existingMember.setUser(memberUser);

        when(churchGroupRepository.findByGroupCode("ABC123")).thenReturn(Optional.of(testGroup));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(existingMember));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.joinGroup("ABC123", memberUser));

        assertEquals("Ban da la thanh vien cua nhom nay", ex.getMessage());
    }

    // ── leaveGroup (TC-GROUP-008) ────────────────────────────────────────────

    @Test
    void leaveGroup_normalMember_shouldSucceed() {
        GroupMember member = new GroupMember();
        member.setId("gm-1");
        member.setGroup(testGroup);
        member.setUser(memberUser);
        member.setRole(GroupMember.GroupRole.MEMBER);

        testGroup.setMemberCount(2);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(member));
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.leaveGroup("group-1", memberUser);

        assertEquals(true, result.get("success"));
        verify(groupMemberRepository).delete(member);
        verify(churchGroupRepository).save(argThat(group -> group.getMemberCount() == 1));
    }

    // ── leaveGroup leader (TC-GROUP-009) ─────────────────────────────────────

    @Test
    void leaveGroup_leader_shouldThrowLeaderCannotLeave() {
        GroupMember leaderMember = new GroupMember();
        leaderMember.setId("gm-leader");
        leaderMember.setGroup(testGroup);
        leaderMember.setUser(leaderUser);
        leaderMember.setRole(GroupMember.GroupRole.LEADER);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(leaderMember));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.leaveGroup("group-1", leaderUser));

        assertEquals("LEADER_CANNOT_LEAVE", ex.getMessage());
        verify(groupMemberRepository, never()).delete(any());
    }

    // ── getAnalytics non-leader (TC-GROUP-005) ──────────────────────────────

    @Test
    void getAnalytics_nonLeader_shouldThrow() {
        GroupMember regularMember = new GroupMember();
        regularMember.setId("gm-1");
        regularMember.setGroup(testGroup);
        regularMember.setUser(memberUser);
        regularMember.setRole(GroupMember.GroupRole.MEMBER);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(regularMember));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.getAnalytics("group-1", "member-1"));

        assertEquals("Khong co quyen truy cap", ex.getMessage());
    }

    // ── createQuizSet leader (TC-GROUP-007) ──────────────────────────────────

    @Test
    void createQuizSet_leader_shouldSucceed() {
        GroupMember leaderMember = new GroupMember();
        leaderMember.setId("gm-leader");
        leaderMember.setGroup(testGroup);
        leaderMember.setUser(leaderUser);
        leaderMember.setRole(GroupMember.GroupRole.LEADER);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(leaderMember));
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(groupQuizSetRepository.save(any(GroupQuizSet.class))).thenAnswer(inv -> inv.getArgument(0));

        List<String> questionIds = List.of("q-1", "q-2", "q-3");
        Map<String, Object> result = churchGroupService.createQuizSet("group-1", "leader-1", "Quiz 1", questionIds);

        assertNotNull(result.get("id"));
        assertEquals("Quiz 1", result.get("name"));
        assertEquals(questionIds, result.get("questionIds"));
        verify(groupQuizSetRepository).save(any(GroupQuizSet.class));
    }

    @Test
    void createQuizSet_regularMember_shouldThrow() {
        GroupMember regularMember = new GroupMember();
        regularMember.setId("gm-1");
        regularMember.setGroup(testGroup);
        regularMember.setUser(memberUser);
        regularMember.setRole(GroupMember.GroupRole.MEMBER);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(regularMember));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.createQuizSet("group-1", "member-1", "Quiz 1", List.of("q-1")));

        assertEquals("Khong co quyen tao quiz set", ex.getMessage());
        verify(groupQuizSetRepository, never()).save(any());
    }

    // ── updateGroup ───────────────────────────────────────────────────────

    @Test
    void updateGroup_leaderCanUpdate() {
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.updateGroup("group-1", "leader-1",
                "New Name", "New Desc", true, 100);

        assertEquals("New Name", result.get("name"));
        assertEquals("New Desc", result.get("description"));
        assertEquals(true, result.get("isPublic"));
        assertEquals(100, result.get("maxMembers"));
    }

    @Test
    void updateGroup_nonLeader_shouldThrow() {
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));

        assertThrows(RuntimeException.class,
                () -> churchGroupService.updateGroup("group-1", "member-1", "X", null, null, null));
    }

    @Test
    void updateGroup_maxMembersBelowCurrent_shouldThrow() {
        testGroup.setMemberCount(10);
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.updateGroup("group-1", "leader-1", null, null, null, 5));

        assertTrue(ex.getMessage().contains("khong the nho hon"));
    }

    // ── deleteGroup ───────────────────────────────────────────────────────

    @Test
    void deleteGroup_leaderCanDelete() {
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.deleteGroup("group-1", "leader-1");

        assertEquals(true, result.get("success"));
        verify(groupMemberRepository).deleteByGroupId("group-1");
        verify(churchGroupRepository, atLeast(1)).save(argThat(g -> g.getDeletedAt() != null));
    }

    @Test
    void deleteGroup_nonLeader_shouldThrow() {
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));

        assertThrows(RuntimeException.class,
                () -> churchGroupService.deleteGroup("group-1", "member-1"));
    }

    // ── kickMember ────────────────────────────────────────────────────────

    @Test
    void kickMember_leaderCanKickMember() {
        GroupMember leaderMember = new GroupMember();
        leaderMember.setRole(GroupMember.GroupRole.LEADER);
        leaderMember.setUser(leaderUser);

        GroupMember targetMember = new GroupMember();
        targetMember.setRole(GroupMember.GroupRole.MEMBER);
        targetMember.setUser(memberUser);

        testGroup.setMemberCount(2);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(leaderMember));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(targetMember));
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.kickMember("group-1", "leader-1", "member-1");

        assertEquals(true, result.get("success"));
        verify(groupMemberRepository).delete(targetMember);
    }

    @Test
    void kickMember_cannotKickSelf() {
        assertThrows(RuntimeException.class,
                () -> churchGroupService.kickMember("group-1", "leader-1", "leader-1"));
    }

    @Test
    void kickMember_cannotKickLeader() {
        GroupMember modMember = new GroupMember();
        modMember.setRole(GroupMember.GroupRole.MOD);
        modMember.setUser(memberUser);

        GroupMember leaderMember = new GroupMember();
        leaderMember.setRole(GroupMember.GroupRole.LEADER);
        leaderMember.setUser(leaderUser);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(modMember));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(leaderMember));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.kickMember("group-1", "member-1", "leader-1"));

        assertEquals("Khong the kick leader", ex.getMessage());
    }

    @Test
    void kickMember_regularMember_shouldThrow() {
        GroupMember regularMember = new GroupMember();
        regularMember.setRole(GroupMember.GroupRole.MEMBER);
        regularMember.setUser(memberUser);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(regularMember));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.kickMember("group-1", "member-1", "other-user"));

        assertEquals("Chi leader hoac mod moi duoc kick", ex.getMessage());
    }

    // ── createAnnouncement ────────────────────────────────────────────────

    @Test
    void createAnnouncement_leaderCanCreate() {
        GroupMember leaderMember = new GroupMember();
        leaderMember.setRole(GroupMember.GroupRole.LEADER);
        leaderMember.setUser(leaderUser);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(leaderMember));
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(groupAnnouncementRepository.save(any(GroupAnnouncement.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.createAnnouncement("group-1", "leader-1", "Hello group!");

        assertEquals("Hello group!", result.get("body"));
        assertNotNull(result.get("id"));
        verify(groupAnnouncementRepository).save(any(GroupAnnouncement.class));
    }

    @Test
    void createAnnouncement_tooLong_shouldThrow() {
        String longContent = "x".repeat(501);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.createAnnouncement("group-1", "leader-1", longContent));

        assertTrue(ex.getMessage().contains("500"));
    }

    @Test
    void createAnnouncement_regularMember_shouldThrow() {
        GroupMember regularMember = new GroupMember();
        regularMember.setRole(GroupMember.GroupRole.MEMBER);
        regularMember.setUser(memberUser);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(regularMember));

        assertThrows(RuntimeException.class,
                () -> churchGroupService.createAnnouncement("group-1", "member-1", "Test"));
    }

    // ── getAnnouncements ──────────────────────────────────────────────────

    @Test
    void getAnnouncements_shouldReturnPaginatedResults() {
        GroupAnnouncement a1 = new GroupAnnouncement();
        a1.setId("ann-1");
        a1.setContent("First");
        a1.setAuthor(leaderUser);

        when(groupAnnouncementRepository.findByGroupIdPaginated(eq("group-1"), any()))
                .thenReturn(List.of(a1));
        when(groupAnnouncementRepository.countByGroupId("group-1")).thenReturn(1L);

        Map<String, Object> result = churchGroupService.getAnnouncements("group-1", 20, 0);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        assertEquals(1, items.size());
        assertEquals("First", items.get(0).get("body"));
        assertEquals(1L, result.get("total"));
        assertEquals(false, result.get("hasMore"));
    }

    // ── listMyGroupsWithSummary (multi-group /groups page) ───────────────────

    @Test
    void listMyGroupsWithSummary_emptyMemberships_returnsEmptyList() {
        when(groupMemberRepository.findByUserId("nobody")).thenReturn(java.util.Collections.emptyList());

        List<Map<String, Object>> result = churchGroupService.listMyGroupsWithSummary("nobody");

        assertTrue(result.isEmpty());
    }

    @Test
    void listMyGroupsWithSummary_returnsSummaryWithMyRank() {
        // Two members in group; current user is member-1 (regular member)
        GroupMember leaderSeat = new GroupMember();
        leaderSeat.setRole(GroupMember.GroupRole.LEADER);
        leaderSeat.setUser(leaderUser);
        leaderSeat.setGroup(testGroup);

        GroupMember mySeat = new GroupMember();
        mySeat.setRole(GroupMember.GroupRole.MEMBER);
        mySeat.setUser(memberUser);
        mySeat.setGroup(testGroup);

        when(groupMemberRepository.findByUserId("member-1")).thenReturn(java.util.List.of(mySeat));
        when(groupMemberRepository.findByGroupId("group-1")).thenReturn(java.util.List.of(leaderSeat, mySeat));

        // Leader: 100 pts, 10 questions; Me: 50 pts, 5 questions → leader ranks ahead → my rank = 2
        com.biblequiz.modules.quiz.entity.UserDailyProgress leaderUdp = new com.biblequiz.modules.quiz.entity.UserDailyProgress();
        leaderUdp.setPointsCounted(100);
        leaderUdp.setQuestionsCounted(10);
        com.biblequiz.modules.quiz.entity.UserDailyProgress myUdp = new com.biblequiz.modules.quiz.entity.UserDailyProgress();
        myUdp.setPointsCounted(50);
        myUdp.setQuestionsCounted(5);
        when(udpRepository.findByUserIdAndDateBetween(eq("leader-1"), any(), any()))
                .thenReturn(java.util.List.of(leaderUdp));
        when(udpRepository.findByUserIdAndDateBetween(eq("member-1"), any(), any()))
                .thenReturn(java.util.List.of(myUdp));

        List<Map<String, Object>> result = churchGroupService.listMyGroupsWithSummary("member-1");

        assertEquals(1, result.size());
        Map<String, Object> entry = result.get(0);
        assertEquals("group-1", entry.get("id"));
        assertEquals("MEMBER", entry.get("role"));
        assertEquals(2, entry.get("memberCount"));
        // 150 total points / 2 active = 75
        assertEquals(75, entry.get("avgScore"));
        // 150 / (15 * 10) = 100% (capped)
        assertEquals(100, entry.get("accuracy"));
        assertEquals(2, entry.get("activeWeek"));
        assertEquals(50, entry.get("myWeekPoints"));
        // leader has 100 > my 50 → 1 ahead → rank 2
        assertEquals(2, entry.get("myRank"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SPEC v1.1 §15.2 implementation gaps — coverage for GAP-E/F/L/M
    // ═══════════════════════════════════════════════════════════════════════

    // ── GAP-E: createGroup max 2 owned (SPEC §4.2) ───────────────────────────

    @Test
    void createGroup_userAlreadyOwns2_shouldThrowMaxGroupsOwned() {
        when(churchGroupRepository.countActiveByLeaderId("leader-1")).thenReturn(2L);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.createGroup("Third Group", "desc", leaderUser));

        assertEquals("MAX_GROUPS_OWNED", ex.getMessage());
        verify(churchGroupRepository, never()).save(any(ChurchGroup.class));
    }

    @Test
    void createGroup_userOwns1_shouldSucceed() {
        when(churchGroupRepository.countActiveByLeaderId("leader-1")).thenReturn(1L);
        when(churchGroupRepository.findByGroupCode(anyString())).thenReturn(Optional.empty());
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.createGroup("Second Group", "desc", leaderUser);

        assertEquals("Second Group", result.get("name"));
        verify(churchGroupRepository).save(any(ChurchGroup.class));
    }

    // ── GAP-F: joinGroup max 5 joined (SPEC §4.3) ────────────────────────────

    @Test
    void joinGroup_userAlreadyIn5Groups_shouldThrowMaxGroupsJoined() {
        when(churchGroupRepository.findByGroupCode("ABC123")).thenReturn(Optional.of(testGroup));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1")).thenReturn(Optional.empty());
        when(groupMemberRepository.countByUserId("member-1")).thenReturn(5L);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.joinGroup("ABC123", memberUser));

        assertEquals("MAX_GROUPS_JOINED", ex.getMessage());
        verify(groupMemberRepository, never()).save(any());
    }

    @Test
    void joinGroup_userIn4Groups_shouldSucceed() {
        when(churchGroupRepository.findByGroupCode("ABC123")).thenReturn(Optional.of(testGroup));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1")).thenReturn(Optional.empty());
        when(groupMemberRepository.countByUserId("member-1")).thenReturn(4L);
        when(groupKickLogRepository.existsRecentKick(eq("group-1"), eq("member-1"), any(LocalDateTime.class)))
                .thenReturn(false);
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.joinGroup("ABC123", memberUser);

        assertEquals("group-1", result.get("groupId"));
    }

    // ── GAP-L: joinGroup kick cooldown (SPEC §12.2) ──────────────────────────

    @Test
    void joinGroup_recentlyKicked_shouldThrowCooldown() {
        when(churchGroupRepository.findByGroupCode("ABC123")).thenReturn(Optional.of(testGroup));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1")).thenReturn(Optional.empty());
        when(groupMemberRepository.countByUserId("member-1")).thenReturn(0L);
        when(groupKickLogRepository.existsRecentKick(eq("group-1"), eq("member-1"), any(LocalDateTime.class)))
                .thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.joinGroup("ABC123", memberUser));

        assertEquals("KICK_COOLDOWN_ACTIVE", ex.getMessage());
        verify(groupMemberRepository, never()).save(any());
    }

    @Test
    void joinGroup_kickedLongAgo_shouldSucceed() {
        when(churchGroupRepository.findByGroupCode("ABC123")).thenReturn(Optional.of(testGroup));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1")).thenReturn(Optional.empty());
        when(groupMemberRepository.countByUserId("member-1")).thenReturn(0L);
        // Cooldown expired (no recent kick within last 7 days)
        when(groupKickLogRepository.existsRecentKick(eq("group-1"), eq("member-1"), any(LocalDateTime.class)))
                .thenReturn(false);
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));
        when(churchGroupRepository.save(any(ChurchGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = churchGroupService.joinGroup("ABC123", memberUser);

        assertEquals("group-1", result.get("groupId"));
    }

    // ── GAP-L: kickMember writes audit log (SPEC §12.2) ──────────────────────

    @Test
    void kickMember_writesKickLogBeforeDelete() {
        GroupMember leaderM = new GroupMember();
        leaderM.setRole(GroupMember.GroupRole.LEADER);
        leaderM.setUser(leaderUser);
        GroupMember targetM = new GroupMember();
        targetM.setId("gm-target");
        targetM.setRole(GroupMember.GroupRole.MEMBER);
        targetM.setUser(memberUser);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(leaderM));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(targetM));
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));

        Map<String, Object> result = churchGroupService.kickMember(
                "group-1", "leader-1", "member-1", "spam");

        assertEquals(true, result.get("success"));
        verify(groupKickLogRepository).save(argThat(log ->
                log.getGroup() == testGroup
                && log.getKickedUser() == memberUser
                && log.getKickedBy() == leaderUser
                && "spam".equals(log.getReason())));
        verify(groupMemberRepository).delete(targetM);
    }

    @Test
    void kickMember_longReason_isTruncated() {
        GroupMember leaderM = new GroupMember();
        leaderM.setRole(GroupMember.GroupRole.LEADER);
        leaderM.setUser(leaderUser);
        GroupMember targetM = new GroupMember();
        targetM.setId("gm-target");
        targetM.setRole(GroupMember.GroupRole.MEMBER);
        targetM.setUser(memberUser);

        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "leader-1"))
                .thenReturn(Optional.of(leaderM));
        when(groupMemberRepository.findByGroupIdAndUserId("group-1", "member-1"))
                .thenReturn(Optional.of(targetM));
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));

        String longReason = "x".repeat(700);
        churchGroupService.kickMember("group-1", "leader-1", "member-1", longReason);

        verify(groupKickLogRepository).save(argThat(log -> log.getReason().length() == 500));
    }

    // ── GAP-M: reportGroup (SPEC §12.4 + §13.9) ──────────────────────────────

    @Test
    void reportGroup_validReason_createsReport() {
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(groupReportRepository.existsByGroupIdAndReporterIdAndStatus(
                "group-1", "member-1", GroupReport.Status.OPEN)).thenReturn(false);

        Map<String, Object> result = churchGroupService.reportGroup(
                "group-1", memberUser, "spam", "Posting irrelevant content");

        assertNotNull(result.get("id"));
        assertEquals("OPEN", result.get("status"));
        verify(groupReportRepository).save(argThat(r ->
                r.getReason() == GroupReport.Reason.SPAM
                && r.getReporter() == memberUser
                && r.getStatus() == GroupReport.Status.OPEN
                && "Posting irrelevant content".equals(r.getNote())));
    }

    @Test
    void reportGroup_invalidReason_throws() {
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.reportGroup("group-1", memberUser, "FAKE_REASON", null));

        assertEquals("INVALID_REASON", ex.getMessage());
        verify(groupReportRepository, never()).save(any());
    }

    @Test
    void reportGroup_existingOpenReport_throwsAlreadyReported() {
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(groupReportRepository.existsByGroupIdAndReporterIdAndStatus(
                "group-1", "member-1", GroupReport.Status.OPEN)).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> churchGroupService.reportGroup("group-1", memberUser, "harassment", "abuse"));

        assertEquals("ALREADY_REPORTED", ex.getMessage());
        verify(groupReportRepository, never()).save(any());
    }

    @Test
    void reportGroup_longNote_isTruncated() {
        when(churchGroupRepository.findById("group-1")).thenReturn(Optional.of(testGroup));
        when(groupReportRepository.existsByGroupIdAndReporterIdAndStatus(
                "group-1", "member-1", GroupReport.Status.OPEN)).thenReturn(false);

        String longNote = "x".repeat(1500);
        churchGroupService.reportGroup("group-1", memberUser, "other", longNote);

        verify(groupReportRepository).save(argThat(r -> r.getNote().length() == 1000));
    }
}
