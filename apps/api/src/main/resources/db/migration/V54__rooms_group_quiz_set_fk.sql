-- AUDIT GAP 2: rooms.group_quiz_set_id has existed since V37 but had no FK / index.
-- Add FK with ON DELETE SET NULL (preserve room history when quiz set is deleted)
-- + index for fast quiz-set -> rooms lookups (e.g. listing rooms tied to a set).

-- Defensive: any orphaned references should be NULLed before adding FK so the
-- ALTER doesn't fail. Real-world prod runs may have rows pointing at sets that
-- were hard-deleted before the FK existed.
UPDATE rooms r
LEFT JOIN group_quiz_sets gqs ON r.group_quiz_set_id = gqs.id
SET r.group_quiz_set_id = NULL
WHERE r.group_quiz_set_id IS NOT NULL AND gqs.id IS NULL;

ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_group_quiz_set
  FOREIGN KEY (group_quiz_set_id) REFERENCES group_quiz_sets(id)
  ON DELETE SET NULL;

CREATE INDEX idx_rooms_group_quiz_set ON rooms(group_quiz_set_id);
