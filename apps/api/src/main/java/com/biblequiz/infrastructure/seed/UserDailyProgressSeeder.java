package com.biblequiz.infrastructure.seed;

import com.biblequiz.modules.quiz.entity.UserDailyProgress;
import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Seeds UserDailyProgress records so leaderboard has data.
 * Points per user distributed over last 30 days.
 */
@Component
@Profile("!prod")
public class UserDailyProgressSeeder {

    private static final Logger log = LoggerFactory.getLogger(UserDailyProgressSeeder.class);
    @Autowired private UserRepository userRepository;
    @Autowired private UserDailyProgressRepository udpRepository;

    // Target total points per user email (matches tier distribution)
    private static final Map<String, Integer> POINTS_MAP = Map.ofEntries(
            Map.entry("an@biblequiz.test", 120000),
            Map.entry("binh@biblequiz.test", 45000),
            Map.entry("chau@biblequiz.test", 20000),
            Map.entry("duc@biblequiz.test", 8000),
            Map.entry("em@biblequiz.test", 3000),
            Map.entry("phu@biblequiz.test", 500),
            Map.entry("huy@biblequiz.test", 15500),
            Map.entry("kim@biblequiz.test", 42000),
            Map.entry("long@biblequiz.test", 7500),
            Map.entry("mai@biblequiz.test", 1200),
            Map.entry("nam@biblequiz.test", 60000),
            Map.entry("oanh@biblequiz.test", 33000),
            Map.entry("phong@biblequiz.test", 95000),
            Map.entry("quan@biblequiz.test", 11000),
            Map.entry("rong@biblequiz.test", 200),
            Map.entry("admin@biblequiz.test", 50000),
            Map.entry("mod@biblequiz.test", 25000),
            Map.entry("mucsu.minh@biblequiz.test", 35000),
            Map.entry("huong@biblequiz.test", 28000),
            Map.entry("banned@biblequiz.test", 500),
            // Tier test users — points set to solidly land in each tier
            // test1 = 0 pts → no records needed (Tân Tín Hữu, threshold 0)
            Map.entry("test2@dev.local", 2500),    // Người Tìm Kiếm (threshold 1,000)
            Map.entry("test3@dev.local", 8000),    // Môn Đồ          (threshold 5,000)
            Map.entry("test4@dev.local", 20000),   // Hiền Triết       (threshold 15,000)
            Map.entry("test5@dev.local", 65000),   // Tiên Tri         (threshold 40,000)
            Map.entry("test6@dev.local", 110000)   // Sứ Đồ            (threshold 100,000)
    );

    public int seed() {
        List<User> testUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null
                        && (u.getEmail().endsWith("@biblequiz.test") || u.getEmail().endsWith("@dev.local")))
                .toList();
        if (testUsers.isEmpty()) return 0;

        // Check if already seeded
        User firstUser = testUsers.get(0);
        if (!udpRepository.findByUserIdOrderByDateDesc(firstUser.getId()).isEmpty()) {
            log.info("UDPSeeder: already seeded, skipping");
            return 0;
        }

        int count = 0;
        LocalDate today = LocalDate.now();

        for (User user : testUsers) {
            int targetPoints = POINTS_MAP.getOrDefault(user.getEmail(), 1000);
            int daysToSpread = Math.min(90, Math.max(7, targetPoints / 500));
            int dailyAvg = targetPoints / daysToSpread;

            for (int d = 0; d < daysToSpread; d++) {
                LocalDate date = today.minusDays(d);
                int dayPoints = dailyAvg + ThreadLocalRandom.current().nextInt(-dailyAvg / 3, dailyAvg / 3 + 1);
                dayPoints = Math.max(10, dayPoints);
                int questions = dayPoints / 10 + ThreadLocalRandom.current().nextInt(1, 5);

                UserDailyProgress udp = new UserDailyProgress();
                udp.setId(UUID.randomUUID().toString());
                udp.setUser(user);
                udp.setDate(date);
                udp.setPointsCounted(dayPoints);
                udp.setQuestionsCounted(questions);
                udp.setLivesRemaining(ThreadLocalRandom.current().nextInt(20, 100));
                udp.setCurrentBook("Genesis");
                udpRepository.save(udp);
                count++;
            }
        }

        log.info("UDPSeeder: created {} daily progress records", count);
        return count;
    }

    public void clear() {
        List<User> testUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null
                        && (u.getEmail().endsWith("@biblequiz.test") || u.getEmail().endsWith("@dev.local")))
                .toList();
        for (User u : testUsers) {
            List<UserDailyProgress> records = udpRepository.findByUserIdOrderByDateDesc(u.getId());
            if (!records.isEmpty()) udpRepository.deleteAll(records);
        }
        log.info("UDPSeeder: cleared");
    }
}
