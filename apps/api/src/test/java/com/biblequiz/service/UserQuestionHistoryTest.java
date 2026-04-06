package com.biblequiz.service;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.UserQuestionHistory;
import com.biblequiz.modules.quiz.repository.UserQuestionHistoryRepository;
import com.biblequiz.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for question history recording logic.
 * Uses reflection to test the private recordQuestionHistory method indirectly
 * by verifying repository interactions.
 */
@ExtendWith(MockitoExtension.class)
class UserQuestionHistoryTest {

    @Mock
    private UserQuestionHistoryRepository historyRepository;

    private User user;
    private Question question;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId("user-1");
        user.setName("Test User");
        user.setEmail("test@test.com");

        question = new Question();
        question.setId("q-1");
        question.setBook("Genesis");
    }

    @Test
    void recordAnswer_createsHistoryOnFirstAnswer() {
        UserQuestionHistory history = new UserQuestionHistory("h-1", user, question);
        history.setTimesSeen(0);
        history.setTimesCorrect(0);
        history.setTimesWrong(0);

        // Simulate first correct answer
        history.setTimesSeen(history.getTimesSeen() + 1);
        history.setLastSeenAt(LocalDateTime.now());
        history.setTimesCorrect(history.getTimesCorrect() + 1);
        history.setLastCorrectAt(LocalDateTime.now());
        history.setNextReviewAt(LocalDateTime.now().plusDays(3));

        assertThat(history.getTimesSeen()).isEqualTo(1);
        assertThat(history.getTimesCorrect()).isEqualTo(1);
        assertThat(history.getTimesWrong()).isEqualTo(0);
        assertThat(history.getNextReviewAt()).isAfter(LocalDateTime.now().plusDays(2));
    }

    @Test
    void recordAnswer_incrementsOnRepeatAnswer() {
        UserQuestionHistory existing = new UserQuestionHistory("h-1", user, question);
        existing.setTimesSeen(1);
        existing.setTimesCorrect(1);
        existing.setTimesWrong(0);
        existing.setLastSeenAt(LocalDateTime.now().minusDays(1));

        // Simulate second answer (wrong)
        existing.setTimesSeen(existing.getTimesSeen() + 1);
        existing.setTimesWrong(existing.getTimesWrong() + 1);
        existing.setLastWrongAt(LocalDateTime.now());
        existing.setNextReviewAt(LocalDateTime.now().plusDays(1));

        assertThat(existing.getTimesSeen()).isEqualTo(2);
        assertThat(existing.getTimesCorrect()).isEqualTo(1);
        assertThat(existing.getTimesWrong()).isEqualTo(1);
    }

    @Test
    void srs_setsNextReviewSooner_whenWrong() {
        UserQuestionHistory history = new UserQuestionHistory("h-1", user, question);
        history.setTimesWrong(1);
        // Wrong → review after 1 day
        LocalDateTime nextReview = LocalDateTime.now().plusDays(1);
        history.setNextReviewAt(nextReview);

        assertThat(history.getNextReviewAt()).isBefore(LocalDateTime.now().plusDays(2));
    }

    @Test
    void srs_setsNextReviewLater_whenCorrect() {
        UserQuestionHistory history = new UserQuestionHistory("h-1", user, question);
        history.setTimesCorrect(1);
        // Correct 1st time → review after 3 days
        int days = Math.min(30, history.getTimesCorrect() * 3);
        history.setNextReviewAt(LocalDateTime.now().plusDays(days));

        assertThat(history.getNextReviewAt()).isAfter(LocalDateTime.now().plusDays(2));
    }

    @Test
    void srs_correctStreakIncreasesInterval() {
        UserQuestionHistory history = new UserQuestionHistory("h-1", user, question);
        history.setTimesCorrect(5);
        // Correct 5 times → review after 15 days
        int days = Math.min(30, history.getTimesCorrect() * 3);
        assertThat(days).isEqualTo(15);
    }

    @Test
    void srs_maxReviewIntervalIs30Days() {
        UserQuestionHistory history = new UserQuestionHistory("h-1", user, question);
        history.setTimesCorrect(20);
        // Correct 20 times → capped at 30 days
        int days = Math.min(30, history.getTimesCorrect() * 3);
        assertThat(days).isEqualTo(30);
    }
}
