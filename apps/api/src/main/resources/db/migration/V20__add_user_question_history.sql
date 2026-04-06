-- Smart Question Selection: track which questions each user has seen/answered
CREATE TABLE user_question_history (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    times_seen INT NOT NULL DEFAULT 1,
    times_correct INT NOT NULL DEFAULT 0,
    times_wrong INT NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_correct_at TIMESTAMP NULL,
    last_wrong_at TIMESTAMP NULL,
    next_review_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_uqh_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_uqh_question FOREIGN KEY (question_id) REFERENCES questions(id),
    CONSTRAINT uk_user_question UNIQUE (user_id, question_id),

    INDEX idx_uqh_user_last_seen (user_id, last_seen_at),
    INDEX idx_uqh_user_next_review (user_id, next_review_at)
);
