-- Fix double-encoded UTF-8 data — already applied manually via mysql CLI.
-- This migration is intentionally empty to mark it as completed in Flyway history.
-- Original fix: CONVERT(CONVERT(CONVERT(col USING utf8mb4) USING latin1) USING utf8mb4)
-- Applied to: books.name_vi, questions.content/explanation/correct_answer_text/options/book/source
SELECT 1;
