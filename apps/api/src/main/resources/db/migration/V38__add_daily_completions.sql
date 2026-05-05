-- Persistent record of each daily challenge completion. The previous flow
-- only stored completion in Redis (48h TTL) which is enough for "did the
-- user finish today" guards but loses long-term history needed for the
-- redesigned page (30-day heatmap, yesterday recap).
--
-- One row per user per UTC date. Unique constraint enforces idempotency:
-- DailyChallengeService#markCompleted upserts so re-completing the same
-- day is a no-op at the DB level.

CREATE TABLE daily_completions (
    id                 VARCHAR(36)  NOT NULL,
    user_id            VARCHAR(36)  NOT NULL,
    completion_date    DATE         NOT NULL,
    score              INT          NOT NULL DEFAULT 0,
    correct_count      INT          NOT NULL DEFAULT 0,
    total_questions    INT          NOT NULL DEFAULT 5,
    time_seconds       INT          NULL,
    completed_at       DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_daily_completions_user_date (user_id, completion_date),
    KEY idx_daily_completions_date (completion_date),
    CONSTRAINT fk_daily_completions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
