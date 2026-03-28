-- SPEC-v2: Add streak fields to users table
ALTER TABLE users ADD COLUMN current_streak INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_streak INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_played_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN streak_freeze_used_this_week BOOLEAN NOT NULL DEFAULT FALSE;

-- SPEC-v2: Update energy defaults (lives_remaining now means energy, default 100)
ALTER TABLE user_daily_progress ALTER COLUMN lives_remaining SET DEFAULT 100;
