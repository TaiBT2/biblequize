package com.biblequiz.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

import com.biblequiz.entity.User;
import com.biblequiz.entity.UserDailyProgress;
import com.biblequiz.repository.UserDailyProgressRepository;
import com.biblequiz.repository.UserRepository;
import com.biblequiz.service.BookProgressionService;

@RestController
@RequestMapping("/api")
public class RankedController {

    private static class Progress {
        String date;
        int livesRemaining = 1000;
        int questionsCounted = 0;
        int pointsToday = 0;
        int cap = 1000;
        int dailyLives = 1000;
        String currentBook = "Genesis";
        int currentBookIndex = 0;
        int questionsInCurrentBook = 0;
        int correctAnswersInCurrentBook = 0;
        boolean isPostCycle = false;
        String currentDifficulty = "all";
    }

    private final Map<String, Progress> sessionIdToProgress = new ConcurrentHashMap<>();

    @Autowired
    private UserDailyProgressRepository udpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookProgressionService bookProgressionService;

    // initial version removed in favor of merged progress version below

    @PostMapping("/ranked/sessions")
    public ResponseEntity<Map<String, Object>> startRankedSession(Authentication authentication) {
        Map<String, Object> body = new HashMap<>();
        String sessionId = "ranked-" + System.currentTimeMillis();
        
        Progress p = new Progress();
        p.date = LocalDate.now(ZoneOffset.UTC).toString();
        
        // Sync with database progress if user is authenticated
        if (authentication != null) {
            String username = authentication.getName();
            User user = userRepository.findByEmail(username).orElse(null);
            if (user != null) {
                UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), LocalDate.parse(p.date)).orElse(null);
                if (udp != null) {
                    p.livesRemaining = udp.getLivesRemaining();
                    p.questionsCounted = udp.getQuestionsCounted();
                    p.pointsToday = udp.getPointsCounted();
                    p.currentBook = udp.getCurrentBook() != null ? udp.getCurrentBook() : "Genesis";
                }
            }
        }
        
        // Initialize book progression tracking
        BookProgressionService.BookProgress bookProgress = bookProgressionService.getBookProgress(p.currentBook);
        p.currentBookIndex = bookProgress.currentIndex - 1; // Convert to 0-based index
        
        sessionIdToProgress.put(sessionId, p);
        body.put("sessionId", sessionId);
        body.put("currentBook", p.currentBook);
        body.put("bookProgress", bookProgress);
        
        return ResponseEntity.ok(body);
    }

    @RequestMapping(value = "/ranked/sessions/{id}/answer", method = RequestMethod.POST)
    public ResponseEntity<Map<String, Object>> submitRankedAnswer(
        @PathVariable("id") String sessionId,
        @RequestBody Map<String, Object> payload,
        Authentication authentication
    ) {
        System.out.println("=== submitRankedAnswer METHOD CALLED ===");
        try {
            System.out.println("submitRankedAnswer called with sessionId: " + sessionId);
            System.out.println("Payload: " + payload);
            System.out.println("Authentication: " + (authentication != null ? authentication.getName() : "null"));
        
        // Minimal stateless update response for now
        boolean isCorrect = Boolean.TRUE.equals(payload.get("isCorrect"));
        System.out.println("isCorrect: " + isCorrect);
        Progress p = sessionIdToProgress.computeIfAbsent(sessionId, id -> {
            Progress np = new Progress();
            np.date = LocalDate.now(ZoneOffset.UTC).toString();
            return np;
        });
        if (!isCorrect) {
            p.livesRemaining = Math.max(0, p.livesRemaining - 1);
        }
        p.questionsCounted += 1;
        
        // Update book-specific progress
        p.questionsInCurrentBook += 1;
        if (isCorrect) {
            p.correctAnswersInCurrentBook += 1;
            p.pointsToday += 10; // Base points
        }
        
        // Check if should advance to next book
        boolean shouldAdvance = bookProgressionService.shouldAdvanceToNextBook(
            p.currentBook, p.questionsInCurrentBook, p.correctAnswersInCurrentBook);
        
        if (shouldAdvance) {
            String nextBook = bookProgressionService.getNextBook(p.currentBook);
            if (nextBook != null) {
                System.out.println("Advancing from " + p.currentBook + " to " + nextBook);
                p.currentBook = nextBook;
                p.currentBookIndex = bookProgressionService.getBookProgress(nextBook).currentIndex - 1;
                p.questionsInCurrentBook = 0;
                p.correctAnswersInCurrentBook = 0;
            } else {
                System.out.println("User completed all books! Switching to post-cycle mode.");
                p.isPostCycle = true;
                p.currentDifficulty = "hard"; // Switch to hard questions after completing all books
            }
        }

        // Persist to DB per user/day if authenticated
        try {
            if (authentication != null && authentication.getName() != null) {
                String email = authentication.getName();
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    LocalDate today = LocalDate.now(ZoneOffset.UTC);
                    UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), today)
                        .orElse(new UserDailyProgress(UUID.randomUUID().toString(), user, today));
                    
                    // Initialize with 1000 lives if new record
                    if (udp.getLivesRemaining() == null) {
                        udp.setLivesRemaining(1000);
                    }
                    if (!isCorrect) {
                        udp.setLivesRemaining(Math.max(0, (udp.getLivesRemaining() == null ? 1000 : udp.getLivesRemaining()) - 1));
                    }
                    udp.setQuestionsCounted((udp.getQuestionsCounted() == null ? 0 : udp.getQuestionsCounted()) + 1);
                    
                    // Update points based on correct answer
                    if (isCorrect) {
                        int points = 10; // Base points for correct answer
                        udp.setPointsCounted((udp.getPointsCounted() == null ? 0 : udp.getPointsCounted()) + points);
                    }
                    
                    // Update book progression
                    udp.setCurrentBook(p.currentBook);
                    udp.setCurrentBookIndex(p.currentBookIndex);
                    udp.setIsPostCycle(p.isPostCycle);
                    udp.setCurrentDifficulty(UserDailyProgress.Difficulty.valueOf(p.currentDifficulty.toUpperCase()));
                    
                    udpRepository.save(udp);
                }
            }
        } catch (Exception e) {
            System.err.println("Error saving ranked progress to database: " + e.getMessage());
            e.printStackTrace();
        }

        // Update pointsToday from database if user is authenticated
        try {
            if (authentication != null && authentication.getName() != null) {
                String email = authentication.getName();
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    LocalDate today = LocalDate.now(ZoneOffset.UTC);
                    UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), today).orElse(null);
                    if (udp != null) {
                        p.pointsToday = udp.getPointsCounted();
                    }
                }
            }
        } catch (Exception ignore) {}

        Map<String, Object> resp = new HashMap<>();
        resp.put("sessionId", sessionId);
        resp.put("livesRemaining", p.livesRemaining);
        resp.put("questionsCounted", p.questionsCounted);
        resp.put("pointsToday", p.pointsToday);
        
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
            System.err.println("Exception in submitRankedAnswer: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResp = new HashMap<>();
            errorResp.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResp);
        }
    }

    @GetMapping("/me/ranked-status")
    public ResponseEntity<Map<String, Object>> getRankedStatus(Authentication authentication) {
        // From DB if user authenticated; otherwise fallback to in-memory
        Progress p = sessionIdToProgress.values().stream().findFirst().orElseGet(Progress::new);
        try {
            if (authentication != null && authentication.getName() != null) {
                String email = authentication.getName();
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    LocalDate today = LocalDate.now(ZoneOffset.UTC);
                    java.util.Optional<UserDailyProgress> opt = udpRepository.findByUserIdAndDate(user.getId(), today);
                    if (opt.isPresent()) {
                        UserDailyProgress udp = opt.get();
                        p.livesRemaining = udp.getLivesRemaining() != null ? udp.getLivesRemaining() : 1000;
                        p.questionsCounted = udp.getQuestionsCounted();
                        p.pointsToday = udp.getPointsCounted();
                        p.currentBook = udp.getCurrentBook() != null ? udp.getCurrentBook() : "Genesis";
                        p.currentDifficulty = udp.getCurrentDifficulty() != null ? udp.getCurrentDifficulty().name() : "all";
                        p.isPostCycle = udp.getIsPostCycle() != null ? udp.getIsPostCycle() : false;
                        p.currentBookIndex = udp.getCurrentBookIndex() != null ? udp.getCurrentBookIndex() : 0;
                        p.date = today.toString();
                    } else {
                        // Create new record with 1000 lives
                        UserDailyProgress newUdp = new UserDailyProgress(UUID.randomUUID().toString(), user, today);
                        newUdp.setLivesRemaining(1000);
                        udpRepository.save(newUdp);
                        p.livesRemaining = 1000;
                        p.questionsCounted = 0;
                        p.pointsToday = 0;
                        p.currentBook = "Genesis";
                        p.currentDifficulty = "all";
                        p.isPostCycle = false;
                        p.date = today.toString();
                    }
                }
            }
        } catch (Exception ignore) {}
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
        // Set reset time - configurable for testing vs production
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime resetTime;
        
        // Check if we're in test mode (you can change this to false for production)
        boolean isTestMode = true; // Set to true for 2-minute reset, false for 24-hour reset
        
        if (isTestMode) {
            resetTime = now.plusMinutes(2); // 2 minutes for testing
        } else {
            resetTime = now.plusHours(24);  // 24 hours for production
        }
        
        body.put("resetAt", resetTime.atZone(ZoneOffset.UTC).toInstant().toString());
        return ResponseEntity.ok(body);
    }
}


