package com.biblequiz.modules.daily.service;

import com.biblequiz.modules.daily.entity.DailyCompletion;
import com.biblequiz.modules.daily.repository.DailyCompletionRepository;
import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.quiz.service.DailyMissionService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.biblequiz.modules.user.service.StreakService;
import com.biblequiz.infrastructure.service.CacheService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

/**
 * SPEC-v2 Daily Challenge: 5 fixed questions per day, same for all users.
 * Uses date as seed for deterministic question selection.
 * Guests can play (no auth required).
 */
@Service
public class DailyChallengeService {

    private static final Logger log = LoggerFactory.getLogger(DailyChallengeService.class);

    private static final int DAILY_QUESTION_COUNT = 5;
    // See DECISIONS.md 2026-04-20 "Daily Challenge as secondary XP path".
    // Kept local (not app.yml) because it's a design invariant, not a tunable.
    private static final int DAILY_COMPLETION_XP = 50;
    // Minimum correct answers (out of DAILY_QUESTION_COUNT) required to earn XP.
    private static final int DAILY_XP_MIN_CORRECT = 4;
    private static final String CACHE_KEY_PREFIX = "daily_challenge:";

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private CacheService cacheService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDailyProgressRepository userDailyProgressRepository;

    @Autowired
    private StreakService streakService;

    @Autowired
    private DailyMissionService dailyMissionService;

    @Autowired
    private DailyCompletionRepository dailyCompletionRepository;

    /**
     * Get today's 5 challenge questions. Same questions for all users on the same day.
     */
    @SuppressWarnings("unchecked")
    public List<Question> getDailyQuestions(LocalDate date, String language) {
        if (date == null) {
            date = LocalDate.now(ZoneOffset.UTC);
        }
        String lang = (language != null && !language.isBlank()) ? language : "vi";

        String cacheKey = CACHE_KEY_PREFIX + lang + ":" + date.toString();
        Optional<List> cached = cacheService.get(cacheKey, List.class);
        if (cached.isPresent()) {
            return cached.get();
        }

        // Use date-based seed + language for deterministic selection per language
        long seed = date.toEpochDay() * 31 + lang.hashCode();
        Random random = new Random(seed);

        long totalActive = questionRepository.countByLanguageAndIsActiveTrue(lang);
        if (totalActive == 0) {
            return List.of();
        }

        // Select DAILY_QUESTION_COUNT unique random questions
        Set<Integer> selectedIndices = new HashSet<>();
        int maxAttempts = DAILY_QUESTION_COUNT * 3;
        int attempts = 0;

        while (selectedIndices.size() < DAILY_QUESTION_COUNT && selectedIndices.size() < totalActive && attempts < maxAttempts) {
            selectedIndices.add(random.nextInt((int) totalActive));
            attempts++;
        }

        List<Question> questions = new ArrayList<>();
        for (int index : selectedIndices) {
            var page = questionRepository.findByLanguageAndIsActiveTrue(lang, PageRequest.of(index, 1));
            if (page.hasContent()) {
                questions.add(page.getContent().get(0));
            }
        }

        // Cache for 24 hours
        cacheService.put(cacheKey, questions, java.time.Duration.ofHours(24));

        return questions;
    }

    /**
     * Backward-compatible overload — defaults to "vi".
     */
    public List<Question> getDailyQuestions(LocalDate date) {
        return getDailyQuestions(date, "vi");
    }

    /**
     * Get today's daily questions (convenience method).
     */
    public List<Question> getTodayQuestions(String language) {
        return getDailyQuestions(LocalDate.now(ZoneOffset.UTC), language);
    }

    public List<Question> getTodayQuestions() {
        return getTodayQuestions("vi");
    }

    /**
     * Check if a user has completed today's challenge.
     */
    public boolean hasCompletedToday(String userId) {
        String key = CACHE_KEY_PREFIX + "completed:" + userId + ":" + LocalDate.now(ZoneOffset.UTC);
        return cacheService.exists(key);
    }

    /**
     * Read the cached completion record for today and shape it into the
     * response payload the FeaturedDailyChallenge "completed" banner
     * needs. Returns {@code completed=false} when the user hasn't
     * finished today.
     *
     * <p>The cache value written by {@link #markCompleted} carries
     * {@code score / correct / total / completedAt}; this method
     * augments those with the constants the FE would otherwise have to
     * hardcode: {@code xpEarned} (the +50 XP that was credited) and
     * {@code nextResetAt} (UTC midnight tomorrow ISO-8601 string for the
     * countdown).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getResultData(String userId) {
        String dateStr = LocalDate.now(ZoneOffset.UTC).toString();
        String key = CACHE_KEY_PREFIX + "completed:" + userId + ":" + dateStr;
        Optional<Map> cached = cacheService.get(key, Map.class);
        if (cached.isEmpty()) {
            return Map.of("completed", false);
        }
        Map<String, Object> payload = cached.get();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("completed", true);
        response.put("date", dateStr);
        response.put("score", payload.getOrDefault("score", 0));
        response.put("correctCount", payload.getOrDefault("correct", 0));
        response.put("totalQuestions", payload.getOrDefault("total", DAILY_QUESTION_COUNT));
        boolean xpEarned = Boolean.TRUE.equals(payload.getOrDefault("xpEarned", false));
        response.put("xpEarned", xpEarned ? DAILY_COMPLETION_XP : 0);
        response.put("xpMinCorrect", DAILY_XP_MIN_CORRECT);
        response.put("completedAt", payload.get("completedAt"));
        // ISO-8601 instant — FE parses with new Date(...) for the countdown.
        response.put("nextResetAt", LocalDate.now(ZoneOffset.UTC)
                .plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC).toString());
        return response;
    }

    /**
     * Mark user as having completed today's challenge and credit +50 XP into
     * their {@link UserDailyProgress} row for the day.
     *
     * <p>Idempotency: the caller (DailyChallengeController.complete) already
     * guards with {@link #hasCompletedToday} before invoking this method, so
     * markCompleted runs at most once per user per day — the XP is credited
     * exactly once in sync with that guarantee.
     *
     * <p>See DECISIONS.md 2026-04-20 "Daily Challenge as secondary XP path"
     * for why +50 XP: 20 consecutive Dailies = 1,000 XP = Tier-2 unlock,
     * giving users who can't hit the 80%/10-answer early-unlock a
     * retention-driven progression loop.
     */
    @Transactional
    public void markCompleted(String userId, int score, int correctCount) {
        String dateStr = LocalDate.now(ZoneOffset.UTC).toString();
        String key = CACHE_KEY_PREFIX + "completed:" + userId + ":" + dateStr;
        boolean xpEarned = correctCount >= DAILY_XP_MIN_CORRECT;
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("score", score);
        result.put("correct", correctCount);
        result.put("total", DAILY_QUESTION_COUNT);
        result.put("completedAt", System.currentTimeMillis());
        result.put("xpEarned", xpEarned);
        cacheService.put(key, result, java.time.Duration.ofHours(48));

        User user = userRepository.findById(userId)
                .or(() -> userRepository.findByEmail(userId))
                .orElse(null);
        if (user == null) {
            log.warn("Daily completion: user not found for id/email={}, skipping XP + streak", userId);
            return;
        }

        // Persist long-term completion record (Redis cache only keeps 48h —
        // not enough for 30-day heatmap or yesterday recap). Idempotent via
        // unique (user_id, date) constraint: re-completing the same day is a
        // no-op at the DB level.
        try {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            if (dailyCompletionRepository.findByUserIdAndCompletionDate(user.getId(), today).isEmpty()) {
                DailyCompletion completion = new DailyCompletion(
                        UUID.randomUUID().toString(), user, today,
                        score, correctCount, DAILY_QUESTION_COUNT,
                        null, LocalDateTime.now(ZoneOffset.UTC));
                dailyCompletionRepository.save(completion);
            }
        } catch (RuntimeException ex) {
            log.warn("Daily completion: persist failed for user {} ({}). " +
                    "Cache + XP path unaffected; history row missing for today.",
                    user.getId(), ex.getMessage());
        }

        if (xpEarned) {
            creditCompletionXp(user);
        } else {
            log.info("Daily completion: user={} scored {}/{} — below threshold {}, XP not credited",
                    userId, correctCount, DAILY_QUESTION_COUNT, DAILY_XP_MIN_CORRECT);
        }

        // Daily completion extends streak (idempotent: StreakService skips
        // when lastPlayedAt is today). See DECISIONS.md "Daily extends streak".
        try {
            streakService.recordActivity(user);
        } catch (RuntimeException ex) {
            log.warn("Daily completion: streak update failed for user {} ({}). " +
                    "Cache + XP already credited; streak skipped.", user.getId(), ex.getMessage());
        }

        // Mark "complete_daily_challenge" mission as done.
        try {
            dailyMissionService.trackProgress(user.getId(), "complete_daily_challenge", 1);
        } catch (RuntimeException ex) {
            log.warn("Daily completion: mission tracking failed for user {} ({}). " +
                    "Cache + XP already credited; mission skipped.", user.getId(), ex.getMessage());
        }
    }

    /**
     * Adds {@value #DAILY_COMPLETION_XP} XP to the user's
     * {@link UserDailyProgress} row. Matches the shape of
     * {@code SessionService#creditNonRankedProgress} — same UDP lookup,
     * same "create fresh if absent with 100 energy" initializer — so the
     * two XP paths (Ranked sync-progress, Daily completion) feed one
     * canonical per-day points ledger.
     */
    private void creditCompletionXp(User user) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        UserDailyProgress udp = userDailyProgressRepository
                .findByUserIdAndDate(user.getId(), today)
                .orElseGet(() -> {
                    UserDailyProgress fresh = new UserDailyProgress(
                            UUID.randomUUID().toString(), user, today);
                    fresh.setLivesRemaining(100);
                    fresh.setPointsCounted(0);
                    fresh.setQuestionsCounted(0);
                    return fresh;
                });
        int before = Optional.ofNullable(udp.getPointsCounted()).orElse(0);
        udp.setPointsCounted(before + DAILY_COMPLETION_XP);
        userDailyProgressRepository.save(udp);

        log.info("Daily completion XP: user={} +{} XP (pointsCounted {}→{})",
                user.getId(), DAILY_COMPLETION_XP, before, before + DAILY_COMPLETION_XP);
    }

    public int getDailyQuestionCount() {
        return DAILY_QUESTION_COUNT;
    }

    /**
     * Resolve the user identifier (which may be email when authenticated via
     * OAuth) into the canonical UUID used as user_id in DB rows.
     */
    private Optional<String> resolveUserId(String userIdOrEmail) {
        return userRepository.findById(userIdOrEmail)
                .or(() -> userRepository.findByEmail(userIdOrEmail))
                .map(User::getId);
    }

    /**
     * Per-day completion history for the heatmap (default 30 days). Includes
     * "missing" days as {@code completed:false} so the frontend can render
     * a stable 30-cell grid without gaps.
     */
    public List<Map<String, Object>> getHistory(String userIdOrEmail, int days) {
        int safeDays = Math.max(1, Math.min(90, days));
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate start = today.minusDays(safeDays - 1L);

        Optional<String> uid = resolveUserId(userIdOrEmail);
        Map<LocalDate, DailyCompletion> byDate = uid.map(id ->
                dailyCompletionRepository.findByUserIdAndDateRange(id, start, today))
                .orElseGet(List::of)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        DailyCompletion::getCompletionDate, dc -> dc, (a, b) -> a));

        List<Map<String, Object>> result = new ArrayList<>(safeDays);
        for (int i = 0; i < safeDays; i++) {
            LocalDate d = start.plusDays(i);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", d.toString());
            DailyCompletion dc = byDate.get(d);
            if (dc != null) {
                entry.put("completed", true);
                entry.put("correctCount", dc.getCorrectCount());
                entry.put("totalQuestions", dc.getTotalQuestions());
            } else {
                entry.put("completed", false);
                entry.put("correctCount", 0);
                entry.put("totalQuestions", DAILY_QUESTION_COUNT);
            }
            result.add(entry);
        }
        return result;
    }

    /**
     * Yesterday recap shown in the State A hero card. Returns
     * {@code completed:false} when the user did not finish yesterday — the
     * frontend hides the recap block in that case (per design spec).
     */
    public Map<String, Object> getYesterdaySummary(String userIdOrEmail) {
        LocalDate yesterday = LocalDate.now(ZoneOffset.UTC).minusDays(1);
        Optional<String> uid = resolveUserId(userIdOrEmail);
        if (uid.isEmpty()) {
            return Map.of("completed", false);
        }
        Optional<DailyCompletion> opt = dailyCompletionRepository
                .findByUserIdAndCompletionDate(uid.get(), yesterday);
        if (opt.isEmpty()) {
            return Map.of("completed", false);
        }
        DailyCompletion dc = opt.get();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("completed", true);
        response.put("date", yesterday.toString());
        response.put("correctCount", dc.getCorrectCount());
        response.put("totalQuestions", dc.getTotalQuestions());
        response.put("score", dc.getScore());
        response.put("timeSeconds", dc.getTimeSeconds());
        return response;
    }

    /**
     * Check a single answer for a daily challenge question.
     * Returns isCorrect, correctAnswer indices, and explanation.
     * Used by the dedicated /api/daily-challenge/answer endpoint so the
     * frontend does not need a real QuizSession (daily sessions are
     * client-side tracking IDs only).
     */
    public Map<String, Object> checkAnswer(String questionId, int selectedAnswer) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + questionId));
        List<Integer> correctAnswer = question.getCorrectAnswer();
        boolean isCorrect = correctAnswer != null && correctAnswer.contains(selectedAnswer);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("isCorrect", isCorrect);
        result.put("correctAnswer", correctAnswer != null ? correctAnswer : List.of());
        result.put("explanation", question.getExplanation());
        return result;
    }
}
