-- V10: Add game mode infrastructure for Sprint 4 multiplayer

-- 1. Thêm cột mode, is_public, started_at, ended_at vào rooms
ALTER TABLE rooms
    ADD COLUMN mode ENUM('SPEED_RACE','BATTLE_ROYALE','TEAM_VS_TEAM','SUDDEN_DEATH')
        NOT NULL DEFAULT 'SPEED_RACE' AFTER status,
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE AFTER mode,
    ADD COLUMN started_at TIMESTAMP NULL AFTER is_public,
    ADD COLUMN ended_at TIMESTAMP NULL AFTER started_at;

-- 2. Thêm cột team, player_status, final_rank, winning_streak vào room_room_players
ALTER TABLE room_room_players
    ADD COLUMN team ENUM('A','B') NULL AFTER is_ready,
    ADD COLUMN player_status ENUM('ACTIVE','ELIMINATED','SPECTATOR')
        NOT NULL DEFAULT 'ACTIVE' AFTER team,
    ADD COLUMN final_rank INT NULL AFTER player_status,
    ADD COLUMN winning_streak INT NOT NULL DEFAULT 0 AFTER final_rank;

-- 3. Bảng room_rounds (mỗi câu hỏi = 1 round)
CREATE TABLE IF NOT EXISTS room_rounds (
    id           VARCHAR(36) NOT NULL,
    room_id      VARCHAR(36) NOT NULL,
    round_no     INT NOT NULL,
    question_id  VARCHAR(36) NOT NULL,
    started_at   TIMESTAMP NULL,
    ended_at     TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_room_round (room_id, round_no),
    INDEX idx_rr_room (room_id),
    CONSTRAINT fk_rr_room     FOREIGN KEY (room_id)     REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_rr_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- 4. Bảng room_answers
CREATE TABLE IF NOT EXISTS room_answers (
    id            VARCHAR(36) NOT NULL,
    round_id      VARCHAR(36) NOT NULL,
    user_id       VARCHAR(36) NOT NULL,
    answer_index  TINYINT NOT NULL,
    is_correct    BOOLEAN NOT NULL,
    response_ms   INT NOT NULL,
    points_earned INT NOT NULL DEFAULT 0,
    answered_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ra_round_user (round_id, user_id),
    INDEX idx_ra_round (round_id),
    INDEX idx_ra_user  (user_id),
    CONSTRAINT fk_ra_round FOREIGN KEY (round_id) REFERENCES room_rounds(id) ON DELETE CASCADE,
    CONSTRAINT fk_ra_user  FOREIGN KEY (user_id)  REFERENCES users(id)
);

-- 5. Index bổ sung cho query public rooms
CREATE INDEX idx_rooms_mode_status ON rooms(mode, status);
