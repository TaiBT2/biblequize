package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.UserQuestionHistory;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.UserQuestionHistoryRepository;
import com.biblequiz.modules.quiz.service.SmartQuestionSelector;
import com.biblequiz.modules.quiz.service.SmartQuestionSelector.QuestionFilter;
import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.ranked.model.RankTier;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/test")
@PreAuthorize("hasRole('ADMIN')")
@Profile({"dev", "default"})
public class AdminTestController {

    private final UserRepository userRepository;
    private final UserQuestionHistoryRepository historyRepository;
    private final QuestionRepository questionRepository;
    private final UserDailyProgressRepository dailyProgressRepository;
    private final SmartQuestionSelector smartQuestionSelector;

    public AdminTestController(UserRepository userRepository,
                                UserQuestionHistoryRepository historyRepository,
                                QuestionRepository questionRepository,
                                UserDailyProgressRepository dailyProgressRepository,
                                SmartQuestionSelector smartQuestionSelector) {
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.questionRepository = questionRepository;
        this.dailyProgressRepository = dailyProgressRepository;
        this.smartQuestionSelector = smartQuestionSelector;
    }

    @PostMapping("/users/{userId}/set-tier")
    @Transactional
    public ResponseEntity<?> setTier(@PathVariable String userId, @RequestParam int tierLevel) {
        if (tierLevel < 1 || tierLevel > 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tier must be 1-6"));
        }

        User user = userRepository.findById(userId).orElseThrow();
        RankTier[] tiers = RankTier.values();
        int targetPoints = tiers[tierLevel - 1].getRequiredPoints();

        // Calculate current points
        int currentPoints = dailyProgressRepository.findByUserIdOrderByDateDesc(userId)
                .stream().mapToInt(p -> p.getPointsCounted() != null ? p.getPointsCounted() : 0).sum();

        // Adjust via a single daily progress entry
        int diff = targetPoints - currentPoints;
        if (diff != 0) {
            UserDailyProgress adjustment = dailyProgressRepository
                    .findByUserIdAndDate(userId, LocalDate.now())
                    .orElseGet(() -> {
                        UserDailyProgress p = new UserDailyProgress();
                        p.setId(UUID.randomUUID().toString());
                        p.setUser(user);
                        p.setDate(LocalDate.now());
                        p.setPointsCounted(0);
                        p.setLivesRemaining(100);
                        return p;
                    });
            adjustment.setPointsCounted(
                    (adjustment.getPointsCounted() != null ? adjustment.getPointsCounted() : 0) + diff);
            dailyProgressRepository.save(adjustment);
        }

        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "newTier", tierLevel,
                "newPoints", targetPoints,
                "tierName", tiers[tierLevel - 1].getDisplayName()
        ));
    }

    @PostMapping("/users/{userId}/reset-history")
    @Transactional
    public ResponseEntity<?> resetHistory(@PathVariable String userId) {
        long deleted = historyRepository.deleteAllByUserId(userId);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "deletedRecords", deleted
        ));
    }

    @PostMapping("/users/{userId}/mock-history")
    @Transactional
    public ResponseEntity<?> mockHistory(@PathVariable String userId,
                                          @RequestParam(defaultValue = "50") int percentSeen,
                                          @RequestParam(defaultValue = "10") int percentWrong) {
        User user = userRepository.findById(userId).orElseThrow();

        // Clear existing history first
        historyRepository.deleteAllByUserId(userId);

        List<Question> allQuestions = questionRepository.findAllActiveByLanguage("vi");
        int seenCount = (int) (allQuestions.size() * percentSeen / 100.0);
        int wrongCount = (int) (seenCount * percentWrong / 100.0);

        Collections.shuffle(allQuestions);
        List<UserQuestionHistory> batch = new ArrayList<>();
        for (int i = 0; i < Math.min(seenCount, allQuestions.size()); i++) {
            Question q = allQuestions.get(i);
            boolean isWrong = i < wrongCount;
            UserQuestionHistory h = new UserQuestionHistory(UUID.randomUUID().toString(), user, q);
            h.setTimesSeen(1);
            h.setTimesCorrect(isWrong ? 0 : 1);
            h.setTimesWrong(isWrong ? 1 : 0);
            h.setLastSeenAt(LocalDateTime.now().minusDays(i % 30));
            if (isWrong) {
                h.setLastWrongAt(LocalDateTime.now().minusDays(2));
                h.setNextReviewAt(LocalDateTime.now().minusDays(1)); // Past due
            }
            batch.add(h);
        }
        historyRepository.saveAll(batch);

        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "totalQuestions", allQuestions.size(),
                "mockedSeen", batch.size(),
                "mockedWrong", wrongCount
        ));
    }

    @PostMapping("/users/{userId}/refill-energy")
    @Transactional
    public ResponseEntity<?> refillEnergy(@PathVariable String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        UserDailyProgress progress = dailyProgressRepository
                .findByUserIdAndDate(userId, LocalDate.now())
                .orElseGet(() -> {
                    UserDailyProgress p = new UserDailyProgress();
                    p.setId(UUID.randomUUID().toString());
                    p.setUser(user);
                    p.setDate(LocalDate.now());
                    p.setPointsCounted(0);
                    return p;
                });
        progress.setLivesRemaining(100);
        dailyProgressRepository.save(progress);
        return ResponseEntity.ok(Map.of("energy", 100));
    }

    @PostMapping("/users/{userId}/set-streak")
    @Transactional
    public ResponseEntity<?> setStreak(@PathVariable String userId, @RequestParam int days) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setCurrentStreak(days);
        user.setLongestStreak(Math.max(user.getLongestStreak(), days));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("streak", days));
    }

    @GetMapping("/users/{userId}/preview-questions")
    public ResponseEntity<?> previewQuestions(@PathVariable String userId,
                                               @RequestParam(defaultValue = "10") int count,
                                               @RequestParam(required = false) String book,
                                               @RequestParam(defaultValue = "vi") String language) {
        QuestionFilter filter = new QuestionFilter(book, null, language);
        List<Question> questions = smartQuestionSelector.selectQuestions(userId, count, filter);

        Set<String> seenIds = new HashSet<>(historyRepository.findQuestionIdsByUserId(userId));

        Map<String, Long> poolBreakdown = new HashMap<>();
        for (Question q : questions) {
            String pool;
            if (!seenIds.contains(q.getId())) {
                pool = "NEW";
            } else {
                pool = historyRepository.findByUserIdAndQuestionId(userId, q.getId())
                        .map(h -> h.getTimesWrong() > h.getTimesCorrect() ? "REVIEW" : "OLD")
                        .orElse("UNKNOWN");
            }
            poolBreakdown.merge(pool, 1L, Long::sum);
        }

        Map<String, Long> diffBreakdown = questions.stream()
                .collect(Collectors.groupingBy(
                        q -> q.getDifficulty() != null ? q.getDifficulty().name() : "unknown",
                        Collectors.counting()));

        return ResponseEntity.ok(Map.of(
                "totalSelected", questions.size(),
                "poolBreakdown", poolBreakdown,
                "difficultyBreakdown", diffBreakdown,
                "questions", questions.stream().map(q -> Map.of(
                        "id", q.getId(),
                        "content", q.getContent() != null
                                ? q.getContent().substring(0, Math.min(80, q.getContent().length())) : "",
                        "book", q.getBook() != null ? q.getBook() : "",
                        "difficulty", q.getDifficulty() != null ? q.getDifficulty().name() : "",
                        "previouslySeen", seenIds.contains(q.getId())
                )).toList()
        ));
    }

    @PostMapping("/users/{userId}/full-reset")
    @Transactional
    public ResponseEntity<?> fullReset(@PathVariable String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setCurrentStreak(0);
        user.setLongestStreak(0);
        userRepository.save(user);

        historyRepository.deleteAllByUserId(userId);

        // Reset daily progress points
        List<UserDailyProgress> progress = dailyProgressRepository.findByUserIdOrderByDateDesc(userId);
        for (UserDailyProgress p : progress) {
            p.setPointsCounted(0);
            p.setLivesRemaining(100);
        }
        if (!progress.isEmpty()) dailyProgressRepository.saveAll(progress);

        return ResponseEntity.ok(Map.of("message", "User reset complete"));
    }
}
