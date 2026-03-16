package com.biblequiz.api;

import com.biblequiz.modules.achievement.service.AchievementService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    @Autowired
    private AchievementService achievementService;

    @Autowired
    private UserRepository userRepository;

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

    @GetMapping("/me")
    public ResponseEntity<List<Map<String, Object>>> myAchievements(Authentication authentication) {
        if (authentication == null) return ResponseEntity.ok(List.of());
        String email = resolveEmail(authentication);
        User user = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        if (user == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(achievementService.getAllWithStatus(user.getId()));
    }
}
