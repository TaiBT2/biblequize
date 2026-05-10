-- Sprint 5 (Quiz Set Professional) — V51
-- Personal Mastery tracking. Q-A SAFE: chỉ track personal stats, KHÔNG vào group leaderboard.
-- IDs là VARCHAR(36) UUID v7 (CLAUDE.md rule + Q-0 audit).
-- learned_question_ids JSON NOT NULL, không có DEFAULT literal (MySQL limitation) — entity Java init = new ArrayList<>().

CREATE TABLE group_quiz_set_mastery (
  id VARCHAR(36) PRIMARY KEY,
  quiz_set_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  learned_question_ids JSON NOT NULL,
  questions_learned INT NOT NULL DEFAULT 0,
  total_attempts INT NOT NULL DEFAULT 0,
  best_score INT NOT NULL DEFAULT 0,
  best_accuracy DECIMAL(5,2) NULL,
  last_practiced_at TIMESTAMP NULL,
  completed_mastery BOOLEAN NOT NULL DEFAULT FALSE,
  completed_mastery_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_quiz_user (quiz_set_id, user_id),
  CONSTRAINT fk_mastery_quiz FOREIGN KEY (quiz_set_id) REFERENCES group_quiz_sets(id) ON DELETE CASCADE,
  CONSTRAINT fk_mastery_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_mastery_user (user_id, completed_mastery)
);
