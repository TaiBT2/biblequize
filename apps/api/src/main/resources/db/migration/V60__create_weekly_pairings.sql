-- §7.7.1 — WeeklyPairing pre-computed book pairings per (season, week)
-- 4 mùa × 13 weeks = 52 rows seeded at app startup by WeeklyPairingService
-- Phase: FOUNDATION (week 1-4) / ACCELERATION (5-8) / CLIMAX (9-11) / MASTERY (12-13, empty book_codes)

CREATE TABLE weekly_pairings (
    id VARCHAR(36) PRIMARY KEY,
    season_id VARCHAR(36) NOT NULL,
    week_number INT NOT NULL,
    phase VARCHAR(16) NOT NULL,
    book_codes JSON NOT NULL,
    is_admin_override BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_season_week UNIQUE (season_id, week_number),
    CONSTRAINT ck_week_number CHECK (week_number BETWEEN 1 AND 13),
    CONSTRAINT ck_phase CHECK (phase IN ('FOUNDATION', 'ACCELERATION', 'CLIMAX', 'MASTERY')),
    CONSTRAINT fk_weekly_pairings_season FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    INDEX idx_weekly_pairings_season (season_id)
);
