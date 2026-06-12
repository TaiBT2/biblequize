-- PlayerStatus.LEFT was added to the Java enum (mid-game disconnect, kept for rejoin)
-- but V10's ENUM column was never extended -> "Data truncated for column 'player_status'"
-- whenever RoomPresenceListener marks a player LEFT after the grace period,
-- silently breaking the LEFT->ACTIVE reconnect flow on MySQL (H2 tests don't enforce ENUM).
ALTER TABLE room_room_players
    MODIFY COLUMN player_status ENUM('ACTIVE','ELIMINATED','SPECTATOR','LEFT')
        NOT NULL DEFAULT 'ACTIVE';
