package com.biblequiz.infrastructure;

import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Component
@Order(20)
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) {
        try {
            String adminsEnv = System.getenv("ADMIN_EMAILS");
            if (adminsEnv == null || adminsEnv.trim().isEmpty()) {
                logger.info("[ADMIN_BOOTSTRAP] No ADMIN_EMAILS provided; skipping.");
                return;
            }

            String[] emails = Arrays.stream(adminsEnv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toArray(String[]::new);

            if (emails.length == 0) {
                logger.info("[ADMIN_BOOTSTRAP] ADMIN_EMAILS parsed empty; skipping.");
                return;
            }

            for (String email : emails) {
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isEmpty()) {
                    logger.info("[ADMIN_BOOTSTRAP] User not found yet for email={}, will be promoted later via OAuth2 or manual.", email);
                    continue;
                }
                User user = userOpt.get();
                if (!"ADMIN".equals(user.getRole())) {
                    String oldRole = user.getRole();
                    user.setRole("ADMIN");
                    userRepository.save(user);
                    logger.info("[ADMIN_BOOTSTRAP] Promoted {} from {} to ADMIN", email, oldRole);
                } else {
                    logger.info("[ADMIN_BOOTSTRAP] {} already ADMIN", email);
                }
            }
        } catch (Exception e) {
            logger.error("[ADMIN_BOOTSTRAP] Failed to bootstrap admin users: {}", e.getMessage(), e);
        }
    }
}


