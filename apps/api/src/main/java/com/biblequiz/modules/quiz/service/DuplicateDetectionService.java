package com.biblequiz.modules.quiz.service;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DuplicateDetectionService {

    private final QuestionRepository questionRepository;

    public enum DuplicateStatus {
        NO_MATCH, EXACT_MATCH, SAME_VERSE_ANSWER, SIMILAR_CONTENT
    }

    public record DuplicateCheckRequest(
            String content, String correctAnswerText, String book,
            Integer chapter, Integer verseStart, String language
    ) {}

    public record DuplicateMatch(
            String questionId, String content, String correctAnswerText,
            String book, Integer chapter, Integer verseStart, double similarityPercent
    ) {
        public static DuplicateMatch fromQuestion(Question q, double similarity) {
            return new DuplicateMatch(
                    q.getId(), q.getContent(), q.getCorrectAnswerText(),
                    q.getBook(), q.getChapter(),
                    q.getVerseStart() != null ? q.getVerseStart() : null,
                    Math.round(similarity * 10) / 10.0
            );
        }
    }

    public record DuplicateCheckResult(
            DuplicateStatus status, boolean blocked, String message,
            List<DuplicateMatch> matches
    ) {}

    /**
     * Check câu hỏi mới có trùng không.
     * 3 layers: Exact Match → Same Verse+Answer → Fuzzy Similarity.
     */
    public DuplicateCheckResult checkDuplicate(DuplicateCheckRequest request) {
        // Layer 1: Exact match (content giống hệt sau normalize)
        String normalized = normalizeText(request.content());
        if (!normalized.isEmpty() && questionRepository.existsByContentIgnoreCase(normalized)) {
            List<Question> exactMatches = questionRepository.findByNormalizedContent(normalized);
            List<DuplicateMatch> matches = exactMatches.stream()
                    .map(q -> DuplicateMatch.fromQuestion(q, 100.0))
                    .toList();
            return new DuplicateCheckResult(
                    DuplicateStatus.EXACT_MATCH, true,
                    "Câu hỏi này đã tồn tại trong hệ thống", matches
            );
        }

        // Layer 2: Same book + chapter + verse + correct answer
        if (request.book() != null && request.correctAnswerText() != null && request.verseStart() != null) {
            List<Question> sameVerseAnswer = questionRepository
                    .findByBookAndChapterAndVerseStartAndLanguageAndIsActiveTrue(
                            request.book(), request.chapter(), request.verseStart(), request.language()
                    );
            List<DuplicateMatch> matches = sameVerseAnswer.stream()
                    .filter(q -> q.getCorrectAnswerText() != null &&
                            normalizeText(q.getCorrectAnswerText()).equals(normalizeText(request.correctAnswerText())))
                    .map(q -> DuplicateMatch.fromQuestion(q, 90.0))
                    .toList();

            if (!matches.isEmpty()) {
                return new DuplicateCheckResult(
                        DuplicateStatus.SAME_VERSE_ANSWER, false,
                        "Đã có câu hỏi cùng verse và đáp án. Có thể trùng ý.", matches
                );
            }
        }

        // Layer 3: Fuzzy similarity với câu cùng book + chapter
        if (request.book() != null && request.chapter() != null) {
            List<Question> sameChapter = questionRepository
                    .findByBookAndChapterAndLanguageAndIsActiveTrue(
                            request.book(), request.chapter(), request.language()
                    );

            List<DuplicateMatch> matches = new ArrayList<>();
            for (Question existing : sameChapter) {
                double similarity = calculateSimilarity(normalized, normalizeText(existing.getContent()));
                if (similarity >= 0.75) {
                    matches.add(DuplicateMatch.fromQuestion(existing, similarity * 100));
                }
            }

            if (!matches.isEmpty()) {
                matches.sort(Comparator.comparingDouble(DuplicateMatch::similarityPercent).reversed());
                return new DuplicateCheckResult(
                        DuplicateStatus.SIMILAR_CONTENT, false,
                        "Tìm thấy " + matches.size() + " câu hỏi tương tự", matches
                );
            }
        }

        return new DuplicateCheckResult(DuplicateStatus.NO_MATCH, false, null, List.of());
    }

    public List<DuplicateCheckResult> checkBatch(List<DuplicateCheckRequest> requests) {
        return requests.stream().map(this::checkDuplicate).toList();
    }

    public String normalizeText(String text) {
        if (text == null) return "";
        return text.trim()
                .toLowerCase()
                .replaceAll("[?!.,;:\"'()\\[\\]{}]", "")
                .replaceAll("\\s+", " ");
    }

    /**
     * Jaccard Similarity — so sánh tập hợp từ.
     * 0.0 = hoàn toàn khác, 1.0 = giống hệt.
     */
    public double calculateSimilarity(String a, String b) {
        if (a == null || b == null || a.isEmpty() || b.isEmpty()) return 0.0;

        Set<String> wordsA = new HashSet<>(Arrays.asList(a.split("\\s+")));
        Set<String> wordsB = new HashSet<>(Arrays.asList(b.split("\\s+")));

        Set<String> intersection = new HashSet<>(wordsA);
        intersection.retainAll(wordsB);

        Set<String> union = new HashSet<>(wordsA);
        union.addAll(wordsB);

        if (union.isEmpty()) return 0.0;
        return (double) intersection.size() / union.size();
    }
}
