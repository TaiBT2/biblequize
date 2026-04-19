-- Record the exact moment the early-Ranked-unlock flag was first set,
-- so the frontend can detect a "just unlocked" event and fire a
-- celebration modal. Without this timestamp the FE can only see the
-- boolean flag and has no way to distinguish a fresh unlock from
-- subsequent visits — the celebration would either fire on every
-- visit (annoying) or never (no dopamine hit).
--
-- NULL ⇒ flag has never been set. Set atomically with
-- early_ranked_unlock = true in SessionService.updateEarlyRankedUnlockProgress.

ALTER TABLE users
    ADD COLUMN early_ranked_unlocked_at DATETIME NULL;
