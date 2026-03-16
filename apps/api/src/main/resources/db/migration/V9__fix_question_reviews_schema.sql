-- V9: Fix question_reviews table schema
-- 1. admin_id stores email (not UUID), so drop the FK to users.id
-- 2. Add missing admin_email column that QuestionReview entity expects
-- 3. Expand admin_id to hold email addresses (up to 255 chars)

ALTER TABLE question_reviews
    DROP FOREIGN KEY fk_qr_admin;

ALTER TABLE question_reviews
    MODIFY COLUMN admin_id VARCHAR(255) NOT NULL;

ALTER TABLE question_reviews
    ADD COLUMN admin_email VARCHAR(255) NULL AFTER admin_id;

-- Backfill admin_email from admin_id (they were stored as email)
UPDATE question_reviews SET admin_email = admin_id WHERE admin_email IS NULL;
