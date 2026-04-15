package com.biblequiz.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for {@code POST /api/admin/test/users/{userId}/seed-points}.
 *
 * <p>Wipes all existing {@code UserDailyProgress} rows for the user and creates
 * a single fresh row today with the requested {@code totalPoints}. Used by E2E
 * tests to pre-seed users at exact points thresholds (e.g. 4999 to test tier
 * boundary crossing with a single +1 XP action).
 *
 * <p>{@code @JsonIgnoreProperties(ignoreUnknown = false)} combined with the
 * {@code spring.jackson.deserialization.fail-on-unknown-properties=true}
 * setting in {@code application-dev.yml} causes unknown fields to be rejected
 * with HTTP 400 by {@link com.biblequiz.infrastructure.exception.GlobalExceptionHandler}.
 */
@JsonIgnoreProperties(ignoreUnknown = false)
public class SeedPointsRequest {

    /**
     * Target total points to seed. Max 200000 is well above tier 6 threshold
     * (100000) and allows headroom for prestige/post-max tests.
     */
    @NotNull
    @Min(0)
    @Max(200_000)
    private Integer totalPoints;

    public SeedPointsRequest() {}

    public SeedPointsRequest(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }
}
