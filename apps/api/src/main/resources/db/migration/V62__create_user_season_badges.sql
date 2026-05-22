-- §7.1.8 — End-of-season Liturgical Coverage badges
-- One row per (user, season). Awarded by BadgeAwardScheduler after season end.
-- badge_tier VARCHAR+CHECK (not ENUM) — consistent with V60 weekly_pairings.phase

CREATE TABLE user_season_badges (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    season_id VARCHAR(36) NOT NULL,
    badge_tier VARCHAR(20) NOT NULL,
    books_covered INT NOT NULL,
    total_questions INT NOT NULL,
    accuracy INT NOT NULL,
    days_active INT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shown_to_user_at TIMESTAMP NULL,

    CONSTRAINT uk_badge_user_season UNIQUE (user_id, season_id),
    CONSTRAINT ck_badge_tier CHECK (badge_tier IN ('TOAN_THU', 'TAN_TAM', 'HANH_HUONG')),
    CONSTRAINT ck_badge_accuracy CHECK (accuracy BETWEEN 0 AND 100),
    CONSTRAINT fk_badge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_badge_season FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    INDEX idx_badge_user (user_id),
    INDEX idx_badge_awarded_at (awarded_at)
);
