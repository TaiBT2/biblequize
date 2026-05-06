-- V40: Scheduled Quiz tables (Feature B — Đặt lịch chơi)
--
-- Async group quiz with deadline. Members play up to max_attempts times,
-- highest score per user counts on the leaderboard. Scheduler cron freezes
-- the leaderboard + auto-creates a group announcement when deadline passes.
--
-- Snapshot question_ids at create time so quiz survives if the source
-- GroupQuizSet is later edited or deleted.

CREATE TABLE IF NOT EXISTS scheduled_quizzes (
    id                       VARCHAR(36) NOT NULL,
    group_id                 VARCHAR(36) NOT NULL,
    quiz_set_id              VARCHAR(36) NOT NULL,
    snapshot_question_ids    JSON NOT NULL,
    name                     VARCHAR(255) NOT NULL,
    description              TEXT NULL,
    deadline                 TIMESTAMP NOT NULL,
    status                   ENUM('ACTIVE','ENDED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    max_attempts             INT NOT NULL DEFAULT 3,
    is_leaderboard_public    BOOLEAN NOT NULL DEFAULT TRUE,
    send_notifications       BOOLEAN NOT NULL DEFAULT TRUE,
    noti_24h_sent_at         TIMESTAMP NULL,
    winner_user_id           VARCHAR(36) NULL,
    winner_score             INT NULL,
    created_by               VARCHAR(36) NOT NULL,
    created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at                 TIMESTAMP NULL,
    PRIMARY KEY (id),
    INDEX idx_sq_group_status (group_id, status, deadline),
    INDEX idx_sq_status_deadline (status, deadline),
    CONSTRAINT fk_sq_group FOREIGN KEY (group_id) REFERENCES church_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_sq_quizset FOREIGN KEY (quiz_set_id) REFERENCES group_quiz_sets(id) ON DELETE CASCADE,
    CONSTRAINT fk_sq_creator FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_sq_winner FOREIGN KEY (winner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS scheduled_quiz_attempts (
    id                  VARCHAR(36) NOT NULL,
    scheduled_quiz_id   VARCHAR(36) NOT NULL,
    user_id             VARCHAR(36) NOT NULL,
    attempt_number      INT NOT NULL,
    score               INT NOT NULL DEFAULT 0,
    correct_count       INT NOT NULL DEFAULT 0,
    total_questions     INT NOT NULL DEFAULT 0,
    time_seconds        INT NOT NULL DEFAULT 0,
    started_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_sqa_quiz_user_attempt (scheduled_quiz_id, user_id, attempt_number),
    INDEX idx_sqa_quiz_user (scheduled_quiz_id, user_id),
    INDEX idx_sqa_quiz_score (scheduled_quiz_id, score DESC),
    CONSTRAINT fk_sqa_quiz FOREIGN KEY (scheduled_quiz_id) REFERENCES scheduled_quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_sqa_user FOREIGN KEY (user_id) REFERENCES users(id)
);
