package com.biblequiz.modules.season.service;

import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

/**
 * Thin wrapper around {@link SeasonService} focused on Liturgical Coverage
 * needs (§7.10.3): resolve the season covering a given date and look up its
 * focus books for the Climax phase + ×1.5 score multiplier.
 *
 * <p>Read-only — does not mutate season state. Mutation (seeding, focus
 * book changes) belongs in {@link com.biblequiz.infrastructure.seed.SeasonSeeder}
 * or admin endpoints.</p>
 */
@Service
public class LiturgicalSeasonService {

    private final SeasonRepository seasonRepository;

    public LiturgicalSeasonService(SeasonRepository seasonRepository) {
        this.seasonRepository = seasonRepository;
    }

    /**
     * Returns the season covering the given date. Same logic as
     * {@link SeasonService#getActiveSeason()} but date-parameterised so
     * callers can resolve historical seasons (e.g., end-of-season badge
     * recompute) or test specific dates.
     */
    public Optional<Season> getCurrentSeason(LocalDate date) {
        return seasonRepository
                .findTopByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByIsActiveDescStartDateDesc(date, date);
    }

    /** Convenience: current season covering today's UTC date. */
    public Optional<Season> getCurrentSeason() {
        return getCurrentSeason(LocalDate.now(ZoneOffset.UTC));
    }

    /**
     * Returns the focus books list for a season (3-5 canonical book names).
     * Empty list if season not found or focus_books not populated yet.
     */
    public List<String> getFocusBooks(String seasonId) {
        return seasonRepository.findById(seasonId)
                .map(Season::getFocusBooks)
                .orElse(List.of());
    }

    /**
     * Returns true if the given book is a focus book of the season covering
     * the given date. Used by ScoringService for ×1.5 bonus (§7.10.3, wired
     * in commit 7).
     */
    public boolean isInSeasonFocus(LocalDate date, String book) {
        if (book == null) return false;
        return getCurrentSeason(date)
                .map(Season::getFocusBooks)
                .map(books -> books.contains(book))
                .orElse(false);
    }
}
