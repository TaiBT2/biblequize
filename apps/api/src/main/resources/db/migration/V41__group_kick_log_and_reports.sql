-- V41: Group kick log + Group reports tables
--
-- Two SPEC v1.1 §15.2 implementation gaps in one migration:
--
-- 1. group_kick_log (GAP-L per SPEC §12.2): tracks when a member was kicked
--    so joinGroup can enforce a 7-day cooldown before they can rejoin.
--    Soft-history table — entries are kept even after the cooldown expires
--    for audit purposes.
--
-- 2. group_reports (GAP-M per SPEC §12.4 + §13.9 + §14.4): user-submitted
--    reports against a group for moderation. Status tracks admin workflow.

CREATE TABLE IF NOT EXISTS group_kick_log (
    id              VARCHAR(36) NOT NULL,
    group_id        VARCHAR(36) NOT NULL,
    kicked_user_id  VARCHAR(36) NOT NULL,
    kicked_by_id    VARCHAR(36) NOT NULL,
    reason          VARCHAR(500) NULL,
    kicked_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_kick_user_time (kicked_user_id, kicked_at),
    INDEX idx_kick_group (group_id, kicked_at),
    CONSTRAINT fk_kick_group FOREIGN KEY (group_id) REFERENCES church_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_kick_user FOREIGN KEY (kicked_user_id) REFERENCES users(id),
    CONSTRAINT fk_kick_by FOREIGN KEY (kicked_by_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_reports (
    id                VARCHAR(36) NOT NULL,
    group_id          VARCHAR(36) NOT NULL,
    reporter_user_id  VARCHAR(36) NOT NULL,
    reason            ENUM('SPAM','INAPPROPRIATE','HARASSMENT','OTHER') NOT NULL,
    note              TEXT NULL,
    status            ENUM('OPEN','REVIEWED','ACTIONED','DISMISSED') NOT NULL DEFAULT 'OPEN',
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at       TIMESTAMP NULL,
    reviewed_by_id    VARCHAR(36) NULL,
    PRIMARY KEY (id),
    INDEX idx_report_status (status, created_at),
    INDEX idx_report_group (group_id, created_at),
    CONSTRAINT fk_report_group FOREIGN KEY (group_id) REFERENCES church_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
