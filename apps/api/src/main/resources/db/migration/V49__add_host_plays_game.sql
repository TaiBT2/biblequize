-- Sprint 4: Host-Organizer separation (Quản trò không chơi)
-- TRUE  = legacy mode (host plays, default for existing rooms)
-- FALSE = Quản trò mode (Sprint 4+, default for new rooms set by RoomService)
ALTER TABLE rooms
  ADD COLUMN host_plays_game BOOLEAN NOT NULL DEFAULT TRUE
  COMMENT 'TRUE = legacy mode (host plays); FALSE = Quan tro mode (Sprint 4+)';
