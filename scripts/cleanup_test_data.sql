-- Prod cleanup: remove test users, groups, rooms, sessions and all dependents.
-- Single transaction; on error nothing commits.
--
-- Note: MySQL forbids referencing the same TEMPORARY TABLE more than once per
-- statement, so we use direct subqueries against source tables. Slightly more
-- lookup work but identical correctness.

START TRANSACTION;

-- Convenience CTE-style filters as session vars wouldn't help here since we
-- need set semantics. We just inline the WHERE clauses.

SELECT 'PRE-CLEANUP COUNTS' AS phase;
SELECT 'test_users' AS tbl,
       (SELECT COUNT(*) FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local') AS n
UNION ALL SELECT 'test_groups',
       (SELECT COUNT(*) FROM church_groups WHERE description LIKE '%test seeder%' OR description LIKE '%Testing group%' OR description LIKE '%e2e test helper%')
UNION ALL SELECT 'test_rooms',
       (SELECT COUNT(*) FROM rooms WHERE host_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local'));

-- ============================================================
-- LEAF DELETES — tables with NO ACTION FK that must clear first
-- ============================================================

-- group_announcements
DELETE FROM group_announcements
 WHERE group_id IN (SELECT id FROM church_groups WHERE description LIKE '%test seeder%' OR description LIKE '%Testing group%' OR description LIKE '%e2e test helper%')
    OR author_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');

-- group_members
DELETE FROM group_members
 WHERE group_id IN (SELECT id FROM church_groups WHERE description LIKE '%test seeder%' OR description LIKE '%Testing group%' OR description LIKE '%e2e test helper%')
    OR user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');

-- group_quiz_sets
DELETE FROM group_quiz_sets
 WHERE group_id IN (SELECT id FROM church_groups WHERE description LIKE '%test seeder%' OR description LIKE '%Testing group%' OR description LIKE '%e2e test helper%')
    OR created_by IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');

-- challenges (room-related + user-related)
DELETE FROM challenges
 WHERE room_id IN (SELECT id FROM rooms WHERE host_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local'))
    OR challenger_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local')
    OR challenged_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');

-- room_room_players
DELETE FROM room_room_players
 WHERE room_id IN (SELECT id FROM rooms WHERE host_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local'))
    OR user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');

-- room_answers
DELETE FROM room_answers WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');

-- Standalone user tables (NO ACTION)
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM scheduled_quiz_attempts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM scheduled_quizzes
 WHERE created_by IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local')
    OR winner_user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM season_rankings WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM share_cards WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM tournament_match_participants WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM tournament_participants WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM tournaments WHERE creator_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM user_achievements WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM user_question_history WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM group_reports WHERE reporter_user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM group_kick_log
 WHERE kicked_by_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local')
    OR kicked_user_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');

-- ============================================================
-- AGGREGATE DELETES — parent rows. CASCADE handles their remaining children.
-- ============================================================

DELETE FROM rooms WHERE host_id IN (SELECT id FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local');
DELETE FROM church_groups WHERE description LIKE '%test seeder%' OR description LIKE '%Testing group%' OR description LIKE '%e2e test helper%';
DELETE FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local';

-- ============================================================
-- POST-CLEANUP COUNTS + RESIDUAL CHECK
-- ============================================================
SELECT 'POST-CLEANUP COUNTS' AS phase;
SELECT 'users' AS tbl, COUNT(*) AS n FROM users
UNION ALL SELECT 'church_groups',   COUNT(*) FROM church_groups
UNION ALL SELECT 'rooms',           COUNT(*) FROM rooms
UNION ALL SELECT 'quiz_sessions',   COUNT(*) FROM quiz_sessions
UNION ALL SELECT 'group_members',   COUNT(*) FROM group_members
UNION ALL SELECT 'user_question_history', COUNT(*) FROM user_question_history
UNION ALL SELECT 'tournaments',     COUNT(*) FROM tournaments;

SELECT 'RESIDUAL test users' AS check_type, COUNT(*) AS n
  FROM users WHERE email LIKE '%@biblequiz.test' OR email LIKE '%@dev.local'
UNION ALL SELECT 'RESIDUAL test groups',
  COUNT(*) FROM church_groups WHERE description LIKE '%test seeder%' OR description LIKE '%Testing group%' OR description LIKE '%e2e test helper%';

COMMIT;
