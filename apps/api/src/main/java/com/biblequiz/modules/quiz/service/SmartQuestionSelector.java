package com.biblequiz.modules.quiz.service;

import com.biblequiz.modules.quiz.dto.QuestionMeta;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.UserQuestionHistoryRepository;
import com.biblequiz.modules.ranked.service.TierDifficultyConfig;
import com.biblequiz.modules.ranked.service.TierDifficultyConfig.DifficultyDistribution;
import com.biblequiz.modules.ranked.service.UserTierService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SmartQuestionSelector {

    private final QuestionRepository questionRepository;
    private final UserQuestionHistoryRepository historyRepository;
    private final TierDifficultyConfig tierDifficultyConfig;
    private final UserTierService userTierService;

    public SmartQuestionSelector(QuestionRepository questionRepository,
                                 UserQuestionHistoryRepository historyRepository,
                                 TierDifficultyConfig tierDifficultyConfig,
                                 UserTierService userTierService) {
        this.questionRepository = questionRepository;
        this.historyRepository = historyRepository;
        this.tierDifficultyConfig = tierDifficultyConfig;
        this.userTierService = userTierService;
    }

    /**
     * Select questions with tier-based difficulty distribution + smart history.
     * If filter already specifies a difficulty, uses that. Otherwise distributes by tier.
     */
    public List<Question> selectQuestions(String userId, int count, QuestionFilter filter) {
        if (filter.difficulty() != null) {
            List<String> ids = selectIdsWithSmartHistory(userId, count, filter);
            return fetchInOrder(ids);
        }

        int tierLevel = userTierService.getTierLevel(userId);
        DifficultyDistribution dist = tierDifficultyConfig.getDistribution(tierLevel);

        int easyCount = (int) Math.round(count * dist.easyPercent() / 100.0);
        int mediumCount = (int) Math.round(count * dist.mediumPercent() / 100.0);
        int hardCount = count - easyCount - mediumCount;

        List<String> selectedIds = new ArrayList<>();
        selectedIds.addAll(selectIdsWithSmartHistory(userId, easyCount,
                new QuestionFilter(filter.books(), "easy", filter.language())));
        selectedIds.addAll(selectIdsWithSmartHistory(userId, mediumCount,
                new QuestionFilter(filter.books(), "medium", filter.language())));
        selectedIds.addAll(selectIdsWithSmartHistory(userId, hardCount,
                new QuestionFilter(filter.books(), "hard", filter.language())));

        if (selectedIds.size() < count) {
            int remaining = count - selectedIds.size();
            Set<String> already = new HashSet<>(selectedIds);
            List<String> extra = selectIdsWithSmartHistory(userId, remaining,
                    new QuestionFilter(filter.books(), null, filter.language()));
            for (String id : extra) {
                if (!already.contains(id)) {
                    selectedIds.add(id);
                    if (selectedIds.size() >= count) break;
                }
            }
        }

        Collections.shuffle(selectedIds);
        return fetchInOrder(selectedIds);
    }

    /**
     * Get the timer seconds for a user based on their tier.
     */
    public int getTimerSeconds(String userId) {
        int tierLevel = userTierService.getTierLevel(userId);
        return tierDifficultyConfig.getDistribution(tierLevel).timerSeconds();
    }

    /**
     * Smart selection on metadata-only projection.
     * Prioritizes: unseen → need review → seen long ago → seen recently.
     * Returns selected IDs (in priority order). Caller batch-fetches full Question entities.
     */
    private List<String> selectIdsWithSmartHistory(String userId, int count, QuestionFilter filter) {
        if (count <= 0) return List.of();

        Set<String> seenIds = new HashSet<>(historyRepository.findQuestionIdsByUserId(userId));
        Set<String> reviewIds = new HashSet<>(
                historyRepository.findNeedReviewQuestionIds(userId, LocalDateTime.now()));

        List<QuestionMeta> allMetas = findMetaByFilter(filter);

        List<QuestionMeta> neverSeen = new ArrayList<>();
        List<QuestionMeta> needReview = new ArrayList<>();
        List<QuestionMeta> seenLongAgo = new ArrayList<>();
        List<QuestionMeta> seenRecently = new ArrayList<>();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        for (QuestionMeta q : allMetas) {
            if (!seenIds.contains(q.id())) {
                neverSeen.add(q);
            } else if (reviewIds.contains(q.id())) {
                needReview.add(q);
            } else {
                historyRepository.findByUserIdAndQuestionId(userId, q.id())
                        .ifPresent(h -> {
                            if (h.getLastSeenAt().isBefore(thirtyDaysAgo)) {
                                seenLongAgo.add(q);
                            } else {
                                seenRecently.add(q);
                            }
                        });
            }
        }

        Collections.shuffle(neverSeen);
        Collections.shuffle(needReview);
        Collections.shuffle(seenLongAgo);
        Collections.shuffle(seenRecently);

        List<QuestionMeta> selected = new ArrayList<>();

        int newCount = Math.min((int) (count * 0.6), neverSeen.size());
        selected.addAll(neverSeen.subList(0, newCount));

        int revCount = Math.min((int) (count * 0.2), needReview.size());
        selected.addAll(needReview.subList(0, revCount));

        int oldCount = Math.min((int) (count * 0.15), seenLongAgo.size());
        selected.addAll(seenLongAgo.subList(0, oldCount));

        int remaining = count - selected.size();
        if (remaining > 0) {
            List<QuestionMeta> fallback = new ArrayList<>();
            if (newCount < neverSeen.size())
                fallback.addAll(neverSeen.subList(newCount, neverSeen.size()));
            if (revCount < needReview.size())
                fallback.addAll(needReview.subList(revCount, needReview.size()));
            if (oldCount < seenLongAgo.size())
                fallback.addAll(seenLongAgo.subList(oldCount, seenLongAgo.size()));
            fallback.addAll(seenRecently);

            selected.addAll(fallback.subList(0, Math.min(remaining, fallback.size())));
        }

        List<String> ids = new ArrayList<>(selected.size());
        for (QuestionMeta m : selected) ids.add(m.id());
        return ids;
    }

    private List<QuestionMeta> findMetaByFilter(QuestionFilter filter) {
        List<String> books = filter.books();
        String language = filter.language() != null ? filter.language() : "vi";
        Question.Difficulty difficulty = (filter.difficulty() != null
                && !filter.difficulty().isEmpty()
                && !"all".equalsIgnoreCase(filter.difficulty()))
                ? Question.Difficulty.valueOf(filter.difficulty().toLowerCase()) : null;

        int bookCount = books == null ? 0 : books.size();
        if (bookCount == 0) {
            return difficulty != null
                    ? questionRepository.findMetaByLanguageAndDifficulty(language, difficulty)
                    : questionRepository.findMetaByLanguage(language);
        }
        if (bookCount == 1) {
            String book = books.get(0);
            return difficulty != null
                    ? questionRepository.findMetaByLanguageAndBookAndDifficulty(language, book, difficulty)
                    : questionRepository.findMetaByLanguageAndBook(language, book);
        }
        return difficulty != null
                ? questionRepository.findMetaByLanguageAndBooksAndDifficulty(language, books, difficulty)
                : questionRepository.findMetaByLanguageAndBooks(language, books);
    }

    /**
     * Batch-fetch full Question entities by IDs, preserving the input order.
     */
    private List<Question> fetchInOrder(List<String> ids) {
        if (ids.isEmpty()) return List.of();
        List<Question> fetched = questionRepository.findAllById(ids);
        Map<String, Question> byId = new HashMap<>(fetched.size());
        for (Question q : fetched) byId.put(q.getId(), q);
        List<Question> ordered = new ArrayList<>(ids.size());
        for (String id : ids) {
            Question q = byId.get(id);
            if (q != null) ordered.add(q);
        }
        return ordered;
    }

    /**
     * Select from a pre-built pool of questions with smart history prioritization.
     */
    public List<Question> selectFromPool(String userId, List<Question> pool, int count) {
        if (pool.isEmpty() || count <= 0) return List.of();

        Set<String> seenIds = new HashSet<>(historyRepository.findQuestionIdsByUserId(userId));

        List<Question> unseen = new ArrayList<>();
        List<Question> seen = new ArrayList<>();
        for (Question q : pool) {
            if (!seenIds.contains(q.getId())) unseen.add(q);
            else seen.add(q);
        }

        Collections.shuffle(unseen);
        Collections.shuffle(seen);

        List<Question> result = new ArrayList<>();
        result.addAll(unseen.subList(0, Math.min(count, unseen.size())));
        int remaining = count - result.size();
        if (remaining > 0) {
            result.addAll(seen.subList(0, Math.min(remaining, seen.size())));
        }
        return result;
    }

    /**
     * Filter for question selection. Canonical field is {@code books} (list)
     * per SPEC_USER_v3.2 §7.7.4. Single-book convenience constructors preserved
     * for backward compatibility — Practice, Variety, Mystery still pass one or zero books.
     */
    public record QuestionFilter(List<String> books, String difficulty, String language) {
        public QuestionFilter {
            if (books == null) books = List.of();
        }
        public QuestionFilter(List<String> books, String difficulty) {
            this(books, difficulty, "vi");
        }
        public QuestionFilter(String book, String difficulty, String language) {
            this(book == null || book.isEmpty() ? List.of() : List.of(book), difficulty, language);
        }
        public QuestionFilter(String book, String difficulty) {
            this(book, difficulty, "vi");
        }
        /** Backward-compat accessor: returns first book or null. */
        public String book() {
            return books == null || books.isEmpty() ? null : books.get(0);
        }
    }
}
