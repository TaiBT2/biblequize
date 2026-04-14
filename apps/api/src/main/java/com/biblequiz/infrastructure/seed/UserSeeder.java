package com.biblequiz.infrastructure.seed;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Seeds test users for dev/staging environments.
 *
 * ⚠️ WARNING: This class is guarded by @Profile("!prod") and MUST NOT run in production.
 * Tier test users (test1-6@dev.local) use a hardcoded password for E2E automation — never
 * add these credentials to any environment other than dev/staging.
 */
@Component
@Profile("!prod")
public class UserSeeder {

    private static final Logger log = LoggerFactory.getLogger(UserSeeder.class);
    public static final String TAG = "test-seeder";

    // ⚠️ Hardcoded only for dev/staging E2E test automation. Never use in production.
    static final String TIER_TEST_PASSWORD = "Test@123456";

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    public int seed() {
        if (userRepository.findByEmail("admin@biblequiz.test").isPresent()) {
            log.info("UserSeeder: already seeded, skipping");
            return 0;
        }

        List<User> users = new ArrayList<>();

        users.add(makeUser("Admin Chính", "admin@biblequiz.test", "ADMIN", 42, 50));
        users.add(makeUser("Mod Nội Dung", "mod@biblequiz.test", "ADMIN", 15, 20));
        users.add(makeUser("Mục Sư Minh", "mucsu.minh@biblequiz.test", "USER", 30, 35));
        users.add(makeUser("Chị Hương", "huong@biblequiz.test", "USER", 22, 28));

        users.add(makeUser("Nguyễn Văn An", "an@biblequiz.test", "USER", 100, 105));
        users.add(makeUser("Trần Thị Bình", "binh@biblequiz.test", "USER", 60, 65));
        users.add(makeUser("Lê Minh Châu", "chau@biblequiz.test", "USER", 35, 40));
        users.add(makeUser("Phạm Đức", "duc@biblequiz.test", "USER", 14, 18));
        users.add(makeUser("Hoàng Thị Em", "em@biblequiz.test", "USER", 7, 10));
        users.add(makeUser("Võ Văn Phú", "phu@biblequiz.test", "USER", 3, 5));
        users.add(makeUser("Đặng Gia Huy", "huy@biblequiz.test", "USER", 28, 32));
        users.add(makeUser("Bùi Thị Kim", "kim@biblequiz.test", "USER", 55, 60));
        users.add(makeUser("Ngô Quốc Long", "long@biblequiz.test", "USER", 12, 15));
        users.add(makeUser("Trịnh Thị Mai", "mai@biblequiz.test", "USER", 5, 8));
        users.add(makeUser("Phan Văn Nam", "nam@biblequiz.test", "USER", 75, 80));
        users.add(makeUser("Lý Thị Oanh", "oanh@biblequiz.test", "USER", 40, 45));
        users.add(makeUser("Đỗ Quang Phong", "phong@biblequiz.test", "USER", 90, 95));
        users.add(makeUser("Hà Thanh Quân", "quan@biblequiz.test", "USER", 18, 22));
        users.add(makeUser("Vũ Thị Rồng", "rong@biblequiz.test", "USER", 1, 2));

        User banned = makeUser("Bị Cấm", "banned@biblequiz.test", "USER", 0, 3);
        banned.setIsBanned(true);
        banned.setBanReason("Spam feedback liên tục");
        banned.setBannedAt(LocalDateTime.now().minusDays(5));
        users.add(banned);

        // Tier test users for E2E automation — password: Test@123456 (dev/staging only)
        users.add(makeTierUser("Test Tier 1", "test1@dev.local", 0, 0));
        users.add(makeTierUser("Test Tier 2", "test2@dev.local", 5, 7));
        users.add(makeTierUser("Test Tier 3", "test3@dev.local", 12, 15));
        users.add(makeTierUser("Test Tier 4", "test4@dev.local", 30, 35));
        users.add(makeTierUser("Test Tier 5", "test5@dev.local", 60, 65));
        users.add(makeTierUser("Test Tier 6", "test6@dev.local", 90, 100));

        userRepository.saveAll(users);
        log.info("UserSeeder: created {} users", users.size());
        return users.size();
    }

    public void clear() {
        List<User> testUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null
                        && (u.getEmail().endsWith("@biblequiz.test") || u.getEmail().endsWith("@dev.local")))
                .toList();
        if (!testUsers.isEmpty()) {
            userRepository.deleteAll(testUsers);
            log.info("UserSeeder: cleared {} test users", testUsers.size());
        }
    }

    private User makeTierUser(String name, String email, int streak, int longestStreak) {
        User u = new User(UUID.randomUUID().toString(), name, email, "local");
        u.setRole("USER");
        u.setPasswordHash(passwordEncoder.encode(TIER_TEST_PASSWORD));
        u.setCurrentStreak(streak);
        u.setLongestStreak(longestStreak);
        u.setLastPlayedAt(randomRecent(7));
        return u;
    }

    private User makeUser(String name, String email, String role, int streak, int longestStreak) {
        User u = new User(UUID.randomUUID().toString(), name, email, "local");
        u.setRole(role);
        u.setCurrentStreak(streak);
        u.setLongestStreak(longestStreak);
        u.setLastPlayedAt(randomRecent(30));
        return u;
    }

    static LocalDateTime randomRecent(int withinDays) {
        long daysAgo = ThreadLocalRandom.current().nextLong(0, withinDays);
        long hours = ThreadLocalRandom.current().nextLong(0, 24);
        return LocalDateTime.now().minusDays(daysAgo).minusHours(hours);
    }

    static LocalDateTime randomPast(int minDays, int maxDays) {
        long days = ThreadLocalRandom.current().nextLong(minDays, maxDays);
        return LocalDateTime.now().minusDays(days);
    }
}
