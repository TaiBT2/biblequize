-- Sprint 5 (Quiz Set Professional) — V50
-- Add metadata fields to group_quiz_sets.
-- Q-0 audit (2026-05-10): entity hiện chỉ có 5 cols (id, group, createdBy, name, questionIds, createdAt).
-- V50 phải ADD 20 cols mới: 5 baseline (drift fix) + 15 metadata Sprint 5.
-- folder_id moved to V52 vì FK target chưa tồn tại trong V50.

ALTER TABLE group_quiz_sets
  -- Baseline cols (drift fix vs SPEC v1.2 — entity thiếu hoàn toàn)
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN archived_at TIMESTAMP NULL,
  ADD COLUMN deleted_at TIMESTAMP NULL,
  ADD COLUMN total_questions INT NOT NULL DEFAULT 0,
  ADD COLUMN language VARCHAR(2) NOT NULL DEFAULT 'VI',
  -- Sprint 5 metadata
  ADD COLUMN description VARCHAR(500) NULL,
  ADD COLUMN cover_image_url VARCHAR(500) NULL,
  ADD COLUMN tags JSON NULL,
  ADD COLUMN cover_scripture VARCHAR(100) NULL,
  ADD COLUMN author_note VARCHAR(1000) NULL,
  ADD COLUMN difficulty ENUM('EASY','MEDIUM','HARD','MIXED') NULL,
  ADD COLUMN estimated_duration_min INT NULL,
  ADD COLUMN suggested_mode VARCHAR(50) NULL,
  ADD COLUMN play_count INT NOT NULL DEFAULT 0,
  ADD COLUMN average_rating DECIMAL(3,2) NULL,
  ADD COLUMN total_ratings INT NOT NULL DEFAULT 0,
  ADD COLUMN last_played_at TIMESTAMP NULL,
  ADD COLUMN publish_status ENUM('DRAFT','PUBLISHED','ARCHIVED','SOFT_DELETED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN published_at TIMESTAMP NULL;

-- Backfill total_questions từ JSON array length của question_ids.
UPDATE group_quiz_sets
SET total_questions = COALESCE(JSON_LENGTH(question_ids), 0)
WHERE total_questions = 0;

-- Backfill published_at = updated_at hoặc created_at (rows existing đã default PUBLISHED qua DEFAULT clause).
UPDATE group_quiz_sets
SET published_at = COALESCE(updated_at, created_at)
WHERE published_at IS NULL;

-- Indexes for filtering / sorting
CREATE INDEX idx_quiz_set_status ON group_quiz_sets(group_id, publish_status);
CREATE INDEX idx_quiz_set_play_count ON group_quiz_sets(play_count DESC);
-- idx_quiz_set_folder created in V52 sau khi col folder_id tồn tại.
