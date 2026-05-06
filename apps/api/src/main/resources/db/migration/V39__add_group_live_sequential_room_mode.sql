-- V39: Add GROUP_LIVE_SEQUENTIAL to room mode enum (Feature A — Chơi cùng nhau)
--
-- Sequential format for group church-cell quiz: wait until all players answer,
-- then host (group leader/mod) manually advances to next question after discussion.
-- Distinct from SPEED_RACE which is real-time competitive.

ALTER TABLE rooms
    MODIFY COLUMN mode ENUM('SPEED_RACE','BATTLE_ROYALE','TEAM_VS_TEAM','SUDDEN_DEATH','GROUP_LIVE_SEQUENTIAL')
        NOT NULL DEFAULT 'SPEED_RACE';
