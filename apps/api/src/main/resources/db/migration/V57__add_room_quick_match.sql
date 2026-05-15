-- QP-1 (2026-05-15) — Quick Match (Đấu Nhanh) BE support.
-- Ref: docs/todo/active/2026-05-15-multiplayer-quickmatch-pivot.md
--
-- quick_match flag: TRUE = Đấu Nhanh room (server soft-coordinates, no
-- Quản trò controls, any player can press Start when ≥2 ready). FALSE =
-- traditional Quản trò room.
--
-- ai_questions_payload: ephemeral JSON storing AI-generated questions
-- (one-shot pattern per Bùi pivot 2026-05-15 — AI questions DO NOT
-- persist to `questions` table). Game loads from this column on start;
-- R5 room cleanup purges it when room ENDED.

ALTER TABLE rooms
  ADD COLUMN quick_match BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN ai_questions_payload JSON NULL;

-- Partial-ish index for the "find open quick-match rooms" public list query.
-- MySQL 8 doesn't support partial WHERE indexes; tuple index is fine.
CREATE INDEX idx_rooms_quick_match_status
  ON rooms (quick_match, status, current_players);
