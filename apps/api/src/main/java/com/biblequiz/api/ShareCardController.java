package com.biblequiz.api;

import com.biblequiz.modules.share.service.ShareCardService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/share")
public class ShareCardController {

    @Autowired
    private ShareCardService shareCardService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getSessionCard(@PathVariable String sessionId, Principal principal) {
        User user = getUser(principal);
        Map<String, Object> card = shareCardService.getOrCreateSessionCard(sessionId, user);
        return ResponseEntity.ok(card);
    }

    @GetMapping("/tier-up/{tierId}")
    public ResponseEntity<?> getTierUpCard(@PathVariable String tierId, Principal principal) {
        User user = getUser(principal);
        Map<String, Object> card = shareCardService.getOrCreateTierUpCard(tierId, user);
        return ResponseEntity.ok(card);
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Void> incrementViewCount(@PathVariable String id) {
        shareCardService.incrementViewCount(id);
        return ResponseEntity.noContent().build();
    }

    private User getUser(Principal principal) {
        if (principal == null) throw new RuntimeException("Chưa đăng nhập");
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof OAuth2User oauth2User) {
            String email = oauth2User.getAttribute("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
            }
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
    }
}
