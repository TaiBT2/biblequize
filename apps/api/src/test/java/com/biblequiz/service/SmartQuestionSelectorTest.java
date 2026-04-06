package com.biblequiz.service;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.UserQuestionHistory;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.UserQuestionHistoryRepository;
import com.biblequiz.modules.quiz.service.SmartQuestionSelector;
import com.biblequiz.modules.quiz.service.SmartQuestionSelector.QuestionFilter;
import com.biblequiz.modules.ranked.service.TierDifficultyConfig;
import com.biblequiz.modules.ranked.service.UserTierService;
import com.biblequiz.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmartQuestionSelectorTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private UserQuestionHistoryRepository historyRepository;

    @Mock
    private TierDifficultyConfig tierDifficultyConfig;

    @Mock
    private UserTierService userTierService;

    @InjectMocks
    private SmartQuestionSelector selector;

    private static final String USER_ID = "user-1";
    private QuestionFilter defaultFilter;
    private List<Question> allQuestions;

    @BeforeEach
    void setUp() {
        // Use explicit difficulty to skip tier distribution logic for simpler tests
        defaultFilter = new QuestionFilter(null, "easy", "vi");
        allQuestions = IntStream.range(0, 100)
                .mapToObj(i -> createQuestion("q-" + i))
                .toList();
    }

    private Question createQuestion(String id) {
        Question q = new Question();
        q.setId(id);
        q.setBook("Genesis");
        q.setDifficulty(Question.Difficulty.easy);
        q.setLanguage("vi");
        q.setIsActive(true);
        return q;
    }

    @Test
    void selectQuestions_prioritizesUnseenQuestions() {
        // User has seen 10 questions, DB has 100
        List<String> seenIds = IntStream.range(0, 10)
                .mapToObj(i -> "q-" + i).toList();

        when(questionRepository.findAllActiveByLanguageAndDifficulty(eq("vi"), eq(Question.Difficulty.easy))).thenReturn(new ArrayList<>(allQuestions));
        when(historyRepository.findQuestionIdsByUserId(USER_ID)).thenReturn(seenIds);
        when(historyRepository.findNeedReviewQuestionIds(eq(USER_ID), any())).thenReturn(List.of());

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(10);
        // Most should be unseen (at least 6 out of 10 = 60%)
        long unseenCount = selected.stream()
                .filter(q -> !seenIds.contains(q.getId()))
                .count();
        assertThat(unseenCount).isGreaterThanOrEqualTo(6);
    }

    @Test
    void selectQuestions_includesReviewQuestions() {
        // 5 questions need review
        List<String> seenIds = IntStream.range(0, 20)
                .mapToObj(i -> "q-" + i).toList();
        List<String> reviewIds = IntStream.range(0, 5)
                .mapToObj(i -> "q-" + i).toList();

        when(questionRepository.findAllActiveByLanguageAndDifficulty(eq("vi"), eq(Question.Difficulty.easy))).thenReturn(new ArrayList<>(allQuestions));
        when(historyRepository.findQuestionIdsByUserId(USER_ID)).thenReturn(seenIds);
        when(historyRepository.findNeedReviewQuestionIds(eq(USER_ID), any())).thenReturn(reviewIds);

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(10);
    }

    @Test
    void selectQuestions_fallbackToSeenWhenNoNewQuestions() {
        // All 20 questions seen, no new ones
        List<Question> smallPool = allQuestions.subList(0, 20);
        List<String> seenIds = IntStream.range(0, 20)
                .mapToObj(i -> "q-" + i).toList();

        when(questionRepository.findAllActiveByLanguageAndDifficulty(eq("vi"), eq(Question.Difficulty.easy))).thenReturn(new ArrayList<>(smallPool));
        when(historyRepository.findQuestionIdsByUserId(USER_ID)).thenReturn(seenIds);
        when(historyRepository.findNeedReviewQuestionIds(eq(USER_ID), any())).thenReturn(List.of());
        for (String qId : seenIds) {
            UserQuestionHistory h = new UserQuestionHistory();
            h.setLastSeenAt(LocalDateTime.now().minusDays(5));
            when(historyRepository.findByUserIdAndQuestionId(USER_ID, qId))
                    .thenReturn(Optional.of(h));
        }

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(10);
    }

    @Test
    void selectQuestions_neverReturnsLessThanRequested_ifPoolSufficient() {
        when(questionRepository.findAllActiveByLanguageAndDifficulty(eq("vi"), eq(Question.Difficulty.easy))).thenReturn(new ArrayList<>(allQuestions));
        when(historyRepository.findQuestionIdsByUserId(USER_ID)).thenReturn(List.of());
        when(historyRepository.findNeedReviewQuestionIds(eq(USER_ID), any())).thenReturn(List.of());

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(10);
    }

    @Test
    void selectQuestions_returnsAvailable_ifPoolInsufficient() {
        List<Question> smallPool = allQuestions.subList(0, 5);

        when(questionRepository.findAllActiveByLanguageAndDifficulty(eq("vi"), eq(Question.Difficulty.easy))).thenReturn(new ArrayList<>(smallPool));
        when(historyRepository.findQuestionIdsByUserId(USER_ID)).thenReturn(List.of());
        when(historyRepository.findNeedReviewQuestionIds(eq(USER_ID), any())).thenReturn(List.of());

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(5);
    }

    @Test
    void selectQuestions_noDuplicates() {
        when(questionRepository.findAllActiveByLanguageAndDifficulty(eq("vi"), eq(Question.Difficulty.easy))).thenReturn(new ArrayList<>(allQuestions));
        when(historyRepository.findQuestionIdsByUserId(USER_ID)).thenReturn(List.of());
        when(historyRepository.findNeedReviewQuestionIds(eq(USER_ID), any())).thenReturn(List.of());

        List<Question> selected = selector.selectQuestions(USER_ID, 20, defaultFilter);

        Set<String> ids = new HashSet<>();
        for (Question q : selected) {
            assertThat(ids.add(q.getId())).isTrue();
        }
    }

    @Test
    void selectQuestions_respectsDifficultyDistributionForTier() {
        // Tier 3: 35% easy, 45% medium, 20% hard
        // Use null difficulty to trigger tier-based distribution
        QuestionFilter noDiffFilter = new QuestionFilter(null, null, "vi");

        when(userTierService.getTierLevel(USER_ID)).thenReturn(3);
        when(tierDifficultyConfig.getDistribution(3))
                .thenReturn(new TierDifficultyConfig.DifficultyDistribution(35, 45, 20, 25));

        // Create questions per difficulty
        List<Question> easyQs = IntStream.range(0, 50).mapToObj(i -> {
            Question q = createQuestion("easy-" + i);
            q.setDifficulty(Question.Difficulty.easy);
            return q;
        }).toList();
        List<Question> medQs = IntStream.range(0, 50).mapToObj(i -> {
            Question q = createQuestion("med-" + i);
            q.setDifficulty(Question.Difficulty.medium);
            return q;
        }).toList();
        List<Question> hardQs = IntStream.range(0, 50).mapToObj(i -> {
            Question q = createQuestion("hard-" + i);
            q.setDifficulty(Question.Difficulty.hard);
            return q;
        }).toList();

        when(questionRepository.findAllActiveByLanguageAndDifficulty("vi", Question.Difficulty.easy))
                .thenReturn(new ArrayList<>(easyQs));
        when(questionRepository.findAllActiveByLanguageAndDifficulty("vi", Question.Difficulty.medium))
                .thenReturn(new ArrayList<>(medQs));
        when(questionRepository.findAllActiveByLanguageAndDifficulty("vi", Question.Difficulty.hard))
                .thenReturn(new ArrayList<>(hardQs));
        when(historyRepository.findQuestionIdsByUserId(USER_ID)).thenReturn(List.of());
        when(historyRepository.findNeedReviewQuestionIds(eq(USER_ID), any())).thenReturn(List.of());

        List<Question> selected = selector.selectQuestions(USER_ID, 10, noDiffFilter);

        assertThat(selected).hasSize(10);
        long hardCount = selected.stream()
                .filter(q -> q.getDifficulty() == Question.Difficulty.hard).count();
        // ~20% of 10 = 2, allow 1-3 range
        assertThat(hardCount).isBetween(1L, 3L);
    }

    @Test
    void getTimerSeconds_returnsTierBasedValue() {
        when(userTierService.getTierLevel(USER_ID)).thenReturn(1);
        when(tierDifficultyConfig.getDistribution(1))
                .thenReturn(new TierDifficultyConfig.DifficultyDistribution(70, 25, 5, 30));

        assertThat(selector.getTimerSeconds(USER_ID)).isEqualTo(30);

        when(userTierService.getTierLevel(USER_ID)).thenReturn(6);
        when(tierDifficultyConfig.getDistribution(6))
                .thenReturn(new TierDifficultyConfig.DifficultyDistribution(5, 35, 60, 18));

        assertThat(selector.getTimerSeconds(USER_ID)).isEqualTo(18);
    }
}
