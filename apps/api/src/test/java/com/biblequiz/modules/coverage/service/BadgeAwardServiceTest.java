package com.biblequiz.modules.coverage.service;

import com.biblequiz.modules.coverage.entity.UserSeasonBadge;
import com.biblequiz.modules.coverage.entity.UserSeasonCoverage;
import com.biblequiz.modules.coverage.repository.UserSeasonBadgeRepository;
import com.biblequiz.modules.coverage.repository.UserSeasonCoverageRepository;
import com.biblequiz.modules.coverage.service.BadgeTierCalculator.BadgeTier;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.quiz.repository.UserQuestionHistoryRepository;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * LCT-7 — end-of-season Liturgical Coverage badge award (SPEC §7.1.8).
 *
 * Pins:
 *   - Idempotency (existing badge → empty).
 *   - Eligibility floor (BadgeTier.NONE → empty, no save).
 *   - Successful award persists + emits analytics + records computed stats.
 *   - markAsShown ownership check rejects other users.
 */
class BadgeAwardServiceTest {

    private final UserSeasonBadgeRepository badgeRepo = mock(UserSeasonBadgeRepository.class);
    private final BadgeTierCalculator tierCalc = mock(BadgeTierCalculator.class);
    private final UserSeasonCoverageRepository coverageRepo = mock(UserSeasonCoverageRepository.class);
    private final SeasonRepository seasonRepo = mock(SeasonRepository.class);
    private final UserQuestionHistoryRepository historyRepo = mock(UserQuestionHistoryRepository.class);
    private final UserDailyProgressRepository dailyProgressRepo = mock(UserDailyProgressRepository.class);
    private final CoverageAnalytics analytics = mock(CoverageAnalytics.class);

    private final BadgeAwardService svc = new BadgeAwardService(
            badgeRepo, tierCalc, coverageRepo, seasonRepo, historyRepo, dailyProgressRepo, analytics);

    private UserSeasonCoverage coverageWith(Map<String, Integer> bookCoverage) {
        UserSeasonCoverage c = new UserSeasonCoverage();
        c.setBookCoverage(bookCoverage);
        return c;
    }

    @Test
    void awardIfEligible_existingBadge_isIdempotent() {
        when(badgeRepo.existsByUserIdAndSeasonId("u1", "s1")).thenReturn(true);

        Optional<UserSeasonBadge> r = svc.awardIfEligible("u1", "s1");
        assertTrue(r.isEmpty());
        verify(badgeRepo, never()).save(any());
        verifyNoInteractions(analytics);
    }

    @Test
    void awardIfEligible_belowFloor_returnsEmptyNoSave() {
        when(badgeRepo.existsByUserIdAndSeasonId(any(), any())).thenReturn(false);
        when(coverageRepo.findByUserIdAndSeasonId("u1", "s1"))
                .thenReturn(Optional.of(coverageWith(Map.of("Genesis", 5))));
        when(tierCalc.countCoveredBooks(any())).thenReturn(3);
        when(tierCalc.calculateTier(3)).thenReturn(BadgeTier.NONE);

        Optional<UserSeasonBadge> r = svc.awardIfEligible("u1", "s1");
        assertTrue(r.isEmpty());
        verify(badgeRepo, never()).save(any());
    }

    @Test
    void awardIfEligible_eligible_persistsBadgeAndAnalytics() {
        when(badgeRepo.existsByUserIdAndSeasonId(any(), any())).thenReturn(false);
        Map<String, Integer> bc = new HashMap<>();
        bc.put("Genesis", 30);
        bc.put("Matthew", 25);
        when(coverageRepo.findByUserIdAndSeasonId("u1", "s1"))
                .thenReturn(Optional.of(coverageWith(bc)));
        when(tierCalc.countCoveredBooks(any())).thenReturn(40);
        when(tierCalc.calculateTier(40)).thenReturn(BadgeTier.HANH_HUONG);
        Season season = new Season();
        season.setId("s1");
        season.setStartDate(LocalDate.of(2026, 3, 1));
        season.setEndDate(LocalDate.of(2026, 5, 30));
        when(seasonRepo.findById("s1")).thenReturn(Optional.of(season));
        when(dailyProgressRepo.findByUserIdAndDateBetween(eq("u1"), any(), any())).thenReturn(List.of());
        when(badgeRepo.save(any(UserSeasonBadge.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<UserSeasonBadge> r = svc.awardIfEligible("u1", "s1");

        assertTrue(r.isPresent());
        UserSeasonBadge b = r.get();
        assertEquals("u1", b.getUserId());
        assertEquals("s1", b.getSeasonId());
        assertEquals(BadgeTier.HANH_HUONG.name(), b.getBadgeTier());
        assertEquals(40, b.getBooksCovered());
        assertEquals(55, b.getTotalQuestions()); // 30 + 25
        verify(badgeRepo).save(any(UserSeasonBadge.class));
        verify(analytics).seasonBadgeAwarded(eq("u1"), eq(BadgeTier.HANH_HUONG.name()), eq(40), eq("s1"));
    }

    @Test
    void markAsShown_badgeOwner_setsTimestamp() {
        UserSeasonBadge badge = new UserSeasonBadge();
        badge.setId("b1");
        badge.setUserId("u1");
        when(badgeRepo.findById("b1")).thenReturn(Optional.of(badge));

        svc.markAsShown("b1", "u1");
        assertNotNull(badge.getShownToUserAt());
        verify(badgeRepo).save(badge);
    }

    @Test
    void markAsShown_otherUser_throwsIllegalArgument() {
        UserSeasonBadge badge = new UserSeasonBadge();
        badge.setId("b1");
        badge.setUserId("u1");
        when(badgeRepo.findById("b1")).thenReturn(Optional.of(badge));

        assertThrows(IllegalArgumentException.class, () -> svc.markAsShown("b1", "attacker"));
        verify(badgeRepo, never()).save(any());
    }
}
