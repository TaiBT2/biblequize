-- Re-write the seeded usernames with the proper UTF-8 charset session.
-- The earlier seed went through the Windows shell pipe which mangled UTF-8.
SET NAMES utf8mb4;

UPDATE users          SET name = 'An Nguyễn'  WHERE id = 'u-end-test-an';
UPDATE users          SET name = 'Chi Trần'   WHERE id = 'u-end-test-chi';
UPDATE users          SET name = 'Minh Lê'    WHERE id = 'u-end-test-minh';
UPDATE users          SET name = 'Linh Phạm'  WHERE id = 'u-end-test-linh';
UPDATE users          SET name = 'Hằng Vũ'    WHERE id = 'u-end-test-hang';

UPDATE room_room_players SET username = 'An Nguyễn'  WHERE id = 'rp-end-an';
UPDATE room_room_players SET username = 'Chi Trần'   WHERE id = 'rp-end-chi';
UPDATE room_room_players SET username = 'Minh Lê'    WHERE id = 'rp-end-minh';
UPDATE room_room_players SET username = 'Linh Phạm'  WHERE id = 'rp-end-linh';
UPDATE room_room_players SET username = 'Hằng Vũ'    WHERE id = 'rp-end-hang';

SELECT id, name FROM users WHERE id LIKE 'u-end-test-%';
