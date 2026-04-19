package com.biblequiz.modules.lifeline.service;

import com.biblequiz.modules.quiz.entity.Question;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Picks which wrong answer option to eliminate when a user invokes a HINT
 * lifeline.
 *
 * <h3>Algorithm</h3>
 *
 * <p>Given a question and a set of options already eliminated for the
 * current user, compute the set of "candidates" = wrong options that are
 * still on the board. Then:
 *
 * <ol>
 *   <li>Fetch the distribution of community answers for this question over
 *       the configured rolling window (default: last 90 days).</li>
 *   <li>If total sample count is below the community threshold (default:
 *       10) → fall back to <b>random</b> pick among candidates. This
 *       guarantees the lifeline still works for new/rare questions.</li>
 *   <li>Otherwise → pick the candidate with the <b>lowest pick rate</b>.
 *       Rationale: eliminate the "obviously wrong" option first so the
 *       remaining distractor forces the user to think carefully between
 *       the correct answer and the most tempting wrong option. This
 *       preserves educational value compared to a classic 50-50 which
 *       removes both the obvious wrong AND the tempting distractor.</li>
 * </ol>
 *
 * <h3>Answer JSON parsing</h3>
 *
 * <p>{@code Answer.answer} is stored as JSON and may be:
 * <ul>
 *   <li>a plain integer — {@code "0"} — for {@code multiple_choice_single}</li>
 *   <li>an array — {@code "[0,2]"} — for {@code multiple_choice_multi}</li>
 *   <li>a boolean — {@code "true"} — for {@code true_false}</li>
 *   <li>a quoted string — {@code "\"text\""} — for {@code fill_in_blank}</li>
 * </ul>
 *
 * <p>For community stats we only count <i>plain integer</i> answers (the
 * single-choice case, which is also the only case HINT applies to). Other
 * shapes are skipped — they don't contribute a clear "option pick" signal.
 */
@Service
public class HintAlgorithmService {

    private static final Logger logger = LoggerFactory.getLogger(HintAlgorithmService.class);

    /** Method tag returned to the client indicating how the option was chosen. */
    public enum Method { COMMUNITY_INFORMED, RANDOM }

    public static final class HintSelection {
        private final int eliminatedOptionIndex;
        private final Method method;

        public HintSelection(int eliminatedOptionIndex, Method method) {
            this.eliminatedOptionIndex = eliminatedOptionIndex;
            this.method = method;
        }

        public int getEliminatedOptionIndex() { return eliminatedOptionIndex; }
        public Method getMethod() { return method; }
    }

    /** Thrown when all wrong options have already been eliminated. */
    public static class NoOptionsToEliminateException extends RuntimeException {
        public NoOptionsToEliminateException(String msg) { super(msg); }
    }

    @PersistenceContext
    private EntityManager entityManager;

    private final LifelineConfigService configService;
    private final Random random;

    @Autowired
    public HintAlgorithmService(LifelineConfigService configService) {
        this(configService, new Random());
    }

    /**
     * Constructor exposed for tests to inject a deterministic {@link Random}.
     * Production code should use the {@code @Autowired} constructor above.
     */
    public HintAlgorithmService(LifelineConfigService configService, Random random) {
        this.configService = configService;
        this.random = random;
    }

    /**
     * Select one wrong option to eliminate for the given user on the given
     * question.
     *
     * @param question           the quiz question (must have {@code options}
     *                           and {@code correctAnswer} populated)
     * @param alreadyEliminated  option indices already eliminated by prior
     *                           HINT uses on the same question
     * @return selection result
     * @throws NoOptionsToEliminateException if no wrong options remain
     */
    @Transactional(readOnly = true)
    public HintSelection selectOptionToEliminate(Question question,
                                                 Set<Integer> alreadyEliminated) {
        List<Integer> candidates = buildCandidates(question, alreadyEliminated);
        if (candidates.isEmpty()) {
            throw new NoOptionsToEliminateException(
                    "No wrong options remain to eliminate for question " + question.getId());
        }

        Map<Integer, Long> pickCounts = fetchPickCounts(question.getId());
        long totalSamples = pickCounts.values().stream().mapToLong(Long::longValue).sum();
        int threshold = configService.getCommunityThreshold();

        if (totalSamples < threshold) {
            int pick = candidates.get(random.nextInt(candidates.size()));
            logger.debug("Hint RANDOM: question={}, samples={}/{} (below threshold), picked idx={}",
                    question.getId(), totalSamples, threshold, pick);
            return new HintSelection(pick, Method.RANDOM);
        }

        int pick = candidates.stream()
                .min(Comparator.comparingLong(idx -> pickCounts.getOrDefault(idx, 0L)))
                .orElseThrow(); // unreachable: candidates non-empty
        logger.debug("Hint COMMUNITY_INFORMED: question={}, samples={}, candidates={}, picked idx={} (lowest pick-rate)",
                question.getId(), totalSamples, candidates, pick);
        return new HintSelection(pick, Method.COMMUNITY_INFORMED);
    }

    /** Wrong options that haven't been eliminated yet. */
    private List<Integer> buildCandidates(Question question, Set<Integer> alreadyEliminated) {
        List<String> options = question.getOptions();
        List<Integer> correct = question.getCorrectAnswer();
        if (options == null || options.isEmpty() || correct == null) return List.of();

        Set<Integer> correctSet = new HashSet<>(correct);
        List<Integer> candidates = new ArrayList<>(options.size());
        for (int i = 0; i < options.size(); i++) {
            if (correctSet.contains(i)) continue;
            if (alreadyEliminated.contains(i)) continue;
            candidates.add(i);
        }
        return candidates;
    }

    /**
     * Count how often each option index was picked for this question over
     * the configured time window. Only integer-valued answer JSON values
     * are counted (see class doc).
     */
    private Map<Integer, Long> fetchPickCounts(String questionId) {
        int windowDays = configService.getCommunityWindowDays();
        LocalDateTime since = LocalDateTime.now().minusDays(windowDays);

        TypedQuery<String> query = entityManager.createQuery(
                "SELECT a.answer FROM Answer a " +
                "WHERE a.question.id = :qId AND a.createdAt >= :since",
                String.class);
        query.setParameter("qId", questionId);
        query.setParameter("since", since);

        List<String> rawAnswers = query.getResultList();
        Map<Integer, Long> counts = new HashMap<>();
        for (String raw : rawAnswers) {
            Integer idx = parsePlainIntegerJson(raw);
            if (idx != null) counts.merge(idx, 1L, Long::sum);
        }
        return counts;
    }

    /**
     * Parse an answer-JSON value as a plain non-negative integer.
     * Returns {@code null} for any other shape (array, boolean, quoted
     * string, invalid JSON). Tolerant of whitespace.
     *
     * <p>Public for unit tests; callers outside this class should not
     * rely on this helper.
     */
    public static Integer parsePlainIntegerJson(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) return null;
        // Reject arrays, objects, quoted strings, booleans
        char first = trimmed.charAt(0);
        if (first == '[' || first == '{' || first == '"' || first == 't' || first == 'f') {
            return null;
        }
        try {
            int value = Integer.parseInt(trimmed);
            return value >= 0 ? value : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
