package com.biblequiz.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;

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
import com.biblequiz.repository.UserBookProgressRepository;
import com.biblequiz.repository.UserRepository;
import com.biblequiz.service.BookProgressionService;

@RestController
@RequestMapping("/api")
public class RankedController {

    private static class Progress {
        String date;
        int livesRemaining = 30;
        int questionsCounted = 0;
        int pointsToday = 0;
        int cap = 500;
        int dailyLives = 30;
        String currentBook = "Genesis";
        int currentBookIndex = 0;
        int questionsInCurrentBook = 0;
        int correctAnswersInCurrentBook = 0;
        boolean isPostCycle = false;
        String currentDifficulty = "all";
        int currentStreak = 0;
    }

    private final Map<String, Progress> sessionIdToProgress = new ConcurrentHashMap<>();

    @Autowired
    private UserDailyProgressRepository udpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookProgressionService bookProgressionService;

    @Autowired
    private UserBookProgressRepository userBookProgressRepository;
    private String resolveEmail(Authentication authentication) {
        if (authentication == null) return null;
        try {
            Object principal = authentication.getPrincipal();
            if (principal instanceof OAuth2User oAuth2User) {
                Object emailAttr = oAuth2User.getAttributes().get("email");
                if (emailAttr != null) return emailAttr.toString();
            }
        } catch (Exception ignore) {}
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
                UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), LocalDate.parse(p.date)).orElse(null);
                if (udp != null) {
                    p.livesRemaining = udp.getLivesRemaining() != null ? Math.max(0, Math.min(30, udp.getLivesRemaining())) : 30;
                    p.questionsCounted = udp.getQuestionsCounted() != null ? Math.min(udp.getQuestionsCounted(), 500) : 0;
                    p.pointsToday = udp.getPointsCounted() != null ? udp.getPointsCounted() : 0;
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
        
        // Enforce daily caps and compute scoring
        boolean isCorrect = Boolean.TRUE.equals(payload.get("isCorrect"));
        String questionId = payload.get("questionId") != null ? payload.get("questionId").toString() : null;
        int clientElapsedMs = 0;
        try { clientElapsedMs = payload.get("clientElapsedMs") instanceof Number ? ((Number) payload.get("clientElapsedMs")).intValue() : 0; } catch (Exception ignore) {}
        int timeLimitSec = 30;
        System.out.println("isCorrect: " + isCorrect);
        Progress p = sessionIdToProgress.computeIfAbsent(sessionId, id -> {
            Progress np = new Progress();
            np.date = LocalDate.now(ZoneOffset.UTC).toString();
            System.out.println("=== DEBUG: Creating new session progress for sessionId: " + sessionId + " ===");
            return np;
        });
        System.out.println("=== DEBUG: submitRankedAnswer ===");
        System.out.println("SessionId: " + sessionId);
        System.out.println("Current questionsCounted: " + p.questionsCounted);
        System.out.println("Current livesRemaining: " + p.livesRemaining);
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
        System.out.println("After increment - questionsCounted: " + p.questionsCounted);
        
        // Update book-specific progress
        p.questionsInCurrentBook += 1;
        if (isCorrect) {
            p.correctAnswersInCurrentBook += 1;
            int base = 100;
            int remainingMs = Math.max(0, timeLimitSec * 1000 - clientElapsedMs);
            int timeBonus = (int) Math.round((remainingMs / (double) (timeLimitSec * 1000)) * 50.0);
            p.currentStreak += 1;
            int streakBonus = 0;
            if (p.currentStreak >= 15) streakBonus = 200;
            else if (p.currentStreak >= 10) streakBonus = 120;
            else if (p.currentStreak >= 5) streakBonus = 50;
            int earned = base + timeBonus + streakBonus;
            p.pointsToday += earned;
            
            System.out.println("=== POINTS CALCULATION ===");
            System.out.println("Base points: " + base);
            System.out.println("Time bonus: " + timeBonus);
            System.out.println("Streak bonus: " + streakBonus);
            System.out.println("Earned this answer: " + earned);
            System.out.println("Total points today: " + p.pointsToday);
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
                    
                    System.out.println("=== DATABASE UPDATE ===");
                    System.out.println("Updating database with:");
                    System.out.println("livesRemaining: " + p.livesRemaining);
                    System.out.println("questionsCounted: " + p.questionsCounted);
                    System.out.println("pointsToday: " + p.pointsToday);
                    // Append asked question id
                    if (questionId != null) {
                        java.util.List<String> asked = udp.getAskedQuestionIds();
                        if (asked == null) asked = new java.util.ArrayList<>();
                        if (!asked.contains(questionId)) {
                            asked.add(questionId);
                            udp.setAskedQuestionIds(asked);
                            System.out.println("Added question " + questionId + " to asked list. Total asked: " + asked.size());
                        }
                    }
                    
                    // Update book progression
                    udp.setCurrentBook(p.currentBook);
                    udp.setCurrentBookIndex(p.currentBookIndex);
                    udp.setIsPostCycle(p.isPostCycle);
                    try {
                        udp.setCurrentDifficulty(UserDailyProgress.Difficulty.valueOf(p.currentDifficulty.toLowerCase()));
                    } catch (Exception ex) {
                        udp.setCurrentDifficulty(UserDailyProgress.Difficulty.all);
                    }
                    
                    udpRepository.save(udp);

                    // Per-book mastery tracking
                    if (questionId != null) {
                        com.biblequiz.entity.UserBookProgress ubp = userBookProgressRepository.findByUserIdAndBook(user.getId(), p.currentBook)
                                .orElse(new com.biblequiz.entity.UserBookProgress(java.util.UUID.randomUUID().toString(), user, p.currentBook));
                        java.util.List<String> uniques = ubp.getUniqueQuestionIds();
                        if (uniques == null) uniques = new java.util.ArrayList<>();
                        boolean isNew = false;
                        if (!uniques.contains(questionId)) { uniques.add(questionId); isNew = true; }
                        ubp.setUniqueQuestionIds(uniques);
                        if (isNew) ubp.setAnsweredCount((ubp.getAnsweredCount() == null ? 0 : ubp.getAnsweredCount()) + 1);
                        if (isCorrect) ubp.setCorrectCount((ubp.getCorrectCount() == null ? 0 : ubp.getCorrectCount()) + 1);
                        userBookProgressRepository.save(ubp);

                        // Mastery check
                        if ((ubp.getAnsweredCount() != null && ubp.getAnsweredCount() >= 100) &&
                            (ubp.getCorrectCount() != null && ubp.getCorrectCount() >= 70)) {
                            String nextBook = bookProgressionService.getNextBook(p.currentBook);
                            if (nextBook != null) {
                                p.currentBook = nextBook;
                                p.currentBookIndex = bookProgressionService.getBookProgress(nextBook).currentIndex - 1;
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
            System.err.println("Error saving ranked progress to database: " + e.getMessage());
            e.printStackTrace();
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
        } catch (Exception ignore) {}

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
            System.err.println("Exception in submitRankedAnswer: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResp = new HashMap<>();
            errorResp.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResp);
        }
    }

    @GetMapping("/me/ranked-status")
    public ResponseEntity<Map<String, Object>> getRankedStatus(Authentication authentication) {
        System.out.println("=== getRankedStatus METHOD CALLED ===");
        System.out.println("Authentication: " + (authentication != null ? authentication.getName() : "null"));
        
        // Priority: Latest session data > Database data > Default values
        Progress p = new Progress();
        p.date = LocalDate.now(ZoneOffset.UTC).toString();
        
        System.out.println("Today's date: " + p.date);
        System.out.println("Total sessions in memory: " + sessionIdToProgress.size());
        
        // First, check if there's any active session with more recent data
        Progress latestSession = sessionIdToProgress.values().stream()
            .filter(session -> session.date.equals(p.date))
            .max((s1, s2) -> Integer.compare(s1.questionsCounted, s2.questionsCounted))
            .orElse(null);
            
        System.out.println("Latest session found: " + (latestSession != null ? "YES" : "NO"));
        if (latestSession != null) {
            System.out.println("=== Using latest session data ===");
            System.out.println("Session questionsCounted: " + latestSession.questionsCounted);
            System.out.println("Session livesRemaining: " + latestSession.livesRemaining);
            System.out.println("Session pointsToday: " + latestSession.pointsToday);
            
            // Use session data as base
            p.livesRemaining = latestSession.livesRemaining;
            p.questionsCounted = latestSession.questionsCounted;
            p.pointsToday = latestSession.pointsToday;
            p.currentBook = latestSession.currentBook;
            p.currentBookIndex = latestSession.currentBookIndex;
            p.questionsInCurrentBook = latestSession.questionsInCurrentBook;
            p.correctAnswersInCurrentBook = latestSession.correctAnswersInCurrentBook;
            p.isPostCycle = latestSession.isPostCycle;
            p.currentDifficulty = latestSession.currentDifficulty;
            p.currentStreak = latestSession.currentStreak;
        } else {
            System.out.println("=== No session data found, using database/defaults ===");
        }
        
        try {
            if (authentication != null && authentication.getName() != null) {
                String email = authentication.getName();
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
                        p.currentDifficulty = udp.getCurrentDifficulty() != null ? udp.getCurrentDifficulty().name() : "all";
                        p.isPostCycle = udp.getIsPostCycle() != null ? udp.getIsPostCycle() : false;
                        p.currentBookIndex = udp.getCurrentBookIndex() != null ? udp.getCurrentBookIndex() : 0;
                        p.date = today.toString();
                    } else {
                        // Check if there's a record from yesterday or earlier
                        java.util.List<UserDailyProgress> recentRecords = udpRepository.findByUserIdOrderByDateDesc(user.getId());
                        if (!recentRecords.isEmpty()) {
                            UserDailyProgress lastRecord = recentRecords.get(0);
                            LocalDate lastDate = lastRecord.getDate();
                            
                            // If last record is from a different day, reset progress
                            if (!lastDate.equals(today)) {
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
                            } else {
                                // Same day, use existing record
                                p.livesRemaining = lastRecord.getLivesRemaining() != null ? lastRecord.getLivesRemaining() : 30;
                                p.questionsCounted = lastRecord.getQuestionsCounted() != null ? lastRecord.getQuestionsCounted() : 0;
                                p.pointsToday = lastRecord.getPointsCounted() != null ? lastRecord.getPointsCounted() : 0;
                                p.currentBook = lastRecord.getCurrentBook() != null ? lastRecord.getCurrentBook() : "Genesis";
                                p.currentDifficulty = lastRecord.getCurrentDifficulty() != null ? lastRecord.getCurrentDifficulty().name() : "all";
                                p.isPostCycle = lastRecord.getIsPostCycle() != null ? lastRecord.getIsPostCycle() : false;
                                p.currentBookIndex = lastRecord.getCurrentBookIndex() != null ? lastRecord.getCurrentBookIndex() : 0;
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
        } catch (Exception ignore) {}
        System.out.println("=== Final response data ===");
        System.out.println("Final questionsCounted: " + p.questionsCounted);
        System.out.println("Final livesRemaining: " + p.livesRemaining);
        System.out.println("Final pointsToday: " + p.pointsToday);
        
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
            if (authentication != null && authentication.getName() != null) {
                String email = authentication.getName();
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
        } catch (Exception ignore) {}
        // Set reset time - configurable for testing vs production
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime resetTime;
        
        // Check if we're in test mode (you can change this to false for production)
        boolean isTestMode = false; // Set to true for 2-minute reset, false for 24-hour reset
        
        if (isTestMode) {
            resetTime = now.plusMinutes(2); // 2 minutes for testing
        } else {
            resetTime = now.plusHours(24);  // 24 hours for production
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

            // Find the most recent session with progress
            Progress latestSession = sessionIdToProgress.values().stream()
                .filter(session -> session.date.equals(LocalDate.now(ZoneOffset.UTC).toString()))
                .max((s1, s2) -> Integer.compare(s1.questionsCounted, s2.questionsCounted))
                .orElse(null);

            if (latestSession != null && (latestSession.questionsCounted > 0 || latestSession.pointsToday > 0)) {
                System.out.println("Syncing session progress to database: " + latestSession.questionsCounted + " questions, " + latestSession.pointsToday + " points");
                
                // Sync to database
                LocalDate today = LocalDate.now(ZoneOffset.UTC);
                UserDailyProgress udp = udpRepository.findByUserIdAndDate(user.getId(), today)
                    .orElse(new UserDailyProgress(UUID.randomUUID().toString(), user, today));
                
                udp.setLivesRemaining(latestSession.livesRemaining);
                udp.setQuestionsCounted(latestSession.questionsCounted);
                udp.setPointsCounted(latestSession.pointsToday);
                udp.setCurrentBook(latestSession.currentBook);
                udp.setCurrentBookIndex(latestSession.currentBookIndex);
                udp.setIsPostCycle(latestSession.isPostCycle);
                // Set difficulty if available
                if (latestSession.currentDifficulty != null) {
                    try {
                        udp.setCurrentDifficulty(UserDailyProgress.Difficulty.valueOf(latestSession.currentDifficulty.toLowerCase()));
                    } catch (Exception e) {
                        udp.setCurrentDifficulty(UserDailyProgress.Difficulty.all);
                    }
                } else {
                    udp.setCurrentDifficulty(UserDailyProgress.Difficulty.all);
                }
                
                udpRepository.save(udp);
                
                System.out.println("Successfully synced progress to database");
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "questionsCounted", latestSession.questionsCounted,
                    "pointsToday", latestSession.pointsToday,
                    "livesRemaining", latestSession.livesRemaining
                ));
            } else {
                System.out.println("No session progress found to sync");
                return ResponseEntity.ok(Map.of("success", true, "message", "No progress to sync"));
            }
        } catch (Exception e) {
            System.err.println("Error syncing progress: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to sync progress"));
        }
    }
}


