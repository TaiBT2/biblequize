package com.biblequiz.infrastructure.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("!prod")
public class TestDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(TestDataSeeder.class);

    @Autowired private UserSeeder userSeeder;
    @Autowired private SeasonSeeder seasonSeeder;
    @Autowired private UserDailyProgressSeeder udpSeeder;
    @Autowired private SessionSeeder sessionSeeder;
    @Autowired private GroupSeeder groupSeeder;
    @Autowired private TournamentSeeder tournamentSeeder;
    @Autowired private NotificationSeeder notificationSeeder;
    @Autowired private FeedbackSeeder feedbackSeeder;

    @Transactional
    public SeedResult seedAll(boolean reset) {
        long start = System.currentTimeMillis();
        SeedResult result = new SeedResult();

        if (reset) {
            log.warn("⚠️ RESETTING ALL TEST DATA (createdBy=test-seeder)");
            clearAllData();
        }

        result.add("seasons", seasonSeeder.seed());
        result.add("users", userSeeder.seed());
        result.add("dailyProgress", udpSeeder.seed());
        result.add("sessions", sessionSeeder.seed());
        result.add("groups", groupSeeder.seed());
        result.add("tournaments", tournamentSeeder.seed());
        result.add("notifications", notificationSeeder.seed());
        result.add("feedback", feedbackSeeder.seed());

        result.setDurationMs(System.currentTimeMillis() - start);
        log.info("✅ Test data seeded: {} ({}ms)", result.summary(), result.getDurationMs());
        return result;
    }

    @Transactional
    public void clearAllData() {
        feedbackSeeder.clear();
        notificationSeeder.clear();
        tournamentSeeder.clear();
        groupSeeder.clear();
        sessionSeeder.clear();
        udpSeeder.clear();
        seasonSeeder.clear();
        userSeeder.clear();
        log.info("🗑️ All test data cleared");
    }
}
