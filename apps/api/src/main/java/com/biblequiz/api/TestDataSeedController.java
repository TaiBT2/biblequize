package com.biblequiz.api;

import com.biblequiz.infrastructure.seed.SeedResult;
import com.biblequiz.infrastructure.seed.TestDataSeeder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/seed")
@PreAuthorize("hasRole('ADMIN')")
@Profile("!prod")
public class TestDataSeedController {

    @Autowired private TestDataSeeder seeder;

    @PostMapping("/test-data")
    public ResponseEntity<?> seedTestData(@RequestBody(required = false) Map<String, Object> body) {
        boolean reset = body != null && Boolean.TRUE.equals(body.get("reset"));
        SeedResult result = seeder.seedAll(reset);
        return ResponseEntity.ok(result.toMap());
    }

    @DeleteMapping("/test-data")
    public ResponseEntity<Void> clearTestData() {
        seeder.clearAllData();
        return ResponseEntity.noContent().build();
    }
}
