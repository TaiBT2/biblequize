package com.biblequiz.service;

import com.biblequiz.modules.quiz.dto.HistoryMeta;
import com.biblequiz.modules.quiz.dto.QuestionMeta;
import com.biblequiz.modules.quiz.entity.Question;
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
        defaultFilter = new QuestionFilter((String) null, "easy", "vi");
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

    /**
     * Helper for the two-step selector flow (commit 1b refactor):
     * 1. Stub meta projection method returning {@link QuestionMeta} list
     * 2. Stub {@code findAllById} returning the matching full {@link Question} objects
     * Pool is the canonical question list backing both stubs.
     */
    private void stubMetaForDifficulty(Question.Difficulty diff, List<Question> pool) {
        List<QuestionMeta> metas = pool.stream()
                .map(q -> new QuestionMeta(q.getId(), q.getBook(), q.getDifficulty()))
                .toList();
        when(questionRepository.findMetaByLanguageAndDifficulty("vi", diff)).thenReturn(metas);
        when(questionRepository.findAllById(anyIterable())).thenAnswer(invocation -> {
            Iterable<String> ids = invocation.getArgument(0);
            Set<String> idSet = new HashSet<>();
            ids.forEach(idSet::add);
            return pool.stream().filter(q -> idSet.contains(q.getId())).toList();
        });
    }

    // History projection helpers (commit RSH-2 refactor): selector now loads the
    // whole history once via findHistoryMetaByUserId and classifies in-memory.
    /** Seen recently, answered right → classifies as "seen recently" (not review). */
    private static HistoryMeta recent(String id) {
        return new HistoryMeta(id, LocalDateTime.now().minusDays(1), null, 1, 0);
    }

    /** timesWrong > timesCorrect, no scheduled slot → classifies as "need review". */
    private static HistoryMeta review(String id) {
        return new HistoryMeta(id, LocalDateTime.now().minusDays(1), null, 0, 2);
    }

    @Test
    void selectQuestions_prioritizesUnseenQuestions() {
        // User has seen 10 questions, DB has 100
        List<String> seenIds = IntStream.range(0, 10)
                .mapToObj(i -> "q-" + i).toList();

        stubMetaForDifficulty(Question.Difficulty.easy, allQuestions);
        when(historyRepository.findHistoryMetaByUserId(USER_ID))
                .thenReturn(seenIds.stream().map(SmartQuestionSelectorTest::recent).toList());

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
        // q-0..q-4 need review, q-5..q-19 seen recently
        List<HistoryMeta> history = new ArrayList<>();
        for (int i = 0; i < 5; i++) history.add(review("q-" + i));
        for (int i = 5; i < 20; i++) history.add(recent("q-" + i));

        stubMetaForDifficulty(Question.Difficulty.easy, allQuestions);
        when(historyRepository.findHistoryMetaByUserId(USER_ID)).thenReturn(history);

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(10);
    }

    @Test
    void selectQuestions_fallbackToSeenWhenNoNewQuestions() {
        // All 20 questions seen, no new ones
        List<Question> smallPool = allQuestions.subList(0, 20);
        List<String> seenIds = IntStream.range(0, 20)
                .mapToObj(i -> "q-" + i).toList();

        stubMetaForDifficulty(Question.Difficulty.easy, smallPool);
        // All seen 5 days ago → "seen recently" bucket (within 30-day window).
        when(historyRepository.findHistoryMetaByUserId(USER_ID)).thenReturn(
                seenIds.stream()
                        .map(id -> new HistoryMeta(id, LocalDateTime.now().minusDays(5), null, 1, 0))
                        .toList());

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(10);
    }

    @Test
    void selectQuestions_neverReturnsLessThanRequested_ifPoolSufficient() {
        stubMetaForDifficulty(Question.Difficulty.easy, allQuestions);
        when(historyRepository.findHistoryMetaByUserId(USER_ID)).thenReturn(List.of());

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(10);
    }

    @Test
    void selectQuestions_returnsAvailable_ifPoolInsufficient() {
        List<Question> smallPool = allQuestions.subList(0, 5);

        stubMetaForDifficulty(Question.Difficulty.easy, smallPool);
        when(historyRepository.findHistoryMetaByUserId(USER_ID)).thenReturn(List.of());

        List<Question> selected = selector.selectQuestions(USER_ID, 10, defaultFilter);

        assertThat(selected).hasSize(5);
    }

    @Test
    void selectQuestions_noDuplicates() {
        stubMetaForDifficulty(Question.Difficulty.easy, allQuestions);
        when(historyRepository.findHistoryMetaByUserId(USER_ID)).thenReturn(List.of());

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
        QuestionFilter noDiffFilter = new QuestionFilter((String) null, null, "vi");

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

        List<Question> allTierQs = new ArrayList<>();
        allTierQs.addAll(easyQs); allTierQs.addAll(medQs); allTierQs.addAll(hardQs);
        when(questionRepository.findMetaByLanguageAndDifficulty("vi", Question.Difficulty.easy))
                .thenReturn(easyQs.stream().map(q -> new QuestionMeta(q.getId(), q.getBook(), q.getDifficulty())).toList());
        when(questionRepository.findMetaByLanguageAndDifficulty("vi", Question.Difficulty.medium))
                .thenReturn(medQs.stream().map(q -> new QuestionMeta(q.getId(), q.getBook(), q.getDifficulty())).toList());
        when(questionRepository.findMetaByLanguageAndDifficulty("vi", Question.Difficulty.hard))
                .thenReturn(hardQs.stream().map(q -> new QuestionMeta(q.getId(), q.getBook(), q.getDifficulty())).toList());
        when(questionRepository.findAllById(anyIterable())).thenAnswer(invocation -> {
            Iterable<String> ids = invocation.getArgument(0);
            Set<String> idSet = new HashSet<>();
            ids.forEach(idSet::add);
            return allTierQs.stream().filter(q -> idSet.contains(q.getId())).toList();
        });
        when(historyRepository.findHistoryMetaByUserId(USER_ID)).thenReturn(List.of());

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
