package com.biblequiz.load;

import org.springframework.boot.test.context.TestConfiguration;

/**
 * Load test configuration.
 * Previously used H2 in-memory DB, now uses Mockito (no DB needed).
 * Reason: H2 doesn't catch MySQL-specific bugs (JSON columns, RAND(), constraints).
 */
@TestConfiguration
public class LoadTestConfig {
    // Intentionally empty — tests use @ExtendWith(MockitoExtension.class)
}
