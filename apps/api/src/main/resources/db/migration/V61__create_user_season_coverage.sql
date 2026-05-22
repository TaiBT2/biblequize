-- §7.7.2 — Per-user Liturgical Coverage tracking
-- 1 row per (user_id, season_id). Lazy-created on first Ranked session post-launch.
-- Coverage threshold: ≥4 answered questions per book (§7.1.4)

CREATE TABLE user_season_coverage (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    season_id VARCHAR(36) NOT NULL,

    current_week INT NOT NULL DEFAULT 1,
    weeks_completed JSON NOT NULL,
    book_coverage JSON NOT NULL,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    CONSTRAINT uk_user_season UNIQUE (user_id, season_id),
    CONSTRAINT ck_current_week CHECK (current_week BETWEEN 1 AND 13),
    CONSTRAINT fk_coverage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_coverage_season FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    INDEX idx_coverage_user (user_id),
    INDEX idx_coverage_season (season_id)
);
