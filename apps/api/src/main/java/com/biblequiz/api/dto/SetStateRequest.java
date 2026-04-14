package com.biblequiz.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

/**
 * Whitelist DTO for POST /api/admin/test/users/{id}/set-state.
 * All fields are nullable — only non-null fields are applied (partial update).
 *
 * <p>Unknown fields are rejected with HTTP 400 ("Field 'xxx' is not allowed").
 * This is enforced by {@code @JsonIgnoreProperties(ignoreUnknown = false)} combined
 * with {@code spring.jackson.deserialization.fail-on-unknown-properties=true} in dev/staging profiles.
 */
@JsonIgnoreProperties(ignoreUnknown = false)
public class SetStateRequest {

    /** Energy (livesRemaining) for today's session. Range: 0–100. */
    @Min(value = 0, message = "livesRemaining must be >= 0")
    @Max(value = 100, message = "livesRemaining must be <= 100")
    private Integer livesRemaining;

    /** Questions answered today (towards daily cap of 100). Range: 0–200. */
    @Min(value = 0, message = "questionsCounted must be >= 0")
    @Max(value = 200, message = "questionsCounted must be <= 200")
    private Integer questionsCounted;

    /** Days the user has been at Tier 6 (prestige eligibility at 30). Range: 0–30. */
    @Min(value = 0, message = "daysAtTier6 must be >= 0")
    @Max(value = 30, message = "daysAtTier6 must be <= 30")
    private Integer daysAtTier6;

    /** Override User.lastPlayedAt — must not be a future date. */
    @PastOrPresent(message = "lastPlayedAt must not be in the future")
    private LocalDate lastPlayedAt;

    /**
     * Set User.xpSurgeUntil relative to now.
     * {@code 0} = clear surge (set to null). {@code null} = no-op.
     * Range: 0–72 hours.
     */
    @Min(value = 0, message = "xpSurgeHoursFromNow must be >= 0")
    @Max(value = 72, message = "xpSurgeHoursFromNow must be <= 72")
    private Integer xpSurgeHoursFromNow;

    public Integer getLivesRemaining() { return livesRemaining; }
    public void setLivesRemaining(Integer livesRemaining) { this.livesRemaining = livesRemaining; }

    public Integer getQuestionsCounted() { return questionsCounted; }
    public void setQuestionsCounted(Integer questionsCounted) { this.questionsCounted = questionsCounted; }

    public Integer getDaysAtTier6() { return daysAtTier6; }
    public void setDaysAtTier6(Integer daysAtTier6) { this.daysAtTier6 = daysAtTier6; }

    public LocalDate getLastPlayedAt() { return lastPlayedAt; }
    public void setLastPlayedAt(LocalDate lastPlayedAt) { this.lastPlayedAt = lastPlayedAt; }

    public Integer getXpSurgeHoursFromNow() { return xpSurgeHoursFromNow; }
    public void setXpSurgeHoursFromNow(Integer xpSurgeHoursFromNow) { this.xpSurgeHoursFromNow = xpSurgeHoursFromNow; }
}
