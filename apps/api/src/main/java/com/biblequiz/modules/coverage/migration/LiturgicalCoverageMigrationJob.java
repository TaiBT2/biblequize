package com.biblequiz.modules.coverage.migration;

import com.biblequiz.modules.coverage.entity.UserSeasonCoverage;
import com.biblequiz.modules.coverage.repository.UserSeasonCoverageRepository;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;

/**
 * Phase 2 data migration per SPEC_USER_v3.2 §7.9.3: lazy-create
 * UserSeasonCoverage rows for every existing user against the current
 * active season. Idempotent — re-runs skip users that already have a
 * coverage row.
 *
 * <p>Runs at startup (after SeasonSeeder + WeeklyPairingService) but
 * GATED by {@code app.features.liturgical-coverage.migration.run-at-startup}
 * (default false) so production deploys don't auto-migrate without an
 * operator flipping the switch + verifying backup state.</p>
 *
 * <p>To run in prod:
 * <pre>
 * LITURGICAL_COVERAGE_MIGRATION_RUN_AT_STARTUP=true \
 *   <restart app once>
 * # Verify count then disable to avoid re-runs.
 * </pre></p>
 */
@Component
public class LiturgicalCoverageMigrationJob {

    private static final Logger log = LoggerFactory.getLogger(LiturgicalCoverageMigrationJob.class);

    private final UserRepository userRepository;
    private final SeasonRepository seasonRepository;
    private final UserSeasonCoverageRepository coverageRepository;
    private final boolean runAtStartup;

    public LiturgicalCoverageMigrationJob(
            UserRepository userRepository,
            SeasonRepository seasonRepository,
            UserSeasonCoverageRepository coverageRepository,
            @Value("${app.features.liturgical-coverage.migration.run-at-startup:false}") boolean runAtStartup) {
        this.userRepository = userRepository;
        this.seasonRepository = seasonRepository;
        this.coverageRepository = coverageRepository;
        this.runAtStartup = runAtStartup;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (!runAtStartup) {
            log.debug("LiturgicalCoverageMigrationJob: disabled (run-at-startup=false). "
                    + "Set LITURGICAL_COVERAGE_MIGRATION_RUN_AT_STARTUP=true to enable.");
            return;
        }
        try {
            int seeded = migrate();
            log.info("LiturgicalCoverageMigrationJob complete — seeded {} users", seeded);
        } catch (Exception e) {
            log.error("LiturgicalCoverageMigrationJob failed — continuing without migration", e);
        }
    }

    @Transactional
    public int migrate() {
        Season activeSeason = seasonRepository.findByIsActiveTrue().orElse(null);
        if (activeSeason == null) {
            log.warn("LiturgicalCoverageMigrationJob: no active season found — skipping");
            return 0;
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        long days = ChronoUnit.DAYS.between(activeSeason.getStartDate(), today);
        int calendarWeek = (int) Math.max(1, Math.min(13, (days / 7) + 1));

        int seeded = 0;
        for (User user : userRepository.findAll()) {
            if (coverageRepository.existsByUserIdAndSeasonId(user.getId(), activeSeason.getId())) {
                continue;
            }
            UserSeasonCoverage c = new UserSeasonCoverage();
            c.setId(UUID.randomUUID().toString());
            c.setUserId(user.getId());
            c.setSeasonId(activeSeason.getId());
            c.setCurrentWeek(calendarWeek);
            c.setWeeksCompleted(new ArrayList<>());
            c.setBookCoverage(new HashMap<>());
            coverageRepository.save(c);
            seeded++;
        }
        return seeded;
    }
}
