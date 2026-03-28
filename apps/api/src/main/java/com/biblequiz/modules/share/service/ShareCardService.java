package com.biblequiz.modules.share.service;

import com.biblequiz.modules.share.entity.ShareCard;
import com.biblequiz.modules.share.repository.ShareCardRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class ShareCardService {

    @Autowired
    private ShareCardRepository shareCardRepository;

    @Autowired
    private UserRepository userRepository;

    public Map<String, Object> getOrCreateSessionCard(String sessionId, User user) {
        ShareCard card = shareCardRepository
                .findByTypeAndReferenceIdAndUserId(ShareCard.ShareCardType.SESSION, sessionId, user.getId())
                .orElseGet(() -> {
                    ShareCard newCard = new ShareCard();
                    newCard.setId(UUID.randomUUID().toString());
                    newCard.setUser(user);
                    newCard.setType(ShareCard.ShareCardType.SESSION);
                    newCard.setReferenceId(sessionId);
                    newCard.setImageUrl("/api/share/images/session/" + sessionId);
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
                    newCard.setImageUrl("/api/share/images/tier-up/" + tierId);
                    return shareCardRepository.save(newCard);
                });
        return toDTO(card);
    }

    public void incrementViewCount(String cardId) {
        shareCardRepository.incrementViewCount(cardId);
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
