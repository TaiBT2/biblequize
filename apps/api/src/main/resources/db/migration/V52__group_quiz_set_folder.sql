-- Sprint 5 (Quiz Set Professional) — V52
-- Folders để LEADER/MOD organize quiz sets ("Bài giảng 2026", "Sinh hoạt thiếu nhi").
-- IDs VARCHAR(36) UUID v7. Column `created_by` match GroupQuizSet.created_by pattern (không phải created_by_user_id).

CREATE TABLE group_quiz_set_folder (
  id VARCHAR(36) PRIMARY KEY,
  group_id VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_folder_group FOREIGN KEY (group_id) REFERENCES church_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_folder_creator FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_folder_group_order (group_id, display_order)
);

-- Add folder_id col to group_quiz_sets (moved from V50 vì FK target chưa tồn tại lúc đó).
-- ON DELETE SET NULL: xóa folder không xóa quiz sets, chỉ uncategorize.
ALTER TABLE group_quiz_sets
  ADD COLUMN folder_id VARCHAR(36) NULL,
  ADD CONSTRAINT fk_quiz_set_folder
    FOREIGN KEY (folder_id) REFERENCES group_quiz_set_folder(id) ON DELETE SET NULL;

CREATE INDEX idx_quiz_set_folder ON group_quiz_sets(folder_id);
