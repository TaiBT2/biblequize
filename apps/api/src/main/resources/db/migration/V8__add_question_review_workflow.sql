-- V8: Add question review workflow
-- AI-generated questions start as PENDING and require 2 admin approvals to become ACTIVE

ALTER TABLE questions
    ADD COLUMN review_status ENUM('PENDING', 'ACTIVE', 'REJECTED') NOT NULL DEFAULT 'ACTIVE' AFTER is_active,
    ADD COLUMN approvals_count INT NOT NULL DEFAULT 0 AFTER review_status;

-- All existing questions are already active
UPDATE questions SET review_status = 'ACTIVE', approvals_count = 2;

CREATE TABLE question_reviews (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    question_id   VARCHAR(36)  NOT NULL,
    admin_id      VARCHAR(36)  NOT NULL,
    action        ENUM('APPROVE', 'REJECT') NOT NULL,
    comment       TEXT,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qr_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_admin    FOREIGN KEY (admin_id)    REFERENCES users (id)     ON DELETE CASCADE,
    CONSTRAINT uq_admin_review UNIQUE (question_id, admin_id)
);

CREATE INDEX idx_questions_review_status ON questions (review_status);
