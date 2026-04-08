-- Prestige System: reset XP, keep cosmetics, earn prestige badges
ALTER TABLE users ADD COLUMN prestige_level INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN prestige_at JSON NULL;
ALTER TABLE users ADD COLUMN days_at_tier6 INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN tier6_reached_at DATETIME NULL;
