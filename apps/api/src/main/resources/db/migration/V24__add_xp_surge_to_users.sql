-- Milestone Burst: XP surge for 2 hours when user hits 90% tier progress
ALTER TABLE users ADD COLUMN xp_surge_until DATETIME NULL;
