-- V9: Fix question_reviews table schema (idempotent, MySQL 8.0 compatible)
-- 1. Drop FK to users.id only if it still exists
-- 2. Expand admin_id to hold email addresses (up to 255 chars)
-- 3. Add missing admin_email column only if it does not exist yet

-- Step 1: Conditionally drop FK using dynamic SQL (safe for any MySQL 8.0 version)
SET @_drop_fk = (
    SELECT IF(
        EXISTS (
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'question_reviews'
              AND CONSTRAINT_NAME = 'fk_qr_admin'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        ),
        'ALTER TABLE question_reviews DROP FOREIGN KEY fk_qr_admin',
        'SELECT 1'
    )
);
PREPARE _s1 FROM @_drop_fk;
EXECUTE _s1;
DEALLOCATE PREPARE _s1;

-- Step 2: Widen admin_id (safe no-op if already VARCHAR(255))
ALTER TABLE question_reviews
    MODIFY COLUMN admin_id VARCHAR(255) NOT NULL;

-- Step 3: Add admin_email only if the column does not exist yet
SET @_add_col = (
    SELECT IF(
        NOT EXISTS (
            SELECT 1 FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'question_reviews'
              AND COLUMN_NAME  = 'admin_email'
        ),
        'ALTER TABLE question_reviews ADD COLUMN admin_email VARCHAR(255) NULL AFTER admin_id',
        'SELECT 1'
    )
);
PREPARE _s2 FROM @_add_col;
EXECUTE _s2;
DEALLOCATE PREPARE _s2;

-- Step 4: Backfill admin_email from admin_id
UPDATE question_reviews SET admin_email = admin_id WHERE admin_email IS NULL;
