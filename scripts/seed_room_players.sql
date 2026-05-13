-- Seed 5 extra players into room 8a348fd7-... so the end screen
-- (QuizEndScreen + Podium) has a non-trivial scoreboard to render.
-- Adjust existing rows to give them realistic final ranks too.

START TRANSACTION;

-- 5 new users (avatars left null; QuizEndScreen falls back to initials)
INSERT INTO users (id, name, email, provider, role)
VALUES
  ('u-end-test-an',    'An Nguyễn',     'an.test@biblequiz.local',    'local', 'USER'),
  ('u-end-test-chi',   'Chi Trần',      'chi.test@biblequiz.local',   'local', 'USER'),
  ('u-end-test-minh',  'Minh Lê',       'minh.test@biblequiz.local',  'local', 'USER'),
  ('u-end-test-linh',  'Linh Phạm',     'linh.test@biblequiz.local',  'local', 'USER'),
  ('u-end-test-hang',  'Hằng Vũ',       'hang.test@biblequiz.local',  'local', 'USER');

-- Existing rows get realistic ranks
UPDATE room_room_players SET score = 198, correct_answers = 8, total_answered = 10, final_rank = 2
  WHERE room_id = '8a348fd7-2237-4a0e-ac10-18cb80e020a7' AND user_id = '82d6f99c-1b6e-4f0d-b1c2-1bee42b376fb';
UPDATE room_room_players SET score = 45,  correct_answers = 3, total_answered = 10, final_rank = 6
  WHERE room_id = '8a348fd7-2237-4a0e-ac10-18cb80e020a7' AND user_id = '642aac91-702f-412f-b0dc-0dfd61a2978d';

-- Insert the 5 new RoomPlayer rows. Final ranks 1, 3, 4, 5, 7.
INSERT INTO room_room_players (id, room_id, user_id, username, is_ready, player_status, final_rank, score, correct_answers, total_answered, average_reaction_time, joined_at)
VALUES
  ('rp-end-an',   '8a348fd7-2237-4a0e-ac10-18cb80e020a7', 'u-end-test-an',   'An Nguyễn',  1, 'ACTIVE', 1, 252, 9, 10, 2400, NOW()),
  ('rp-end-chi',  '8a348fd7-2237-4a0e-ac10-18cb80e020a7', 'u-end-test-chi',  'Chi Trần',   1, 'ACTIVE', 3, 156, 7, 10, 4100, NOW()),
  ('rp-end-minh', '8a348fd7-2237-4a0e-ac10-18cb80e020a7', 'u-end-test-minh', 'Minh Lê',    1, 'ACTIVE', 4, 124, 6, 10, 5300, NOW()),
  ('rp-end-linh', '8a348fd7-2237-4a0e-ac10-18cb80e020a7', 'u-end-test-linh', 'Linh Phạm',  1, 'ACTIVE', 5,  87, 5, 10, 7200, NOW()),
  ('rp-end-hang', '8a348fd7-2237-4a0e-ac10-18cb80e020a7', 'u-end-test-hang', 'Hằng Vũ',    1, 'ACTIVE', 7,  12, 1, 10, 9800, NOW());

UPDATE rooms SET current_players = 7, max_players = 8
  WHERE id = '8a348fd7-2237-4a0e-ac10-18cb80e020a7';

COMMIT;

SELECT username, score, correct_answers, total_answered, final_rank
FROM room_room_players
WHERE room_id = '8a348fd7-2237-4a0e-ac10-18cb80e020a7'
ORDER BY final_rank;
