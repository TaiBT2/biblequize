-- §7.10.3 / §5.6 — Liturgical season focus books for Climax phase + ×1.5 bonus
-- focus_books JSON array of canonical Bible book names (3-5 books per season)
-- Seeded by SeasonSeeder per quarter (Phục Sinh/Ngũ Tuần/Cảm Tạ/Giáng Sinh)
-- Default empty array for any rows added before seeder runs

ALTER TABLE seasons
    ADD COLUMN focus_books JSON NULL DEFAULT NULL;

-- Backfill existing rows to empty array (seeder will upsert correct values on next boot)
UPDATE seasons SET focus_books = JSON_ARRAY() WHERE focus_books IS NULL;
