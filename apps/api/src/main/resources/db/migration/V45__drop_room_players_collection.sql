-- Drop the redundant Room.players @ElementCollection. The RoomPlayer entity
-- table (room_room_players) is the authoritative source of room membership,
-- and the parallel `room_players` collection had drifted out of sync (joins
-- inserting RoomPlayer rows but not updating room_players / current_players).
--
-- Backfill rooms.current_players from the actual RoomPlayer row count first
-- so any drifted rooms become startable, then drop the orphan table.

UPDATE rooms r
SET r.current_players = (
    SELECT COUNT(*) FROM room_room_players rrp WHERE rrp.room_id = r.id
);

DROP TABLE IF EXISTS room_players;
