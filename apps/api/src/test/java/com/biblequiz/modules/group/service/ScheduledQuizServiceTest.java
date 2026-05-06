package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.entity.ScheduledQuiz;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;
import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import com.biblequiz.modules.group.repository.ScheduledQuizAttemptRepository;
import com.biblequiz.modules.group.repository.ScheduledQuizRepository;
import com.biblequiz.modules.notification.service.NotificationService;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduledQuizServiceTest {

    @Mock private ScheduledQuizRepository quizRepository;
    @Mock private ScheduledQuizAttemptRepository attemptRepository;
    @Mock private GroupQuizSetRepository quizSetRepository;
    @Mock private GroupMemberRepository memberRepository;
    @Mock private ChurchGroupRepository groupRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private ScheduledQuizService service;

    private User testUser;
    private ChurchGroup group;
    private GroupQuizSet quizSet;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Tai");
        testUser.setEmail("test@example.com");

        group = new ChurchGroup();
        group.setId("group-1");

        quizSet = new GroupQuizSet();
        quizSet.setId("qs-1");
        quizSet.setName("Sáng Thế Ký");
        quizSet.setGroup(group);
        quizSet.setQuestionIds(List.of("q1", "q2", "q3"));
    }

    private GroupMember member(GroupMember.GroupRole role) {
        GroupMember m = new GroupMember();
        m.setRole(role);
        return m;
    }

    @Test
    void create_asMember_throws() {
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.MEMBER)));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.create("group-1", "user-1", "qs-1", "Quiz tuần", null,
                        LocalDateTime.now().plusDays(7), 3, true, true));
        assertTrue(ex.getMessage().contains("leader hoac mod"));
    }

    @Test
    void create_atMaxActiveCap_throwsMaxActiveError() {
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));
        when(quizRepository.countByGroupIdAndStatus("group-1", ScheduledQuiz.Status.ACTIVE))
                .thenReturn(3L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.create("group-1", "user-1", "qs-1", "Quiz", null,
                        LocalDateTime.now().plusDays(7), 3, true, true));
        assertEquals(ScheduledQuizService.ERR_MAX_ACTIVE, ex.getMessage());
    }

    @Test
    void create_pastDeadline_throws() {
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));
        when(quizRepository.countByGroupIdAndStatus(any(), any())).thenReturn(0L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.create("group-1", "user-1", "qs-1", "Quiz", null,
                        LocalDateTime.now().minusMinutes(1), 3, true, true));
        assertTrue(ex.getMessage().contains("Han chot"));
    }

    @Test
    void create_happyPath_savesQuizAndNotifies() {
        when(memberRepository.findByGroupIdAndUserId("group-1", "user-1"))
                .thenReturn(Optional.of(member(GroupMember.GroupRole.LEADER)));
        when(quizRepository.countByGroupIdAndStatus("group-1", ScheduledQuiz.Status.ACTIVE))
                .thenReturn(0L);
        when(quizSetRepository.findById("qs-1")).thenReturn(Optional.of(quizSet));
        when(groupRepository.findById("group-1")).thenReturn(Optional.of(group));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(quizRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(memberRepository.findByGroupId("group-1")).thenReturn(List.of());

        var result = service.create("group-1", "user-1", "qs-1", "Quiz tuần", "Mô tả",
                LocalDateTime.now().plusDays(7), 3, true, true);

        assertNotNull(result.get("id"));
        assertEquals("Quiz tuần", result.get("name"));
        assertEquals("ACTIVE", result.get("status"));
        verify(quizRepository).save(any(ScheduledQuiz.class));
    }

    @Test
    void startAttempt_pastDeadline_throws() {
        ScheduledQuiz q = new ScheduledQuiz();
        q.setId("quiz-1");
        q.setStatus(ScheduledQuiz.Status.ACTIVE);
        q.setDeadline(LocalDateTime.now().minusMinutes(1));
        q.setMaxAttempts(3);
        when(quizRepository.findById("quiz-1")).thenReturn(Optional.of(q));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.startAttempt("quiz-1", "user-1"));
        assertTrue(ex.getMessage().contains("han chot") || ex.getMessage().contains("qua han"));
    }

    @Test
    void startAttempt_attemptsExhausted_throws() {
        ScheduledQuiz q = new ScheduledQuiz();
        q.setId("quiz-1");
        q.setStatus(ScheduledQuiz.Status.ACTIVE);
        q.setDeadline(LocalDateTime.now().plusDays(1));
        q.setMaxAttempts(3);
        q.setSnapshotQuestionIds(List.of("q1"));
        when(quizRepository.findById("quiz-1")).thenReturn(Optional.of(q));
        when(attemptRepository.countByScheduledQuizIdAndUserId("quiz-1", "user-1")).thenReturn(3L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.startAttempt("quiz-1", "user-1"));
        assertTrue(ex.getMessage().contains("het luot"));
    }
}
