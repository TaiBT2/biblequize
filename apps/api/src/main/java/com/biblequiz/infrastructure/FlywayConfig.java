package com.biblequiz.infrastructure;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Flyway configuration: automatically repair any previously-failed migrations
 * before running new ones. This handles the V9 schema fix where a failed record
 * in flyway_schema_history would otherwise block the application from starting.
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy repairAndMigrate() {
        return flyway -> {
            log.info("[Flyway] Running repair to clear any failed migrations...");
            flyway.repair();
            log.info("[Flyway] Repair done. Running migrate...");
            flyway.migrate();
        };
    }
}
