-- LBF-5 (2026-06-19): per-user opt-out from the public leaderboard
-- (SPEC_USER §21 privacy — "leaderboard visibility"). Default TRUE keeps the
-- existing behaviour (every user with >0 points is listed); backfill on
-- existing rows is therefore a no-op semantically.
ALTER TABLE users
    ADD COLUMN leaderboard_visible BOOLEAN NOT NULL DEFAULT TRUE;
