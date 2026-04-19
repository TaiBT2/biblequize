-- Early Ranked unlock path: Tier-1 users who demonstrate ≥80% accuracy
-- over 10+ Practice answers bypass the 1,000 XP gate and immediately
-- unlock Ranked mode. XP threshold is NOT changed; only this orthogonal
-- flag is consulted by the Ranked gate in parallel with the tier check.
--
-- See DECISIONS.md 2026-04-19 "Early Ranked unlock via Practice accuracy"
-- and the Ranked gate in SessionService for how this flag is honored.

ALTER TABLE users
    ADD COLUMN early_ranked_unlock BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN practice_correct_count INT NOT NULL DEFAULT 0,
    ADD COLUMN practice_total_count INT NOT NULL DEFAULT 0;
