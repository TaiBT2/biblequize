package com.biblequiz.infrastructure.feature;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Feature flag resolution per SPEC_USER_v3.2 §7.9.1. v1 is property-driven
 * (no DB table) — simple global toggle + percentage rollout via stable
 * userId hash modulo.
 *
 * <p>Configuration (application.yml / env vars):
 * <pre>
 * app:
 *   features:
 *     liturgical-coverage:
 *       enabled: false       # global kill switch
 *       rollout-percent: 0   # 0..100, only consulted when enabled=true
 * </pre>
 *
 * <p>Hash-based rollout: same userId always lands in the same bucket, so a
 * user does not flip between old/new logic between requests. To force a
 * specific user into the new flow during QA, set rollout-percent=100 and
 * use a test account.</p>
 */
@Service
public class FeatureFlagService {

    private final boolean liturgicalCoverageEnabled;
    private final int liturgicalCoverageRolloutPercent;

    public FeatureFlagService(
            @Value("${app.features.liturgical-coverage.enabled:false}") boolean liturgicalCoverageEnabled,
            @Value("${app.features.liturgical-coverage.rollout-percent:0}") int liturgicalCoverageRolloutPercent) {
        this.liturgicalCoverageEnabled = liturgicalCoverageEnabled;
        int clamped = Math.max(0, Math.min(100, liturgicalCoverageRolloutPercent));
        this.liturgicalCoverageRolloutPercent = clamped;
    }

    /**
     * True if the user is in the Liturgical Coverage rollout bucket.
     * Returns false if globally disabled OR userId is null.
     */
    public boolean isLiturgicalCoverageEnabled(String userId) {
        if (!liturgicalCoverageEnabled) return false;
        if (liturgicalCoverageRolloutPercent >= 100) return true;
        if (liturgicalCoverageRolloutPercent <= 0) return false;
        if (userId == null || userId.isEmpty()) return false;
        // Stable bucket: Math.floorMod(userId.hashCode(), 100) in [0, 99]
        int bucket = Math.floorMod(userId.hashCode(), 100);
        return bucket < liturgicalCoverageRolloutPercent;
    }
}
