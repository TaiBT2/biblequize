package com.biblequiz.infrastructure.health;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

/**
 * Minimal Spring Boot Actuator-compatible health endpoint.
 *
 * <p>Spring Boot Actuator is intentionally NOT on the classpath (no new
 * dependency per project policy), yet an external uptime monitor polls
 * {@code /actuator/health} every few seconds. Without this it 404'd and was
 * logged at ERROR on every hit. This returns the Actuator JSON shape
 * ({@code {"status":"UP"}} / {@code "DOWN"}) with a matching status code so the
 * monitor is satisfied. Path is permitAll via {@code /actuator/**} in
 * SecurityConfig. The deep check stays at {@code /health}.
 */
@RestController
public class ActuatorHealthController {

    private final DataSource dataSource;

    public ActuatorHealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, String>> health() {
        boolean up;
        try (Connection c = dataSource.getConnection()) {
            up = c.isValid(2);
        } catch (Exception e) {
            up = false;
        }
        Map<String, String> body = Map.of("status", up ? "UP" : "DOWN");
        return up ? ResponseEntity.ok(body) : ResponseEntity.status(503).body(body);
    }
}
