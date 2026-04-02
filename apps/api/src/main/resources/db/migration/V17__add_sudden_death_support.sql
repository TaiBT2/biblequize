-- FIX-004: Sudden Death tie-break support for tournament matches
ALTER TABLE tournament_matches ADD COLUMN is_sudden_death BOOLEAN NOT NULL DEFAULT FALSE AFTER is_bye;
ALTER TABLE tournament_matches ADD COLUMN sudden_death_round INT NOT NULL DEFAULT 0 AFTER is_sudden_death;
ALTER TABLE tournament_match_participants ADD COLUMN total_elapsed_ms BIGINT NOT NULL DEFAULT 0 AFTER total_answered;
