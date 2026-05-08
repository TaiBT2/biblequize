-- One-shot cleanup of orphan practice/single sessions stuck in_progress
-- forever (no /complete endpoint existed before this release).
--
-- Why: 112 in_progress practice rows existed in production with no way to
-- transition out — they will never be completed by the FE, and the new
-- abandonment scheduler will only catch them after 30 min of fake "inactivity"
-- which is fine going forward but slow. Mark them all abandoned now so they
-- enter the 30-day retention window starting today.
--
-- Safe: only touches mode IN (practice, single) AND status='in_progress'.
-- Ranked / multiplayer sessions untouched.

UPDATE quiz_sessions
SET status = 'abandoned',
    abandoned_at = NOW(),
    ended_at = NOW()
WHERE mode IN ('practice', 'single')
  AND status = 'in_progress';
