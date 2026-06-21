-- V70: Group Journey tables (BL-25 — Hành Trình Nhóm, group differentiator)
--
-- A journey = the whole group walking through one book/topic across N "weeks"
-- (chặng). Each week's checkpoint is a ScheduledQuiz (the only live async
-- primitive); progress is derived by aggregating ScheduledQuizAttempt via
-- scheduled_quiz_id. v1 stores NO per-user progress table — attempts are the
-- source of truth (lesson learned from Collective Growth which relied on a
-- dead solo-practice source).
--
-- D1: leader opens each week manually (week deadline = ScheduledQuiz deadline).
-- D2: "done" = an attempt exists (no %-gate). D3: ad-hoc scheduled quizzes
-- (no journey week) stay supported on the same infrastructure.

CREATE TABLE IF NOT EXISTS group_journeys (
    id            VARCHAR(36) NOT NULL,
    group_id      VARCHAR(36) NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT NULL,
    status        ENUM('DRAFT','ACTIVE','COMPLETED') NOT NULL DEFAULT 'DRAFT',
    created_by    VARCHAR(36) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    started_at    TIMESTAMP NULL,
    completed_at  TIMESTAMP NULL,
    PRIMARY KEY (id),
    INDEX idx_gj_group_status (group_id, status),
    CONSTRAINT fk_gj_group FOREIGN KEY (group_id) REFERENCES church_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_gj_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS group_journey_weeks (
    id                 VARCHAR(36) NOT NULL,
    journey_id         VARCHAR(36) NOT NULL,
    week_number        INT NOT NULL,
    title              VARCHAR(255) NOT NULL,
    quiz_set_id        VARCHAR(36) NOT NULL,
    scheduled_quiz_id  VARCHAR(36) NULL,
    status             ENUM('LOCKED','OPEN','ENDED') NOT NULL DEFAULT 'LOCKED',
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_gjw_journey_week (journey_id, week_number),
    INDEX idx_gjw_journey (journey_id),
    CONSTRAINT fk_gjw_journey FOREIGN KEY (journey_id) REFERENCES group_journeys(id) ON DELETE CASCADE,
    -- No cascade on quiz_set: quiz sets are soft-deleted, so this protects
    -- journey structure rather than blocking normal flows.
    CONSTRAINT fk_gjw_quizset FOREIGN KEY (quiz_set_id) REFERENCES group_quiz_sets(id),
    CONSTRAINT fk_gjw_scheduled FOREIGN KEY (scheduled_quiz_id) REFERENCES scheduled_quizzes(id) ON DELETE SET NULL
);
