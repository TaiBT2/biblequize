package com.biblequiz.controller;

import com.biblequiz.entity.User;
import com.biblequiz.entity.UserAchievement;
import com.biblequiz.repository.UserRepository;
import com.biblequiz.service.AchievementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/achievements")
public class AchievementController {
    
    @Autowired
    private AchievementService achievementService;
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/my-achievements")
    public ResponseEntity<List<UserAchievement>> getMyAchievements(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(List.of());
        }
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        
        List<UserAchievement> achievements = achievementService.getUserAchievements(user);
        return ResponseEntity.ok(achievements);
    }
    
    @GetMapping("/unnotified")
    public ResponseEntity<List<UserAchievement>> getUnnotifiedAchievements(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(List.of());
        }
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        
        List<UserAchievement> achievements = achievementService.getUnnotifiedAchievements(user);
        return ResponseEntity.ok(achievements);
    }
    
    @PostMapping("/mark-notified/{achievementId}")
    public ResponseEntity<Map<String, String>> markAsNotified(
        @PathVariable String achievementId,
        Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Not authenticated"));
        }
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        
        // Find the user achievement
        List<UserAchievement> userAchievements = achievementService.getUserAchievements(user);
        UserAchievement userAchievement = userAchievements.stream()
            .filter(ua -> ua.getId().equals(achievementId))
            .findFirst()
            .orElse(null);
        
        if (userAchievement == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Achievement not found"));
        }
        
        achievementService.markAsNotified(userAchievement);
        
        return ResponseEntity.ok(Map.of("message", "Achievement marked as notified"));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAchievementStats(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(new HashMap<>());
        }
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.ok(new HashMap<>());
        }
        
        Map<String, Object> stats = achievementService.getAchievementStats(user);
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping("/check")
    public ResponseEntity<Map<String, String>> checkAchievements(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Not authenticated"));
        }
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        
        achievementService.checkAndUnlockAchievements(user);
        
        return ResponseEntity.ok(Map.of("message", "Achievements checked"));
    }
}
