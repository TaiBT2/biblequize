package com.biblequiz.infrastructure.seed;

import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

@Component
@Profile("!prod")
public class SeasonSeeder {

    private static final Logger log = LoggerFactory.getLogger(SeasonSeeder.class);
    @Autowired private SeasonRepository seasonRepository;

    public int seed() {
        if (seasonRepository.count() > 0) {
            log.info("SeasonSeeder: seasons exist, skipping");
            return 0;
        }

        Season past = new Season(UUID.randomUUID().toString(), "Mùa Giáng Sinh 2025",
                LocalDate.of(2025, 12, 1), LocalDate.of(2025, 12, 31));
        past.setIsActive(false);
        seasonRepository.save(past);

        Season active = new Season(UUID.randomUUID().toString(), "Mùa Phục Sinh 2026",
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 5, 31));
        active.setIsActive(true);
        seasonRepository.save(active);

        log.info("SeasonSeeder: created 2 seasons");
        return 2;
    }

    public void clear() {
        seasonRepository.deleteAll();
        log.info("SeasonSeeder: cleared all seasons");
    }
}
