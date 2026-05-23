package com.biblequiz.modules.season.service;

import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * LCT-5 — season transition / focus-book lookup contract.
 *
 * The service is a thin wrapper around SeasonRepository; the canonical
 * data (4 seasons per C3 — Phục Sinh / Ngũ Tuần / Cảm Tạ / Giáng Sinh)
 * is owned by SeasonSeeder and migration scripts. These tests pin the
 * dispatcher contract: each call delegates to the repo with the right
 * date and propagates the result, and isInSeasonFocus only matches when
 * the book is in the resolved season's focus list.
 */
class LiturgicalSeasonServiceTest {

    private final SeasonRepository repo = mock(SeasonRepository.class);
    private final LiturgicalSeasonService svc = new LiturgicalSeasonService(repo);

    private Season season(String id, List<String> focusBooks) {
        Season s = new Season();
        s.setId(id);
        s.setFocusBooks(focusBooks);
        return s;
    }

    @Test
    void getCurrentSeason_dispatchesByDate_returnsRepoResult() {
        LocalDate d = LocalDate.of(2026, 5, 20);
        Season pentecost = season("pentecost-2026", List.of("Acts", "Romans"));
        when(repo.findTopByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByIsActiveDescStartDateDesc(eq(d), eq(d)))
                .thenReturn(Optional.of(pentecost));

        Optional<Season> r = svc.getCurrentSeason(d);
        assertTrue(r.isPresent());
        assertEquals("pentecost-2026", r.get().getId());
    }

    @Test
    void getCurrentSeason_noSeasonForDate_returnsEmpty() {
        LocalDate d = LocalDate.of(2026, 7, 1);
        when(repo.findTopByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByIsActiveDescStartDateDesc(eq(d), eq(d)))
                .thenReturn(Optional.empty());

        assertTrue(svc.getCurrentSeason(d).isEmpty());
    }

    @Test
    void getFocusBooks_seasonFound_returnsList() {
        when(repo.findById("easter-2026"))
                .thenReturn(Optional.of(season("easter-2026", List.of("Matthew", "Mark", "Luke", "John"))));
        assertEquals(List.of("Matthew", "Mark", "Luke", "John"), svc.getFocusBooks("easter-2026"));
    }

    @Test
    void getFocusBooks_seasonMissing_returnsEmptyList() {
        when(repo.findById("nope")).thenReturn(Optional.empty());
        assertEquals(List.of(), svc.getFocusBooks("nope"));
    }

    @Test
    void isInSeasonFocus_bookInFocusList_returnsTrue() {
        LocalDate d = LocalDate.of(2026, 4, 5);
        when(repo.findTopByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByIsActiveDescStartDateDesc(eq(d), eq(d)))
                .thenReturn(Optional.of(season("easter-2026", List.of("Matthew", "John"))));

        assertTrue(svc.isInSeasonFocus(d, "John"));
        assertTrue(svc.isInSeasonFocus(d, "Matthew"));
    }

    @Test
    void isInSeasonFocus_bookNotInFocusList_returnsFalse() {
        LocalDate d = LocalDate.of(2026, 4, 5);
        when(repo.findTopByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByIsActiveDescStartDateDesc(eq(d), eq(d)))
                .thenReturn(Optional.of(season("easter-2026", List.of("Matthew", "John"))));

        assertFalse(svc.isInSeasonFocus(d, "Leviticus"));
    }

    @Test
    void isInSeasonFocus_nullBook_returnsFalse() {
        // Short-circuit on null — repository shouldn't even be consulted.
        assertFalse(svc.isInSeasonFocus(LocalDate.now(), null));
    }

    @Test
    void isInSeasonFocus_noSeasonCoveringDate_returnsFalse() {
        LocalDate gap = LocalDate.of(2026, 7, 15);
        when(repo.findTopByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByIsActiveDescStartDateDesc(eq(gap), eq(gap)))
                .thenReturn(Optional.empty());

        assertFalse(svc.isInSeasonFocus(gap, "Matthew"));
    }
}
