-- Sprint 2.5 (L-1): allow RoomCleanupScheduler.purgeExpiredEndedRooms to
-- bulk-delete ENDED rooms older than the retention window.
--
-- Two FKs to rooms(id) blocked the delete because they were defined without
-- ON DELETE behaviour:
--   1. room_room_players.fk_room_player_room — player rows must die with the room.
--   2. challenges.fk_challenge_room          — challenge history is independent
--                                              of the room row, just unlink.
--
-- Other FKs already cascade (room_rounds, room_question_selections); they were
-- correct. The legacy `room_players` collection table was removed in V45.

ALTER TABLE room_room_players
    DROP FOREIGN KEY fk_room_player_room;
ALTER TABLE room_room_players
    ADD CONSTRAINT fk_room_player_room
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE challenges
    DROP FOREIGN KEY fk_challenge_room;
ALTER TABLE challenges
    ADD CONSTRAINT fk_challenge_room
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
