package com.biblequiz.modules.coverage.scheduler;

import com.biblequiz.modules.coverage.repository.UserSeasonCoverageRepository;
import com.biblequiz.modules.coverage.entity.UserSeasonCoverage;
import com.biblequiz.modules.coverage.service.BadgeAwardService;
import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Calendar-driven end-of-season badge award (SPEC_USER_v3.2 §7.1.8).
 *
 * <p>Badges are awarded by season <em>end date</em>, NOT week-13 completion —
 * casual users (21-50 books) never reach week 13 yet still earn Hành Hương.</p>
 *
 * <p>{@code @EnableScheduling} is active on {@code ApiApplication}.</p>
 */
@Component
public class BadgeAwardScheduler {

    private static final Logger log = LoggerFactory.getLogger(BadgeAwardScheduler.class);

    private final SeasonRepository seasonRepository;
    private final UserSeasonCoverageRepository coverageRepository;
    private final BadgeAwardService badgeAwardService;

    public BadgeAwardScheduler(SeasonRepository seasonRepository,
                               UserSeasonCoverageRepository coverageRepository,
                               BadgeAwardService badgeAwardService) {
        this.seasonRepository = seasonRepository;
        this.coverageRepository = coverageRepository;
        this.badgeAwardService = badgeAwardService;
    }

    /** Daily 00:05 UTC — award badges for seasons that ended yesterday. */
    @Scheduled(cron = "0 5 0 * * *", zone = "UTC")
    public void awardEndOfSeasonBadges() {
        LocalDate yesterday = LocalDate.now(ZoneOffset.UTC).minusDays(1);
        for (Season season : seasonRepository.findByEndDate(yesterday)) {
            awardForSeason(season);
        }
    }

    /**
     * Daily 02:00 UTC reconciliation — re-sweep seasons that ended in the last
     * 7 days to catch awards missed during downtime at 00:05.
     */
    @Scheduled(cron = "0 0 2 * * *", zone = "UTC")
    public void reconcileMissedBadges() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Season> ended = seasonRepository.findByEndDateBetween(today.minusDays(7), today.minusDays(1));
        for (Season season : ended) {
            awardForSeason(season);
        }
    }

    private void awardForSeason(Season season) {
        int awarded = 0;
        List<UserSeasonCoverage> coverages = coverageRepository.findBySeasonId(season.getId());
        for (UserSeasonCoverage coverage : coverages) {
            try {
                if (badgeAwardService.awardIfEligible(coverage.getUserId(), season.getId()).isPresent()) {
                    awarded++;
                }
            } catch (Exception e) {
                log.error("Badge award failed: user={} season={}",
                        coverage.getUserId(), season.getId(), e);
                // continue batch
            }
        }
        if (awarded > 0) {
            log.info("Season {} badge sweep: {} badges awarded", season.getId(), awarded);
        }
    }
}
