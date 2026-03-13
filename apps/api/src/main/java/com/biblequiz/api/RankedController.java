package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.UserBookProgress;
import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserBookProgressRepository;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.quiz.service.BookProgressionService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.biblequiz.modules.ranked.service.RankedSessionService;
import com.biblequiz.modules.ranked.service.RankedSessionService.Progress;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RankedController {

    private static final Logger log = LoggerFactory.getLogger(RankedController.class);

    @Autowired
    private RankedSessionService rankedSessionService;

    @Autowired
    private UserDailyProgressRepository udpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookProgressionService bookProgressionService;

    @Autowired
    private UserBookProgressRepository userBookProgressRepository;

    @Autowired
    private com.biblequiz.modules.quiz.repository.QuestionRepository questionRepository;

    private String resolveEmail(Authentication authentication) {
        if (authentication == null)
            return null;
        try {
            Object principal = authentication.getPrincipal();
            if (principal instanceof OAuth2User oAuth2User) {
                Object emailAttr = oAuth2User.getAttributes().get("email");
                if (emailAttr != null)
                    return emailAttr.toString();
            }
        } catch (Exception ignore) {
        }
        return authentication.getName();
    }

    // initial version removed in favor of merged progress version below

    @PostMapping("/ranked/sessions")
    public ResponseEntity<Map<String, Object>> startRankedSession(Authentication authentication) {
        Map<String, Object> body = new HashMap<>();
        String sessionId = "ranked-" + System.currentTimeMillis();

        Progress p = new Progress();
        p.date = LocalDate.now(ZoneOffset.UTC).toString();

        // Sync with database progress if user is authenticated
        if (authentication != null) {
            String username = resolveEmail(authentication);
            User user = username != null ? userRepository.findByEmail(username).orElse(null) : null;
            if (user != null) {
                UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), LocalDate.parse(p.date))
                        .orElse(null);
                if (udp != null) {
                    p.livesRemaining = udp.getLivesRemaining() != null
                            ? Math.max(0, Math.min(30, udp.getLivesRemaining()))
                            : 30;
                    p.questionsCounted = udp.getQuestionsCounted() != null ? Math.min(udp.getQuestionsCounted(), 500)
                            : 0;
                    p.pointsToday = udp.getPointsCounted() != null ? udp.getPointsCounted() : 0;
                    p.currentBook = udp.getCurrentBook() != null ? udp.getCurrentBook() : "Genesis";
                }
            }
        }

        // Initialize book progression tracking
        BookProgressionService.BookProgress bookProgress = bookProgressionService.getBookProgress(p.currentBook);
        p.currentBookIndex = bookProgress.currentIndex - 1; // Convert to 0-based index

        rankedSessionService.save(sessionId, p);
        body.put("sessionId", sessionId);
        body.put("currentBook", p.currentBook);
        body.put("bookProgress", bookProgress);

        return ResponseEntity.ok(body);
    }

    @RequestMapping(value = "/ranked/sessions/{id}/answer", method = RequestMethod.POST)
    public ResponseEntity<Map<String, Object>> submitRankedAnswer(
            @PathVariable("id") String sessionId,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        try {
            log.debug("submitRankedAnswer called with sessionId: {}", sessionId);

            // Enforce daily caps and compute scoring
            String questionId = payload.get("questionId") != null ? payload.get("questionId").toString() : null;
            boolean isCorrect = false;
            if (payload.containsKey("isCorrect")) {
                isCorrect = Boolean.TRUE.equals(payload.get("isCorrect"));
            } else if (questionId != null && payload.containsKey("answer")) {
                // Server-side validation
                com.biblequiz.modules.quiz.entity.Question q = questionRepository.findById(questionId).orElse(null);
                if (q != null && q.getCorrectAnswer() != null && !q.getCorrectAnswer().isEmpty()) {
                    Object answerObj = payload.get("answer");
                    if (q.getType() == com.biblequiz.modules.quiz.entity.Question.Type.multiple_choice_single) {
                        int clientAnswer = -1;
                        try {
                            clientAnswer = Integer.parseInt(answerObj.toString());
                        } catch (Exception ignore) {
                        }
                        if (clientAnswer == q.getCorrectAnswer().get(0)) {
                            isCorrect = true;
                        }
                    } else if (q.getType() == com.biblequiz.modules.quiz.entity.Question.Type.fill_in_blank) {
                        String expected = q.getCorrectAnswerText();
                        String provided = answerObj != null ? answerObj.toString().trim().toLowerCase() : "";
                        if (expected != null && provided.equals(expected.trim().toLowerCase())) {
                            isCorrect = true;
                        }
                    }
                }
            }

            // Get question difficulty for scoring
            com.biblequiz.modules.quiz.entity.Question currentQ = null;
            if (questionId != null) {
                currentQ = questionRepository.findById(questionId).orElse(null);
            }
            int clientElapsedMs = 0;
            try {
                clientElapsedMs = payload.get("clientElapsedMs") instanceof Number
                        ? ((Number) payload.get("clientElapsedMs")).intValue()
                        : 0;
            } catch (Exception ignore) {
            }
            int timeLimitSec = 30;
            Progress p = rankedSessionService.getOrCreate(sessionId);

            if (p.questionsCounted >= 500 || p.livesRemaining <= 0) {
                Map<String, Object> resp = new HashMap<>();
                resp.put("sessionId", sessionId);
                resp.put("livesRemaining", p.livesRemaining);
                resp.put("questionsCounted", p.questionsCounted);
                resp.put("pointsToday", p.pointsToday);
                resp.put("blocked", true);
                return ResponseEntity.ok(resp);
            }
            if (!isCorrect) {
                p.livesRemaining = Math.max(0, p.livesRemaining - 1);
                p.currentStreak = 0;
            }
            p.questionsCounted = Math.min(500, p.questionsCounted + 1);

            // Update book-specific progress
            p.questionsInCurrentBook += 1;
            int earned = 0;
            int baseScoreVal = 0;
            int timeBonusVal = 0;
            int streakBonusVal = 0;

            if (isCorrect) {
                p.correctAnswersInCurrentBook += 1;
                int timeLeft = Math.max(0, timeLimitSec - (clientElapsedMs / 1000));
                baseScoreVal = 10;
                double diffMultiplier = 1.0;

                if (currentQ != null) {
                    if (currentQ.getDifficulty() == com.biblequiz.modules.quiz.entity.Question.Difficulty.medium) {
                        baseScoreVal = 20;
                        diffMultiplier = 1.2;
                    } else if (currentQ.getDifficulty() == com.biblequiz.modules.quiz.entity.Question.Difficulty.hard) {
                        baseScoreVal = 30;
                        diffMultiplier = 1.5;
                    }
                }

                timeBonusVal = timeLeft / 2;
                int perfectBonus = (timeLeft >= 25) ? 5 : 0;
                earned = (int) Math.floor((baseScoreVal + timeBonusVal + perfectBonus) * diffMultiplier);

                p.currentStreak += 1;
                if (p.currentStreak >= 15)
                    streakBonusVal = 200;
                else if (p.currentStreak >= 10)
                    streakBonusVal = 120;
                else if (p.currentStreak >= 5)
                    streakBonusVal = 50;

                earned += streakBonusVal;
                p.pointsToday += earned;
            } else {
                p.currentStreak = 0;
            }

            log.debug("Points: base={} timeBonus={} streakBonus={} earned={} total={}",
                    baseScoreVal, timeBonusVal, streakBonusVal, earned, p.pointsToday);

            // Check if should advance to next book
            boolean shouldAdvance = bookProgressionService.shouldAdvanceToNextBook(
                    p.currentBook, p.questionsInCurrentBook, p.correctAnswersInCurrentBook);

            if (shouldAdvance) {
                String nextBook = bookProgressionService.getNextBook(p.currentBook);
                if (nextBook != null) {
                    log.debug("Advancing from {} to {}", p.currentBook, nextBook);
                    p.currentBook = nextBook;
                    p.currentBookIndex = bookProgressionService.getBookProgress(nextBook).currentIndex - 1;
                    p.questionsInCurrentBook = 0;
                    p.correctAnswersInCurrentBook = 0;
                } else {
                    log.info("User completed all books! Switching to post-cycle mode.");
                    p.isPostCycle = true;
                    p.currentDifficulty = "hard"; // Switch to hard questions after completing all books
                }
            }

            // Persist to DB per user/day if authenticated
            try {
                String email = resolveEmail(authentication);
                if (email != null) {
                    User user = userRepository.findByEmail(email).orElse(null);
                    if (user != null) {
                        LocalDate today = LocalDate.now(ZoneOffset.UTC);
                        UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), today)
                                .orElse(new UserDailyProgress(UUID.randomUUID().toString(), user, today));

                        // Initialize with daily defaults if new record
                        if (udp.getLivesRemaining() == null) {
                            udp.setLivesRemaining(30);
                        }
                        // Sync session progress with database
                        udp.setLivesRemaining(p.livesRemaining);
                        udp.setQuestionsCounted(p.questionsCounted);
                        // Update points based on computed earned score
                        udp.setPointsCounted(p.pointsToday);

                        // Append asked question id
                        if (questionId != null) {
                            java.util.List<String> asked = udp.getAskedQuestionIds();
                            if (asked == null)
                                asked = new java.util.ArrayList<>();
                            if (!asked.contains(questionId)) {
                                asked.add(questionId);
                                udp.setAskedQuestionIds(asked);
                            }
                        }

                        // Update book progression
                        udp.setCurrentBook(p.currentBook);
                        udp.setCurrentBookIndex(p.currentBookIndex);
                        udp.setIsPostCycle(p.isPostCycle);
                        try {
                            udp.setCurrentDifficulty(
                                    UserDailyProgress.Difficulty.valueOf(p.currentDifficulty.toLowerCase()));
                        } catch (Exception ex) {
                            udp.setCurrentDifficulty(UserDailyProgress.Difficulty.all);
                        }

                        udpRepository.save(udp);

                        // Per-book mastery tracking
                        if (questionId != null) {
                            UserBookProgress ubp = userBookProgressRepository
                                    .findByUserIdAndBook(user.getId(), p.currentBook)
                                    .orElse(new UserBookProgress(java.util.UUID.randomUUID().toString(), user,
                                            p.currentBook));
                            java.util.List<String> uniques = ubp.getUniqueQuestionIds();
                            if (uniques == null)
                                uniques = new java.util.ArrayList<>();
                            boolean isNew = false;
                            if (!uniques.contains(questionId)) {
                                uniques.add(questionId);
                                isNew = true;
                            }
                            ubp.setUniqueQuestionIds(uniques);
                            if (isNew)
                                ubp.setAnsweredCount((ubp.getAnsweredCount() == null ? 0 : ubp.getAnsweredCount()) + 1);
                            if (isCorrect)
                                ubp.setCorrectCount((ubp.getCorrectCount() == null ? 0 : ubp.getCorrectCount()) + 1);
                            userBookProgressRepository.save(ubp);

                            // Mastery check
                            if ((ubp.getAnsweredCount() != null && ubp.getAnsweredCount() >= 100) &&
                                    (ubp.getCorrectCount() != null && ubp.getCorrectCount() >= 70)) {
                                String nextBook = bookProgressionService.getNextBook(p.currentBook);
                                if (nextBook != null) {
                                    p.currentBook = nextBook;
                                    p.currentBookIndex = bookProgressionService.getBookProgress(nextBook).currentIndex
                                            - 1;
                                    p.questionsInCurrentBook = 0;
                                    p.correctAnswersInCurrentBook = 0;
                                    udp.setCurrentBook(nextBook);
                                    udp.setCurrentBookIndex(p.currentBookIndex);
                                    udpRepository.save(udp);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error saving ranked progress to database: {}", e.getMessage(), e);
            }

            // Update pointsToday from database if user is authenticated
            try {
                String email2 = resolveEmail(authentication);
                if (email2 != null) {
                    User user = userRepository.findByEmail(email2).orElse(null);
                    if (user != null) {
                        LocalDate today = LocalDate.now(ZoneOffset.UTC);
                        UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), today).orElse(null);
                        if (udp != null) {
                            p.pointsToday = udp.getPointsCounted();
                        }
                    }
                }
            } catch (Exception ignore) {
            }

            rankedSessionService.save(sessionId, p);

            Map<String, Object> resp = new HashMap<>();
            resp.put("sessionId", sessionId);
            resp.put("livesRemaining", p.livesRemaining);
            resp.put("questionsCounted", p.questionsCounted);
            resp.put("pointsToday", p.pointsToday);
            resp.put("streak", p.currentStreak);

            // Include book progression information
            BookProgressionService.BookProgress bookProgress = bookProgressionService.getBookProgress(p.currentBook);
            resp.put("currentBook", p.currentBook);
            resp.put("currentBookIndex", p.currentBookIndex);
            resp.put("questionsInCurrentBook", p.questionsInCurrentBook);
            resp.put("correctAnswersInCurrentBook", p.correctAnswersInCurrentBook);
            resp.put("isPostCycle", p.isPostCycle);
            resp.put("bookProgress", bookProgress);

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Exception in submitRankedAnswer: {}", e.getMessage(), e);
            Map<String, Object> errorResp = new HashMap<>();
            errorResp.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResp);
        }
    }

    @GetMapping("/me/ranked-status")
    public ResponseEntity<Map<String, Object>> getRankedStatus(Authentication authentication) {
        Progress p = new Progress();
        p.date = LocalDate.now(ZoneOffset.UTC).toString();

        try {
            String email = resolveEmail(authentication);
            if (email != null) {
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    LocalDate today = LocalDate.now(ZoneOffset.UTC);
                    java.util.Optional<UserDailyProgress> opt = udpRepository.findByUserIdAndDate(user.getId(), today);
                    if (opt.isPresent()) {
                        UserDailyProgress udp = opt.get();
                        p.livesRemaining = udp.getLivesRemaining() != null ? udp.getLivesRemaining() : 30;
                        p.questionsCounted = udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0;
                        p.pointsToday = udp.getPointsCounted() != null ? udp.getPointsCounted() : 0;
                        p.currentBook = udp.getCurrentBook() != null ? udp.getCurrentBook() : "Genesis";
                        p.currentDifficulty = udp.getCurrentDifficulty() != null ? udp.getCurrentDifficulty().name()
                                : "all";
                        p.isPostCycle = udp.getIsPostCycle() != null ? udp.getIsPostCycle() : false;
                        p.currentBookIndex = udp.getCurrentBookIndex() != null ? udp.getCurrentBookIndex() : 0;
                        p.date = today.toString();
                    } else {
                        // Check if there's a record from yesterday or earlier
                        java.util.List<UserDailyProgress> recentRecords = udpRepository
                                .findByUserIdOrderByDateDesc(user.getId());
                        if (!recentRecords.isEmpty()) {
                            UserDailyProgress lastRecord = recentRecords.get(0);
                            LocalDate lastDate = lastRecord.getDate();

                            // If last record is from a different day, reset progress
                            if (!lastDate.equals(today)) {
                                UserDailyProgress newUdp = new UserDailyProgress(UUID.randomUUID().toString(), user,
                                        today);
                                newUdp.setLivesRemaining(30);
                                newUdp.setQuestionsCounted(0);
                                newUdp.setPointsCounted(0);
                                newUdp.setCurrentBook("Genesis");
                                newUdp.setCurrentBookIndex(0);
                                newUdp.setCurrentDifficulty(UserDailyProgress.Difficulty.all);
                                newUdp.setIsPostCycle(false);
                                newUdp.setAskedQuestionIds(new java.util.ArrayList<>());
                                udpRepository.save(newUdp);

                                p.livesRemaining = 30;
                                p.questionsCounted = 0;
                                p.pointsToday = 0;
                                p.currentBook = "Genesis";
                                p.currentDifficulty = "all";
                                p.isPostCycle = false;
                                p.date = today.toString();
                            } else {
                                // Same day, use existing record
                                p.livesRemaining = lastRecord.getLivesRemaining() != null
                                        ? lastRecord.getLivesRemaining()
                                        : 30;
                                p.questionsCounted = lastRecord.getQuestionsCounted() != null
                                        ? lastRecord.getQuestionsCounted()
                                        : 0;
                                p.pointsToday = lastRecord.getPointsCounted() != null ? lastRecord.getPointsCounted()
                                        : 0;
                                p.currentBook = lastRecord.getCurrentBook() != null ? lastRecord.getCurrentBook()
                                        : "Genesis";
                                p.currentDifficulty = lastRecord.getCurrentDifficulty() != null
                                        ? lastRecord.getCurrentDifficulty().name()
                                        : "all";
                                p.isPostCycle = lastRecord.getIsPostCycle() != null ? lastRecord.getIsPostCycle()
                                        : false;
                                p.currentBookIndex = lastRecord.getCurrentBookIndex() != null
                                        ? lastRecord.getCurrentBookIndex()
                                        : 0;
                                p.date = today.toString();
                            }
                        } else {
                            // No previous records, create new one
                            UserDailyProgress newUdp = new UserDailyProgress(UUID.randomUUID().toString(), user, today);
                            newUdp.setLivesRemaining(30);
                            newUdp.setQuestionsCounted(0);
                            newUdp.setPointsCounted(0);
                            newUdp.setCurrentBook("Genesis");
                            newUdp.setCurrentBookIndex(0);
                            newUdp.setCurrentDifficulty(UserDailyProgress.Difficulty.all);
                            newUdp.setIsPostCycle(false);
                            newUdp.setAskedQuestionIds(new java.util.ArrayList<>());
                            udpRepository.save(newUdp);

                            p.livesRemaining = 30;
                            p.questionsCounted = 0;
                            p.pointsToday = 0;
                            p.currentBook = "Genesis";
                            p.currentDifficulty = "all";
                            p.isPostCycle = false;
                            p.date = today.toString();
                        }
                    }
                }
            }
        } catch (Exception ignore) {
        }
        Map<String, Object> body = new HashMap<>();
        body.put("date", p.date != null ? p.date : LocalDate.now(ZoneOffset.UTC).toString());
        body.put("livesRemaining", p.livesRemaining);
        body.put("questionsCounted", p.questionsCounted);
        body.put("pointsToday", p.pointsToday);
        body.put("cap", p.cap);
        body.put("dailyLives", p.dailyLives);
        // Get book progression information
        BookProgressionService.BookProgress bookProgress = bookProgressionService.getBookProgress(p.currentBook);

        body.put("currentBook", p.currentBook);
        body.put("currentBookIndex", p.currentBookIndex);
        body.put("isPostCycle", p.isPostCycle);
        body.put("currentDifficulty", p.currentDifficulty);
        body.put("nextBook", bookProgress.nextBook);
        body.put("bookProgress", bookProgress);
        // Attach asked ids summary
        try {
            String email = resolveEmail(authentication);
            if (email != null) {
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    LocalDate today = LocalDate.now(ZoneOffset.UTC);
                    java.util.Optional<UserDailyProgress> opt = udpRepository.findByUserIdAndDate(user.getId(), today);
                    if (opt.isPresent()) {
                        java.util.List<String> asked = opt.get().getAskedQuestionIds();
                        body.put("askedQuestionIdsToday", asked != null ? asked : java.util.Collections.emptyList());
                        body.put("askedQuestionCountToday", asked != null ? asked.size() : 0);
                    } else {
                        body.put("askedQuestionIdsToday", java.util.Collections.emptyList());
                        body.put("askedQuestionCountToday", 0);
                    }
                }
            }
        } catch (Exception ignore) {
        }
        // Set reset time - configurable for testing vs production
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime resetTime;

        // Check if we're in test mode (you can change this to false for production)
        boolean isTestMode = false; // Set to true for 2-minute reset, false for 24-hour reset

        if (isTestMode) {
            resetTime = now.plusMinutes(2); // 2 minutes for testing
        } else {
            resetTime = now.plusHours(24); // 24 hours for production
        }

        body.put("resetAt", resetTime.atZone(ZoneOffset.UTC).toInstant().toString());
        return ResponseEntity.ok(body);
    }

    @PostMapping("/ranked/sync-progress")
    public ResponseEntity<Map<String, Object>> syncProgress(Authentication authentication) {
        System.out.println("=== syncProgress METHOD CALLED ===");
        try {
            String email = resolveEmail(authentication);
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            java.util.Optional<UserDailyProgress> udpOpt = udpRepository.findByUserIdAndDate(user.getId(), today);
            if (udpOpt.isPresent()) {
                UserDailyProgress udp = udpOpt.get();
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "questionsCounted", udp.getQuestionsCounted() != null ? udp.getQuestionsCounted() : 0,
                        "pointsToday", udp.getPointsCounted() != null ? udp.getPointsCounted() : 0,
                        "livesRemaining", udp.getLivesRemaining() != null ? udp.getLivesRemaining() : 30));
            } else {
                return ResponseEntity.ok(Map.of("success", true, "message", "No progress today"));
            }
        } catch (Exception e) {
            log.error("Error syncing progress: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to sync progress"));
        }
    }
}
