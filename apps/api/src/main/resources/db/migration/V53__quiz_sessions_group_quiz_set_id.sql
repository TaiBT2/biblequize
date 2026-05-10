-- BL-S5-1: Mastery hook foundation.
-- Link QuizSession to GroupQuizSet để completeSession() biết khi nào cần
-- invoke GroupQuizSetMasteryService.recordPracticeSession.
-- Q-A SAFE: chỉ dùng để enrich personal mastery; không touch leaderboard query.

ALTER TABLE quiz_sessions
  ADD COLUMN group_quiz_set_id VARCHAR(36) NULL,
  ADD CONSTRAINT fk_session_group_quiz_set
    FOREIGN KEY (group_quiz_set_id) REFERENCES group_quiz_sets(id) ON DELETE SET NULL;

CREATE INDEX idx_session_group_quiz_set ON quiz_sessions(group_quiz_set_id);
