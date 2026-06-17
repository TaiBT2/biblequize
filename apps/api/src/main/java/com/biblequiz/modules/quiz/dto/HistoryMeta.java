package com.biblequiz.modules.quiz.dto;

import java.time.LocalDateTime;

/**
 * Lightweight projection of a user's {@code UserQuestionHistory} row — just the
 * fields {@link com.biblequiz.modules.quiz.service.SmartQuestionSelector} needs to
 * classify a question (unseen / need-review / seen-long-ago / seen-recently).
 *
 * <p>Loaded once per selection request and indexed by {@code questionId} so the
 * selector classifies in-memory instead of issuing a query per seen question
 * (the previous N+1 at SmartQuestionSelector#selectIdsWithSmartHistory).
 */
public record HistoryMeta(String questionId, LocalDateTime lastSeenAt,
                          LocalDateTime nextReviewAt, int timesCorrect, int timesWrong) {

    /**
     * Mirror of {@code UserQuestionHistoryRepository.findNeedReviewQuestionIds}:
     * answered wrong more than right and the spaced-repetition slot is due.
     */
    public boolean needsReview(LocalDateTime now) {
        return timesWrong > timesCorrect
                && (nextReviewAt == null || !nextReviewAt.isAfter(now));
    }
}
