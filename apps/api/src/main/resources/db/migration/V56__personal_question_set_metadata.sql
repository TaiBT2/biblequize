-- PQS-1 (2026-05-14) — Personal Quiz Set parity Phase 1 MVP.
-- Mirror Sprint 5 metadata + publish workflow from group_quiz_sets (V50) onto question_sets.
-- Folders + AI hooks deferred to Phase 2.
--
-- Backfill strategy: existing rows default to PUBLISHED so CreateRoom keeps working;
-- new rows via Hibernate default to DRAFT (entity-level field default).

ALTER TABLE question_sets
  ADD COLUMN cover_image_url VARCHAR(500) NULL,
  ADD COLUMN tags JSON NULL,
  ADD COLUMN cover_scripture VARCHAR(100) NULL,
  ADD COLUMN author_note VARCHAR(1000) NULL,
  ADD COLUMN difficulty ENUM('EASY','MEDIUM','HARD','MIXED') NULL,
  ADD COLUMN estimated_duration_min INT NULL,
  ADD COLUMN suggested_mode VARCHAR(50) NULL,
  ADD COLUMN language VARCHAR(2) NOT NULL DEFAULT 'VI',
  ADD COLUMN publish_status ENUM('DRAFT','PUBLISHED','ARCHIVED','SOFT_DELETED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN published_at TIMESTAMP NULL;

-- Backfill published_at for pre-existing rows (all defaulted to PUBLISHED above).
UPDATE question_sets
SET published_at = COALESCE(updated_at, created_at)
WHERE published_at IS NULL;

-- Filter index for MySets list + CreateRoom PUBLISHED-only picker.
CREATE INDEX idx_question_sets_status ON question_sets(user_id, publish_status);
