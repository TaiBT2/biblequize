package com.biblequiz.modules.room.service;

import com.biblequiz.modules.adminai.provider.AIGenerationContext;
import com.biblequiz.modules.adminai.provider.AIGenerationResult;
import com.biblequiz.modules.adminai.provider.AIProviderRouter;
import com.biblequiz.infrastructure.bible.BookScopes;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * QP-3 — Question source for Quick Match (Đấu Nhanh) rooms.
 *
 * <p>Two paths matching the locked spec 2026-05-15:
 * <ul>
 *   <li><b>DATABASE</b> — pre-pick {@code count} active question IDs from
 *       the {@code questions} table with optional book filter and a mixed
 *       difficulty proportion (30% EASY / 50% MEDIUM / 20% HARD).
 *       Caller saves into {@code Room.customQuestionIds} JSON column
 *       (V36 contract). Anti-spoiler: pick at create time so client
 *       cannot enumerate the upcoming question pool via a list endpoint.
 *   <li><b>AI_GENERATED</b> — synchronously call
 *       {@link AIProviderRouter#generate} once, serialize the result map
 *       into JSON, and return as a string. Caller saves into
 *       {@code Room.aiQuestionsPayload} JSON column (V57). Per Bùi pivot
 *       2026-05-15 these questions are <b>one-shot</b> — they are NOT
 *       inserted into the {@code questions} table and are purged with
 *       the room (R5 cleanup).
 * </ul>
 *
 * <p>Game-start wiring (consuming {@code aiQuestionsPayload} in
 * {@link com.biblequiz.modules.room.service.RoomQuizService}) is tracked
 * separately — this service is pure source selection.
 */
@Service
public class QuickMatchQuestionSourceService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Autowired private QuestionRepository questionRepository;
    @Autowired private AIProviderRouter aiProviderRouter;

    /**
     * Pick {@code count} question IDs from the DB with a 30/50/20
     * difficulty mix. {@code book} is optional ({@code null} or "ALL"
     * → no book filter). {@code language} filters vi/en so rooms don't
     * mix the two pools (bug 2026-05-20 — was leaking EN questions into
     * VN rooms because language wasn't passed through).
     */
    public List<String> pickDatabaseIds(String book, int count, String language) {
        int easy = Math.round(count * 0.30f);
        int hard = Math.round(count * 0.20f);
        int medium = count - easy - hard;

        String lang = (language == null || language.isBlank()) ? "vi" : language;
        List<Question> bag = new ArrayList<>();
        bag.addAll(pick(lang, book, Question.Difficulty.easy, easy));
        bag.addAll(pick(lang, book, Question.Difficulty.medium, medium));
        bag.addAll(pick(lang, book, Question.Difficulty.hard, hard));
        Collections.shuffle(bag, RANDOM);

        // Trim if any tier returned more than requested (shouldn't happen
        // with Pageable but be defensive).
        return bag.stream().limit(count).map(Question::getId).toList();
    }

    private List<Question> pick(String language, String book, Question.Difficulty diff, int count) {
        if (count <= 0) return List.of();
        PageRequest pr = PageRequest.of(0, count);
        List<String> excludeNone = List.of("__none__");
        // MBV-3: expand scope (group sentinel / single book) to a book set; empty = no
        // filter. A scoped query that returns nothing falls back to the whole pool.
        List<String> books = BookScopes.expand(book);
        if (!books.isEmpty()) {
            List<Question> scoped = questionRepository
                    .findRandomQuestionsByLanguageAndBooksAndDifficultyExcludingIds(language, books, diff, excludeNone, pr);
            if (!scoped.isEmpty()) return scoped;
        }
        return questionRepository.findRandomQuestionsByLanguageAndDifficultyExcludingIds(language, diff, excludeNone, pr);
    }

    /**
     * Generate {@code count} questions via the AI provider router and
     * return the serialized JSON payload ready for storage in
     * {@code Room.aiQuestionsPayload}. Throws when the provider returns
     * fewer questions than requested (caller surfaces as 422).
     */
    public String generateAiPayload(String book, int chapterFrom, int chapterTo,
                                     int verseFrom, int verseTo, int count, String language) {
        int easy = Math.round(count * 0.30f);
        int hard = Math.round(count * 0.20f);
        int medium = count - easy - hard;

        List<Map<String, Object>> drafts = new ArrayList<>();
        String providerUsed = null;
        for (Object[] tier : new Object[][]{{"easy", easy}, {"medium", medium}, {"hard", hard}}) {
            int n = (int) tier[1];
            if (n <= 0) continue;
            AIGenerationContext ctx = AIGenerationContext.range(
                    book == null || book.isBlank() ? "Genesis" : book,
                    chapterFrom, chapterTo,
                    verseFrom, verseTo,
                    ((String) tier[0]).toUpperCase(),
                    "MULTIPLE_CHOICE",
                    language == null ? "vi" : language,
                    n, null, null);
            AIGenerationResult res = aiProviderRouter.generate(ctx, null);
            providerUsed = res.providerUsed();
            for (Map<String, Object> q : res.questions()) {
                Map<String, Object> withDifficulty = new LinkedHashMap<>(q);
                withDifficulty.putIfAbsent("difficulty", (String) tier[0]);
                drafts.add(withDifficulty);
            }
        }

        if (drafts.size() < count) {
            throw new IllegalStateException(
                    "AI_GENERATION_INSUFFICIENT — yêu cầu " + count + " câu nhưng chỉ nhận "
                            + drafts.size() + ". Thử lại hoặc dùng nguồn Hệ thống.");
        }
        Collections.shuffle(drafts, RANDOM);
        if (drafts.size() > count) drafts = new ArrayList<>(drafts.subList(0, count));

        Map<String, Object> envelope = Map.of(
                "version", 1,
                "provider", providerUsed != null ? providerUsed : "auto",
                "questions", drafts);
        try {
            return MAPPER.writeValueAsString(envelope);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("AI_PAYLOAD_SERIALIZE_FAILED", e);
        }
    }
}
