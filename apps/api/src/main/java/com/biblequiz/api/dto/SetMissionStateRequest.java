package com.biblequiz.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * Request body for POST /api/admin/test/users/{id}/set-mission-state.
 *
 * <p>Identifies missions by missionType (e.g. "answer_correct") within the given date
 * (defaults to today UTC if omitted). Null fields in each MissionUpdate are no-ops.
 */
public class SetMissionStateRequest {

    /** Target date for mission lookup. Defaults to today UTC if null. */
    private LocalDate date;

    /** List of per-mission updates. Must not be null or empty. */
    @NotNull(message = "missions list must not be null")
    @Valid
    private List<MissionUpdate> missions;

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public List<MissionUpdate> getMissions() { return missions; }
    public void setMissions(List<MissionUpdate> missions) { this.missions = missions; }

    /** Per-mission update entry. Null fields are treated as no-ops. */
    public static class MissionUpdate {

        /** The missionType string stored in DailyMission.missionType (e.g. "answer_correct"). */
        @NotBlank(message = "missionType must not be blank")
        private String missionType;

        /** Set progress counter. Must be >= 0. */
        @Min(value = 0, message = "progress must be >= 0")
        private Integer progress;

        /** Override completed flag. */
        private Boolean completed;

        /** Override bonusClaimed flag. */
        private Boolean bonusClaimed;

        public String getMissionType() { return missionType; }
        public void setMissionType(String missionType) { this.missionType = missionType; }

        public Integer getProgress() { return progress; }
        public void setProgress(Integer progress) { this.progress = progress; }

        public Boolean getCompleted() { return completed; }
        public void setCompleted(Boolean completed) { this.completed = completed; }

        public Boolean getBonusClaimed() { return bonusClaimed; }
        public void setBonusClaimed(Boolean bonusClaimed) { this.bonusClaimed = bonusClaimed; }
    }
}
