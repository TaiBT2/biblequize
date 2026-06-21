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
class GroupJourneyServiceTest {

    @Mock private GroupJourneyRepository journeyRepository;
    @Mock private GroupJourneyWeekRepository weekRepository;
    @Mock private GroupMemberRepository memberRepository;
    @Mock private GroupQuizSetRepository quizSetRepository;
    @Mock private ChurchGroupRepository groupRepository;
    @Mock private UserRepository userRepository;
    @Mock private ScheduledQuizRepository scheduledQuizRepository;
    @Mock private ScheduledQuizAttemptRepository attemptRepository;
    @Mock private ScheduledQuizService scheduledQuizService;

    @InjectMocks private GroupJourneyService service;

    private User leader;
    private ChurchGroup group;
    private GroupQuizSet quizSet;

    @BeforeEach
    void setUp() {
        leader = new User();
        leader.setId("user-1");
        leader.setName("Tai");

        group = new ChurchGroup();
        group.setId("group-1");

        quizSet = new GroupQuizSet();
        quizSet.setId("qs-1");
        quizSet.setName("Sáng Thế Ký");
        quizSet.setGroup(group);
    }

    private GroupMember member(GroupMember.GroupRole role) {
        GroupMember m = new GroupMember();
        m.setRole(role);
        m.setUser(leader);
        return m;
    }

    private GroupJourney journey(GroupJourney.Status status) {
        GroupJourney j = new GroupJourney();
        j.setId("journey-1");
        j.setGroup(group);
        j.setTitle("Hành trình Sáng Thế");
        j.setStatus(status);
        j.setCreatedBy(leader);
        return j;
    }

    @Test
    void createJourney_asMember_throws() {
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.MEMBER)));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.createJourney("group-1", "user-1", "Hành trình", null));
        assertTrue(ex.getMessage().contains("leader hoac mod"));
    }

    @Test
    void createJourney_happyPath_savesDraft() {
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));
        when(groupRepository.findById("group-1")).thenReturn(Optional.of(group));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(leader));
        when(journeyRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = service.createJourney("group-1", "user-1", "Hành trình", "mô tả");

        assertNotNull(result.get("id"));
        assertEquals("DRAFT", result.get("status"));
        assertEquals("Hành trình", result.get("title"));
        verify(journeyRepository).save(any(GroupJourney.class));
    }

    @Test
    void addWeek_quizSetFromOtherGroup_throws() {
        ChurchGroup other = new ChurchGroup();
        other.setId("group-2");
        quizSet.setGroup(other);
        when(journeyRepository.findById("journey-1")).thenReturn(Optional.of(journey(GroupJourney.Status.DRAFT)));
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));
        when(quizSetRepository.findById("qs-1")).thenReturn(Optional.of(quizSet));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.addWeek("journey-1", "user-1", "Chương 1", "qs-1"));
        assertTrue(ex.getMessage().contains("khong thuoc nhom"));
    }

    @Test
    void addWeek_happyPath_numbersSequentially() {
        when(journeyRepository.findById("journey-1")).thenReturn(Optional.of(journey(GroupJourney.Status.DRAFT)));
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));
        when(quizSetRepository.findById("qs-1")).thenReturn(Optional.of(quizSet));
        when(weekRepository.countByJourneyId("journey-1")).thenReturn(2L);
        when(weekRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = service.addWeek("journey-1", "user-1", "Chương 3", "qs-1");

        assertEquals(3, result.get("weekNumber"));
        assertEquals("LOCKED", result.get("status"));
    }

    @Test
    void startJourney_noWeeks_throws() {
        when(journeyRepository.findById("journey-1")).thenReturn(Optional.of(journey(GroupJourney.Status.DRAFT)));
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));
        when(weekRepository.countByJourneyId("journey-1")).thenReturn(0L);

        assertThrows(IllegalStateException.class, () -> service.startJourney("journey-1", "user-1"));
    }

    @Test
    void openNextWeek_journeyNotActive_throws() {
        when(journeyRepository.findById("journey-1")).thenReturn(Optional.of(journey(GroupJourney.Status.DRAFT)));
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));

        assertThrows(IllegalStateException.class, () ->
                service.openNextWeek("journey-1", "user-1", LocalDateTime.now().plusDays(7)));
    }

    @Test
    void openNextWeek_delegatesToScheduledQuizAndPinsId() {
        GroupJourneyWeek week = new GroupJourneyWeek();
        week.setId("week-1");
        week.setWeekNumber(1);
        week.setTitle("Chương 1");
        week.setQuizSetId("qs-1");
        week.setStatus(GroupJourneyWeek.Status.LOCKED);
        week.setJourney(journey(GroupJourney.Status.ACTIVE));

        when(journeyRepository.findById("journey-1")).thenReturn(Optional.of(journey(GroupJourney.Status.ACTIVE)));
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));
        when(weekRepository.findByJourneyIdOrderByWeekNumberAsc("journey-1")).thenReturn(List.of(week));
        when(scheduledQuizService.create(eq("group-1"), eq("user-1"), eq("qs-1"), eq("Chương 1"),
                any(), any(), isNull(), eq(true), eq(true)))
                .thenReturn(Map.of("id", "sq-99", "deadline", "2026-06-30T00:00"));
        when(weekRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = service.openNextWeek("journey-1", "user-1",
                LocalDateTime.now().plusDays(7));

        assertEquals("sq-99", result.get("scheduledQuizId"));
        assertEquals("OPEN", result.get("status"));
        verify(scheduledQuizService).create(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void getJourneyWithProgress_aggregatesDoneFromAttempts() {
        GroupJourneyWeek week = new GroupJourneyWeek();
        week.setId("week-1");
        week.setWeekNumber(1);
        week.setTitle("Chương 1");
        week.setQuizSetId("qs-1");
        week.setScheduledQuizId("sq-1");
        week.setStatus(GroupJourneyWeek.Status.OPEN);
        week.setJourney(journey(GroupJourney.Status.ACTIVE));

        ScheduledQuiz sq = new ScheduledQuiz();
        sq.setId("sq-1");
        sq.setStatus(ScheduledQuiz.Status.ACTIVE);
        sq.setDeadline(LocalDateTime.now().plusDays(3));

        when(journeyRepository.findById("journey-1")).thenReturn(Optional.of(journey(GroupJourney.Status.ACTIVE)));
        when(weekRepository.findByJourneyIdOrderByWeekNumberAsc("journey-1")).thenReturn(List.of(week));
        when(memberRepository.findByGroupId("group-1")).thenReturn(List.of(member(GroupMember.GroupRole.LEADER)));
        when(scheduledQuizRepository.findById("sq-1")).thenReturn(Optional.of(sq));
        ScheduledQuizAttempt attempt = new ScheduledQuizAttempt();
        attempt.setUser(leader);
        when(attemptRepository.findByScheduledQuizId("sq-1")).thenReturn(List.of(attempt));

        Map<String, Object> result = service.getJourneyWithProgress("journey-1", "user-1");

        assertEquals(1, result.get("weeksOpened"));
        assertEquals(1, result.get("viewerDoneCount"));
        assertEquals(true, result.get("viewerIsLeader"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> weeks = (List<Map<String, Object>>) result.get("weeks");
        assertEquals(1, weeks.get(0).get("doneCount"));
        assertEquals(true, weeks.get(0).get("viewerDone"));
    }
}
