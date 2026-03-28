package com.biblequiz.service;

import com.biblequiz.modules.share.entity.ShareCard;
import com.biblequiz.modules.share.repository.ShareCardRepository;
import com.biblequiz.modules.share.service.ShareCardService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShareCardServiceTest {

    @Mock
    private ShareCardRepository shareCardRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ShareCardService shareCardService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
    }

    // ── getOrCreateSessionCard (TC-SHARE-001) ────────────────────────────────

    @Test
    void getOrCreateSessionCard_newCard_shouldCreate() {
        when(shareCardRepository.findByTypeAndReferenceIdAndUserId(
                ShareCard.ShareCardType.SESSION, "session-1", "user-1"))
                .thenReturn(Optional.empty());

        ShareCard savedCard = new ShareCard();
        savedCard.setId("card-1");
        savedCard.setUser(testUser);
        savedCard.setType(ShareCard.ShareCardType.SESSION);
        savedCard.setReferenceId("session-1");
        savedCard.setImageUrl("/api/share/images/session/session-1");
        savedCard.setViewCount(0);
        savedCard.setCreatedAt(LocalDateTime.now());

        when(shareCardRepository.save(any(ShareCard.class))).thenReturn(savedCard);

        Map<String, Object> result = shareCardService.getOrCreateSessionCard("session-1", testUser);

        assertEquals("card-1", result.get("id"));
        assertEquals(ShareCard.ShareCardType.SESSION, result.get("type"));
        assertEquals("session-1", result.get("referenceId"));
        assertEquals("/api/share/images/session/session-1", result.get("imageUrl"));
        assertEquals(0, result.get("viewCount"));
        verify(shareCardRepository).save(any(ShareCard.class));
    }

    @Test
    void getOrCreateSessionCard_existingCard_shouldReturnExisting() {
        ShareCard existingCard = new ShareCard();
        existingCard.setId("card-existing");
        existingCard.setUser(testUser);
        existingCard.setType(ShareCard.ShareCardType.SESSION);
        existingCard.setReferenceId("session-1");
        existingCard.setImageUrl("/api/share/images/session/session-1");
        existingCard.setViewCount(5);
        existingCard.setCreatedAt(LocalDateTime.now());

        when(shareCardRepository.findByTypeAndReferenceIdAndUserId(
                ShareCard.ShareCardType.SESSION, "session-1", "user-1"))
                .thenReturn(Optional.of(existingCard));

        Map<String, Object> result = shareCardService.getOrCreateSessionCard("session-1", testUser);

        assertEquals("card-existing", result.get("id"));
        assertEquals(5, result.get("viewCount"));
        verify(shareCardRepository, never()).save(any(ShareCard.class));
    }

    // ── getOrCreateTierUpCard (TC-SHARE-002) ─────────────────────────────────

    @Test
    void getOrCreateTierUpCard_shouldCreateWithCorrectType() {
        when(shareCardRepository.findByTypeAndReferenceIdAndUserId(
                ShareCard.ShareCardType.TIER_UP, "tier-gold", "user-1"))
                .thenReturn(Optional.empty());

        ShareCard savedCard = new ShareCard();
        savedCard.setId("card-tier");
        savedCard.setUser(testUser);
        savedCard.setType(ShareCard.ShareCardType.TIER_UP);
        savedCard.setReferenceId("tier-gold");
        savedCard.setImageUrl("/api/share/images/tier-up/tier-gold");
        savedCard.setViewCount(0);
        savedCard.setCreatedAt(LocalDateTime.now());

        when(shareCardRepository.save(any(ShareCard.class))).thenReturn(savedCard);

        Map<String, Object> result = shareCardService.getOrCreateTierUpCard("tier-gold", testUser);

        assertEquals("card-tier", result.get("id"));
        assertEquals(ShareCard.ShareCardType.TIER_UP, result.get("type"));
        assertEquals("tier-gold", result.get("referenceId"));
        assertEquals("/api/share/images/tier-up/tier-gold", result.get("imageUrl"));
        verify(shareCardRepository).save(any(ShareCard.class));
    }

    // ── incrementViewCount (TC-SHARE-004) ────────────────────────────────────

    @Test
    void incrementViewCount_shouldCallRepository() {
        doNothing().when(shareCardRepository).incrementViewCount("card-1");

        shareCardService.incrementViewCount("card-1");

        verify(shareCardRepository).incrementViewCount("card-1");
    }
}
