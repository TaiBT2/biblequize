package com.biblequiz.modules.quiz.service;

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

    public SmartQuestionSelector(QuestionRepository questionRepository,
                                 UserQuestionHistoryRepository historyRepository) {
        this.questionRepository = questionRepository;
        this.historyRepository = historyRepository;
    }

    /**
     * Select questions intelligently based on user history.
     *
     * Priority pools:
     * 1. Never seen (60%)
     * 2. Need review — wrong > correct, past due (20%)
     * 3. Seen long ago — >30 days (15%)
     * 4. Seen recently — fallback (5%)
     */
    public List<Question> selectQuestions(String userId, int count, QuestionFilter filter) {
        Set<String> seenIds = new HashSet<>(historyRepository.findQuestionIdsByUserId(userId));
        Set<String> reviewIds = new HashSet<>(
                historyRepository.findNeedReviewQuestionIds(userId, LocalDateTime.now()));

        List<Question> allQuestions = findByFilter(filter);

        List<Question> neverSeen = new ArrayList<>();
        List<Question> needReview = new ArrayList<>();
        List<Question> seenLongAgo = new ArrayList<>();
        List<Question> seenRecently = new ArrayList<>();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        for (Question q : allQuestions) {
            if (!seenIds.contains(q.getId())) {
                neverSeen.add(q);
            } else if (reviewIds.contains(q.getId())) {
                needReview.add(q);
            } else {
                historyRepository.findByUserIdAndQuestionId(userId, q.getId())
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

        List<Question> selected = new ArrayList<>();

        // Pool allocation
        int newCount = Math.min((int) (count * 0.6), neverSeen.size());
        selected.addAll(neverSeen.subList(0, newCount));

        int revCount = Math.min((int) (count * 0.2), needReview.size());
        selected.addAll(needReview.subList(0, revCount));

        int oldCount = Math.min((int) (count * 0.15), seenLongAgo.size());
        selected.addAll(seenLongAgo.subList(0, oldCount));

        // Fill remaining from all pools
        int remaining = count - selected.size();
        if (remaining > 0) {
            List<Question> fallback = new ArrayList<>();
            if (newCount < neverSeen.size())
                fallback.addAll(neverSeen.subList(newCount, neverSeen.size()));
            if (revCount < needReview.size())
                fallback.addAll(needReview.subList(revCount, needReview.size()));
            if (oldCount < seenLongAgo.size())
                fallback.addAll(seenLongAgo.subList(oldCount, seenLongAgo.size()));
            fallback.addAll(seenRecently);

            selected.addAll(fallback.subList(0, Math.min(remaining, fallback.size())));
        }

        Collections.shuffle(selected);
        return selected;
    }

    private List<Question> findByFilter(QuestionFilter filter) {
        String book = filter.book();
        String language = filter.language() != null ? filter.language() : "vi";
        Question.Difficulty difficulty = filter.difficulty() != null
                ? Question.Difficulty.valueOf(filter.difficulty().toLowerCase()) : null;

        if (book != null && difficulty != null) {
            return questionRepository.findAllActiveByLanguageAndBookAndDifficulty(language, book, difficulty);
        } else if (book != null) {
            return questionRepository.findAllActiveByLanguageAndBook(language, book);
        } else if (difficulty != null) {
            return questionRepository.findAllActiveByLanguageAndDifficulty(language, difficulty);
        } else {
            return questionRepository.findAllActiveByLanguage(language);
        }
    }

    public record QuestionFilter(String book, String difficulty, String language) {
        public QuestionFilter(String book, String difficulty) {
            this(book, difficulty, "vi");
        }
    }
}
