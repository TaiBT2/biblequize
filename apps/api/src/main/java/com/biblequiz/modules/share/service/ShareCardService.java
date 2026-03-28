package com.biblequiz.modules.share.service;

import com.biblequiz.modules.share.entity.ShareCard;
import com.biblequiz.modules.share.repository.ShareCardRepository;
import com.biblequiz.modules.user.entity.User;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class ShareCardService {

    @Autowired
    private ShareCardRepository shareCardRepository;

    public Map<String, Object> getOrCreateSessionCard(String sessionId, User user) {
        ShareCard card = shareCardRepository
                .findByTypeAndReferenceIdAndUserId(ShareCard.ShareCardType.SESSION, sessionId, user.getId())
                .orElseGet(() -> {
                    ShareCard newCard = new ShareCard();
                    newCard.setId(UUID.randomUUID().toString());
                    newCard.setUser(user);
                    newCard.setType(ShareCard.ShareCardType.SESSION);
                    newCard.setReferenceId(sessionId);
                    newCard.setImageUrl("/api/share/render/session/" + sessionId);
                    return shareCardRepository.save(newCard);
                });
        return toDTO(card);
    }

    public Map<String, Object> getOrCreateTierUpCard(String tierId, User user) {
        ShareCard card = shareCardRepository
                .findByTypeAndReferenceIdAndUserId(ShareCard.ShareCardType.TIER_UP, tierId, user.getId())
                .orElseGet(() -> {
                    ShareCard newCard = new ShareCard();
                    newCard.setId(UUID.randomUUID().toString());
                    newCard.setUser(user);
                    newCard.setType(ShareCard.ShareCardType.TIER_UP);
                    newCard.setReferenceId(tierId);
                    newCard.setImageUrl("/api/share/render/tier-up/" + tierId);
                    return shareCardRepository.save(newCard);
                });
        return toDTO(card);
    }

    public void incrementViewCount(String cardId) {
        shareCardRepository.incrementViewCount(cardId);
    }

    /**
     * Render HTML template for client-side screenshot (html-to-image).
     * Returns self-contained HTML with inline CSS — no external dependencies.
     */
    public String renderSessionHtml(String userName, int score, int correctAnswers, int totalQuestions, String date) {
        int percentage = totalQuestions > 0 ? (correctAnswers * 100 / totalQuestions) : 0;
        String stars = "★".repeat(correctAnswers) + "☆".repeat(Math.max(0, totalQuestions - correctAnswers));

        return """
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif">
            <div style="width:600px;height:315px;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;
                        display:flex;flex-direction:column;justify-content:center;align-items:center;
                        border-radius:16px;position:relative;overflow:hidden">
              <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#d4a843,#f0d78c,#d4a843)"></div>
              <div style="font-size:14px;color:#d4a843;letter-spacing:2px;margin-bottom:8px">🕊️ BIBLEQUIZ</div>
              <div style="font-size:13px;color:#8899aa;margin-bottom:16px">%s</div>
              <div style="font-size:24px;letter-spacing:4px;margin-bottom:8px">%s</div>
              <div style="font-size:36px;font-weight:bold;color:#d4a843;margin-bottom:4px">%d/%d câu đúng</div>
              <div style="font-size:14px;color:#8899aa;margin-bottom:16px">Điểm: %d</div>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:32px;height:32px;border-radius:50%%;background:#d4a843;display:flex;align-items:center;
                            justify-content:center;font-size:14px;font-weight:bold">%s</div>
                <div style="font-size:14px">%s</div>
              </div>
              <div style="position:absolute;bottom:12px;font-size:11px;color:#556677">biblequiz.app</div>
            </div>
            </body></html>
            """.formatted(date, stars, correctAnswers, totalQuestions, score,
                userName.substring(0, 1).toUpperCase(), userName);
    }

    public String renderTierUpHtml(String userName, String tierName, String tierKey) {
        String icon = switch (tierKey) {
            case "newcomer" -> "🌱";
            case "seeker" -> "🌿";
            case "disciple" -> "📜";
            case "sage" -> "🏮";
            case "prophet" -> "🔥";
            case "apostle" -> "👑";
            default -> "⭐";
        };

        return """
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif">
            <div style="width:600px;height:315px;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;
                        display:flex;flex-direction:column;justify-content:center;align-items:center;
                        border-radius:16px;position:relative;overflow:hidden">
              <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#d4a843,#f0d78c,#d4a843)"></div>
              <div style="font-size:14px;color:#d4a843;letter-spacing:2px;margin-bottom:16px">🕊️ BIBLEQUIZ</div>
              <div style="font-size:48px;margin-bottom:8px">%s</div>
              <div style="font-size:13px;color:#8899aa;margin-bottom:4px">Chúc mừng đã đạt tier</div>
              <div style="font-size:28px;font-weight:bold;color:#d4a843;margin-bottom:16px">%s</div>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:32px;height:32px;border-radius:50%%;background:#d4a843;display:flex;align-items:center;
                            justify-content:center;font-size:14px;font-weight:bold">%s</div>
                <div style="font-size:14px">%s</div>
              </div>
              <div style="position:absolute;bottom:12px;font-size:11px;color:#556677">biblequiz.app</div>
            </div>
            </body></html>
            """.formatted(icon, tierName, userName.substring(0, 1).toUpperCase(), userName);
    }

    public Map<String, Object> toDTO(ShareCard card) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", card.getId());
        dto.put("type", card.getType());
        dto.put("referenceId", card.getReferenceId());
        dto.put("imageUrl", card.getImageUrl());
        dto.put("viewCount", card.getViewCount());
        dto.put("createdAt", card.getCreatedAt());
        return dto;
    }
}
