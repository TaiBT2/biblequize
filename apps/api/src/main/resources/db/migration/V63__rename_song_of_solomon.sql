-- V63: Standardize "Song of Solomon" → "Song of Songs"
-- Source: FOCUS_BOOKS_AUDIT 2026-05-22 finding #1
--
-- IMPORTANT: questions table NOT included here. QuestionSeeder derives
-- deterministic UUIDs from (book, chapter, verseStart, verseEnd, language,
-- content) — book is part of the hash. Once the seed JSON book field changes,
-- the seeder self-heals: orphan-sweeps old "Song of Solomon" rows and seeds
-- new "Song of Songs" rows on next boot. A manual UPDATE of questions.book
-- here would only create churn.
--
-- HISTORY LOSS WARNING: the orphan sweep CASCADE-deletes user_question_history
-- rows referencing old "Song of Solomon" questions. Acceptable pre-launch
-- (few/no real users, small 8-chapter book). Post-launch book renames need a
-- UUID-preserving strategy — tracked in BL-QUESTION-RESEED-HISTORY-PRESERVATION.
--
-- Migration order: apply V63 (user data tables) → deploy app with updated
-- seed JSON → next boot QuestionSeeder syncs the questions table.

-- Pre-step: self-heal user_book_progress when missing.
-- Historically this table existed only via Hibernate ddl-auto on dev/test
-- machines — no migration ever created it. Prod (ddl-auto=none) hit a
-- crash loop here on 2026-05-23 because the UPDATE below referenced a
-- table Flyway had never built. Create-if-missing so V63 is reproducible
-- on a fresh DB and any other env that drifted off the entity schema.
-- Schema mirrors entity UserBookProgress.java.
CREATE TABLE IF NOT EXISTS user_book_progress (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    book VARCHAR(100) NOT NULL,
    answered_count INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    unique_question_ids JSON,
    PRIMARY KEY (id),
    KEY idx_ubp_user (user_id),
    KEY idx_ubp_user_book (user_id, book),
    CONSTRAINT fk_ubp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. user_book_progress — flat string column
UPDATE user_book_progress
SET book = 'Song of Songs'
WHERE book = 'Song of Solomon';

-- 2. user_season_coverage.book_coverage — JSON key rename, preserving the count
UPDATE user_season_coverage
SET book_coverage = JSON_SET(
        JSON_REMOVE(book_coverage, '$."Song of Solomon"'),
        '$."Song of Songs"',
        COALESCE(JSON_EXTRACT(book_coverage, '$."Song of Solomon"'), 0)
    )
WHERE JSON_EXTRACT(book_coverage, '$."Song of Solomon"') IS NOT NULL;

-- 3. weekly_pairings.book_codes — JSON array element rename
UPDATE weekly_pairings
SET book_codes = JSON_REPLACE(
        book_codes,
        JSON_UNQUOTE(JSON_SEARCH(book_codes, 'one', 'Song of Solomon')),
        'Song of Songs'
    )
WHERE JSON_SEARCH(book_codes, 'one', 'Song of Solomon') IS NOT NULL;

-- Verification (manual post-migration):
-- SELECT COUNT(*) FROM user_book_progress WHERE book = 'Song of Solomon';                                        -- expect 0
-- SELECT COUNT(*) FROM user_season_coverage WHERE JSON_EXTRACT(book_coverage, '$."Song of Solomon"') IS NOT NULL; -- expect 0
-- SELECT COUNT(*) FROM weekly_pairings WHERE JSON_SEARCH(book_codes, 'one', 'Song of Solomon') IS NOT NULL;       -- expect 0
