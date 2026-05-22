package com.biblequiz.api;

import com.biblequiz.modules.coverage.entity.WeeklyPairing;
import com.biblequiz.modules.coverage.repository.WeeklyPairingRepository;
import com.biblequiz.modules.coverage.service.WeeklyPairingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin endpoint for Liturgical Coverage weekly pairing override (§7.3.4).
 * v1 ships endpoint-only — no UI (BL-COVERAGE-ADMIN-UI deferred to v1.5).
 */
@RestController
@RequestMapping("/api/admin/seasons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSeasonPairingController {

    private final WeeklyPairingService pairingService;
    private final WeeklyPairingRepository pairingRepository;

    public AdminSeasonPairingController(WeeklyPairingService pairingService,
                                        WeeklyPairingRepository pairingRepository) {
        this.pairingService = pairingService;
        this.pairingRepository = pairingRepository;
    }

    /** List all 13 pairings for a season, ordered by week_number ASC. */
    @GetMapping("/{seasonId}/pairings")
    public ResponseEntity<List<WeeklyPairing>> list(@PathVariable String seasonId) {
        return ResponseEntity.ok(pairingRepository.findBySeasonIdOrderByWeekNumberAsc(seasonId));
    }

    /**
     * Override the book list for a single week. Validates: 6 books (1-11) or
     * empty (12-13), all canonical, no duplicates. Marks
     * {@code is_admin_override = true} to skip future re-compute.
     */
    @PatchMapping("/{seasonId}/pairings/{weekNumber}")
    public ResponseEntity<WeeklyPairing> override(@PathVariable String seasonId,
                                                  @PathVariable int weekNumber,
                                                  @RequestBody OverrideRequest body) {
        WeeklyPairing updated = pairingService.overridePairing(seasonId, weekNumber, body.bookCodes());
        return ResponseEntity.ok(updated);
    }

    public record OverrideRequest(List<String> bookCodes) {}
}
