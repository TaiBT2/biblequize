-- "Chơi cùng nhau" flag for rooms tied to a group quiz set.
-- Distinguishes co-play rooms (POST /api/groups/{id}/quiz-sets/{setId}/play)
-- from older SPEED_RACE rooms that used the same /play path for solo "Tự ôn".
-- Existing rows default FALSE → conservative, only newly-created co-play
-- rooms surface in the group's "Đang diễn ra" list.

ALTER TABLE rooms
  ADD COLUMN is_co_play BOOLEAN NOT NULL DEFAULT FALSE;
