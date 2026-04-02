-- FIX-002: Support abandoned session detection and energy penalty
-- When a user disconnects/closes app during a ranked quiz, the session
-- should be marked as abandoned and unanswered questions should deduct energy.

ALTER TABLE quiz_sessions ADD COLUMN abandoned_at TIMESTAMP NULL AFTER ended_at;
ALTER TABLE quiz_sessions ADD COLUMN last_activity_at TIMESTAMP NULL AFTER abandoned_at;

-- Status: 'active' | 'completed' | 'abandoned'
-- abandoned_at is set when session times out (2 min no activity in ranked mode)
