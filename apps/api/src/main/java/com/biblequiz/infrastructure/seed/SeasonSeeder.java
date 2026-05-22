package com.biblequiz.infrastructure.seed;

import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Seeds 4 liturgical seasons per year (current + next year), aligned to
 * calendar quarters per DECISIONS.md 2026-05-01 "Leaderboard tabs + 4
 * liturgical seasons":
 *
 * <ul>
 *   <li>Q1 (Jan-Mar): Mùa Phục Sinh (Easter)</li>
 *   <li>Q2 (Apr-Jun): Mùa Ngũ Tuần (Pentecost)</li>
 *   <li>Q3 (Jul-Sep): Mùa Cảm Tạ (Thanksgiving)</li>
 *   <li>Q4 (Oct-Dec): Mùa Giáng Sinh (Christmas)</li>
 * </ul>
 *
 * Each season has 3-5 focus books for the Liturgical Coverage Climax phase
 * (§7.10.3 — weeks 9-11 reserved + ×1.5 score bonus).
 *
 * Idempotent via deterministic ID {@code season-{year}-q{1-4}}. Re-running
 * the seeder upserts (insert if missing, refresh focus_books for existing rows
 * if empty). Old rows from earlier seeder versions (random UUIDs, non-quarter
 * dates) are NOT deleted — they become legacy data and are ignored by
 * date-based {@code SeasonService.getActiveSeason()} since their dates won't
 * match "today" in the new quarter grid.
 */
@Component
@Profile("!prod")
public class SeasonSeeder {

    private static final Logger log = LoggerFactory.getLogger(SeasonSeeder.class);

    private static final String[] QUARTER_NAMES = {
            "Mùa Phục Sinh",
            "Mùa Ngũ Tuần",
            "Mùa Cảm Tạ",
            "Mùa Giáng Sinh",
    };

    /**
     * Focus books per quarter for Climax phase + ×1.5 score bonus.
     * Indexed by (quarter - 1). Sourced from SPEC_USER_v3.2 §7.10.3 default
     * values (Easter from spec example, others from biblical narrative fit).
     */
    private static final List<List<String>> FOCUS_BOOKS_BY_QUARTER = List.of(
            // Q1 Phục Sinh — gospels + Acts (resurrection + birth of church)
            List.of("Matthew", "Mark", "Luke", "John", "Acts"),
            // Q2 Ngũ Tuần — Pentecost: Acts + early Pauline epistles (church spread)
            List.of("Acts", "Romans", "1 Corinthians", "Galatians", "Ephesians"),
            // Q3 Cảm Tạ — wisdom/gratitude/praise literature
            List.of("Psalms", "Proverbs", "Ecclesiastes", "Song of Songs"),
            // Q4 Giáng Sinh — Messianic prophecy + nativity accounts
            List.of("Isaiah", "Matthew", "Luke", "John")
    );

    @Autowired
    private SeasonRepository seasonRepository;

    /**
     * Auto-seed liturgical seasons after Spring Boot is fully ready.
     * Idempotent (deterministic IDs), so safe to run on every restart —
     * existing rows skip insert but get focus_books refreshed if empty.
     * Wrapped in try/catch so a seed failure never breaks startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        try {
            int inserted = seed();
            if (inserted > 0) {
                log.info("SeasonSeeder auto-seed complete — {} new seasons", inserted);
            }
        } catch (Exception e) {
            log.error("SeasonSeeder auto-seed failed — continuing without seeding", e);
        }
    }

    public int seed() {
        int currentYear = LocalDate.now(ZoneOffset.UTC).getYear();
        int inserted = 0;
        int focusBooksBackfilled = 0;

        for (int year : new int[]{currentYear, currentYear + 1}) {
            for (int quarter = 1; quarter <= 4; quarter++) {
                String id = String.format("season-%d-q%d", year, quarter);
                List<String> focusBooks = FOCUS_BOOKS_BY_QUARTER.get(quarter - 1);

                Season existing = seasonRepository.findById(id).orElse(null);
                if (existing != null) {
                    // Backfill focus_books if empty (post-V59 migration on previously-seeded row)
                    if (existing.getFocusBooks() == null || existing.getFocusBooks().isEmpty()) {
                        existing.setFocusBooks(focusBooks);
                        seasonRepository.save(existing);
                        focusBooksBackfilled++;
                    }
                    continue;
                }

                LocalDate start = LocalDate.of(year, (quarter - 1) * 3 + 1, 1);
                LocalDate end = start.plusMonths(3).minusDays(1);
                String name = String.format("%s %d", QUARTER_NAMES[quarter - 1], year);
                Season season = new Season(id, name, start, end);
                // is_active is informational only; SeasonService computes
                // active by date range (DECISIONS 4B). Set true for
                // current quarter to keep DB self-consistent.
                LocalDate today = LocalDate.now(ZoneOffset.UTC);
                season.setIsActive(!today.isBefore(start) && !today.isAfter(end));
                season.setFocusBooks(focusBooks);
                seasonRepository.save(season);
                inserted++;
            }
        }

        if (inserted > 0) {
            log.info("SeasonSeeder: inserted {} liturgical seasons", inserted);
        }
        if (focusBooksBackfilled > 0) {
            log.info("SeasonSeeder: backfilled focus_books on {} existing seasons", focusBooksBackfilled);
        }
        if (inserted == 0 && focusBooksBackfilled == 0) {
            log.debug("SeasonSeeder: all liturgical seasons already present + focus_books populated, skipping");
        }
        return inserted;
    }

    public void clear() {
        seasonRepository.deleteAll();
        log.info("SeasonSeeder: cleared all seasons");
    }
}
