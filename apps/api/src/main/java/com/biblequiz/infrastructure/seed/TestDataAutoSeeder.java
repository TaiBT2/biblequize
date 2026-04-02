package com.biblequiz.infrastructure.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.biblequiz.modules.user.repository.UserRepository;

@Component
@Profile("!prod")
@Order(200)
public class TestDataAutoSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TestDataAutoSeeder.class);

    @Autowired private TestDataSeeder seeder;
    @Autowired private UserRepository userRepository;

    @Value("${app.test-data.enabled:false}")
    private boolean enabled;

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.debug("Test data auto-seed disabled");
            return;
        }

        boolean exists = userRepository.findByEmail("admin@biblequiz.test").isPresent();
        if (exists) {
            log.info("=== Test data already exists, skipping auto-seed ===");
            return;
        }

        log.info("=== Auto-seeding test data ===");
        SeedResult result = seeder.seedAll(false);
        log.info("=== Test data auto-seeded: {} ({}ms) ===", result.summary(), result.getDurationMs());
    }
}
