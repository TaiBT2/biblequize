-- F-api-12 / DECISIONS 2026-06-12: prestige used to zero points_counted on
-- every historical user_daily_progress row to reset the user's effective XP.
-- Since leaderboards aggregate those same rows by date range, this rewrote
-- past weekly/season standings and destroyed history irreversibly.
-- Prestige now records the ledger total at prestige time in this offset;
-- tier/progression read SUM(points_counted) - offset, the ledger stays intact.
ALTER TABLE users
    ADD COLUMN prestige_xp_offset INT NOT NULL DEFAULT 0 AFTER prestige_at;
