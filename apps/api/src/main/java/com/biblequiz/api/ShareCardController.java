package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.QuizSession;
import com.biblequiz.modules.quiz.repository.QuizSessionRepository;
import com.biblequiz.modules.ranked.model.RankTier;
import com.biblequiz.modules.share.service.ShareCardService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;

@RestController
@RequestMapping("/api/share")
public class ShareCardController {

    @Autowired
    private ShareCardService shareCardService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizSessionRepository quizSessionRepository;

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

    /**
     * Render session share card as self-contained HTML.
     * Frontend uses html-to-image to convert this to PNG client-side.
     */
    @GetMapping(value = "/render/session/{sessionId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> renderSessionCard(@PathVariable String sessionId) {
        QuizSession session = quizSessionRepository.findById(sessionId).orElse(null);

        String userName = "Player";
        int score = 0;
        int correctAnswers = 0;
        int totalQuestions = 0;

        if (session != null) {
            if (session.getOwner() != null) {
                userName = session.getOwner().getName();
            }
            score = session.getScore() != null ? session.getScore() : 0;
            correctAnswers = session.getCorrectAnswers() != null ? session.getCorrectAnswers() : 0;
            totalQuestions = session.getTotalQuestions() != null ? session.getTotalQuestions() : 0;
        }

        String date = LocalDate.now(ZoneOffset.UTC).toString();
        String html = shareCardService.renderSessionHtml(userName, score, correctAnswers, totalQuestions, date);
        return ResponseEntity.ok(html);
    }

    /**
     * Render tier-up share card as self-contained HTML.
     */
    @GetMapping(value = "/render/tier-up/{tierKey}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> renderTierUpCard(@PathVariable String tierKey, Principal principal) {
        User user = getUser(principal);
        RankTier tier = null;
        for (RankTier t : RankTier.values()) {
            if (t.getKey().equals(tierKey)) {
                tier = t;
                break;
            }
        }

        String tierName = tier != null ? tier.getDisplayName() : tierKey;
        String html = shareCardService.renderTierUpHtml(user.getName(), tierName, tierKey);
        return ResponseEntity.ok(html);
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
