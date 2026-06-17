package com.biblequiz.modules.quiz.service;

import com.biblequiz.modules.quiz.dto.DifficultyDistribution;
import com.biblequiz.modules.quiz.dto.HistoryMeta;
import com.biblequiz.modules.quiz.dto.QuestionMeta;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.UserQuestionHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SmartQuestionSelector {

    private final QuestionRepository questionRepository;
    private final UserQuestionHistoryRepository historyRepository;
    private final TierDifficultyProvider tierDifficultyProvider;

    public SmartQuestionSelector(QuestionRepository questionRepository,
                                 UserQuestionHistoryRepository historyRepository,
                                 TierDifficultyProvider tierDifficultyProvider) {
        this.questionRepository = questionRepository;
        this.historyRepository = historyRepository;
        this.tierDifficultyProvider = tierDifficultyProvider;
    }

    /**
     * Select questions with tier-based difficulty distribution + smart history.
     * If filter already specifies a difficulty, uses that. Otherwise distributes by tier.
     */
    public List<Question> selectQuestions(String userId, int count, QuestionFilter filter) {
        // Load the user's whole history once, index by question id. Every bucket
        // below classifies against this map in-memory — no per-bucket aggregate
        // queries, no per-question N+1.
        Map<String, HistoryMeta> historyById = loadHistory(userId);
        LocalDateTime now = LocalDateTime.now();

        if (filter.difficulty() != null) {
            List<String> ids = selectIdsFromMetas(count, findMetaByFilter(filter), historyById, now);
            return fetchInOrder(ids);
        }

        DifficultyDistribution dist = tierDifficultyProvider.distributionFor(userId);

        int easyCount = (int) Math.round(count * dist.easyPercent() / 100.0);
        int mediumCount = (int) Math.round(count * dist.mediumPercent() / 100.0);
        int hardCount = count - easyCount - mediumCount;

        // One meta query for all difficulties, then partition in-memory — replaces
        // the previous 3 per-difficulty queries (+1 fallback).
        List<QuestionMeta> allMetas = findMetaByFilter(
                new QuestionFilter(filter.books(), null, filter.language()));
        List<QuestionMeta> easy = new ArrayList<>();
        List<QuestionMeta> medium = new ArrayList<>();
        List<QuestionMeta> hard = new ArrayList<>();
        for (QuestionMeta m : allMetas) {
            if (m.difficulty() == Question.Difficulty.easy) easy.add(m);
            else if (m.difficulty() == Question.Difficulty.medium) medium.add(m);
            else if (m.difficulty() == Question.Difficulty.hard) hard.add(m);
        }

        List<String> selectedIds = new ArrayList<>();
        selectedIds.addAll(selectIdsFromMetas(easyCount, easy, historyById, now));
        selectedIds.addAll(selectIdsFromMetas(mediumCount, medium, historyById, now));
        selectedIds.addAll(selectIdsFromMetas(hardCount, hard, historyById, now));

        if (selectedIds.size() < count) {
            int remaining = count - selectedIds.size();
            Set<String> already = new HashSet<>(selectedIds);
            // Fallback over the full pool (any difficulty) — same set the previous
            // null-difficulty query returned, now reused from allMetas.
            List<String> extra = selectIdsFromMetas(remaining, allMetas, historyById, now);
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
        return tierDifficultyProvider.distributionFor(userId).timerSeconds();
    }

    /**
     * Load the user's whole question history, indexed by question id, in one query.
     * Replaces the previous per-bucket {@code findQuestionIdsByUserId} +
     * {@code findNeedReviewQuestionIds} + per-question {@code findByUserIdAndQuestionId}.
     */
    private Map<String, HistoryMeta> loadHistory(String userId) {
        List<HistoryMeta> rows = historyRepository.findHistoryMetaByUserId(userId);
        Map<String, HistoryMeta> byId = new HashMap<>(Math.max(16, rows.size() * 2));
        for (HistoryMeta h : rows) byId.put(h.questionId(), h);
        return byId;
    }

    /**
     * Smart selection over a pre-fetched metadata list (no queries here).
     * Prioritizes: unseen → need review → seen long ago → seen recently.
     * Classifies against the pre-loaded {@code historyById} map.
     * Returns selected IDs (in priority order). Caller batch-fetches full Question entities.
     */
    private List<String> selectIdsFromMetas(int count, List<QuestionMeta> allMetas,
                                            Map<String, HistoryMeta> historyById,
                                            LocalDateTime now) {
        if (count <= 0) return List.of();

        List<QuestionMeta> neverSeen = new ArrayList<>();
        List<QuestionMeta> needReview = new ArrayList<>();
        List<QuestionMeta> seenLongAgo = new ArrayList<>();
        List<QuestionMeta> seenRecently = new ArrayList<>();

        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        for (QuestionMeta q : allMetas) {
            HistoryMeta h = historyById.get(q.id());
            if (h == null) {
                neverSeen.add(q);
            } else if (h.needsReview(now)) {
                needReview.add(q);
            } else if (h.lastSeenAt() != null && h.lastSeenAt().isBefore(thirtyDaysAgo)) {
                seenLongAgo.add(q);
            } else {
                seenRecently.add(q);
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
