-- One-shot cleanup of orphan practice/single sessions stuck in_progress.
--
-- V16 added abandoned_at + last_activity_at columns but missed adding
-- 'abandoned' to the status ENUM, so SessionService.setStatus(abandoned)
-- has been silently failing. Fix that first, then sweep the orphans.

ALTER TABLE quiz_sessions
  MODIFY COLUMN status ENUM('created', 'in_progress', 'completed', 'cancelled', 'abandoned') NOT NULL DEFAULT 'created';

UPDATE quiz_sessions
SET status = 'abandoned',
    abandoned_at = NOW(),
    ended_at = NOW()
WHERE mode IN ('practice', 'single')
  AND status = 'in_progress';
