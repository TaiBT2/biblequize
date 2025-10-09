-- Add missing core tables to align with JPA entities
-- This migration is idempotent via IF NOT EXISTS and safe to re-run

USE biblequiz;

-- auth_identities
CREATE TABLE IF NOT EXISTS auth_identities (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_provider_user (provider, provider_user_id),
    INDEX idx_ai_user (user_id),
    CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- quiz_sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id VARCHAR(36) PRIMARY KEY,
    mode ENUM('single','practice','ranked') NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    config JSON,
    status ENUM('created','in_progress','completed','cancelled') NOT NULL,
    score INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    INDEX idx_qs_owner (owner_id),
    INDEX idx_qs_status (status),
    CONSTRAINT fk_qs_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- quiz_session_questions
CREATE TABLE IF NOT EXISTS quiz_session_questions (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    order_index INT NOT NULL,
    reveal_at TIMESTAMP NULL,
    time_limit_sec INT DEFAULT 30,
    answered_at TIMESTAMP NULL,
    is_correct BOOLEAN,
    score_earned INT DEFAULT 0,
    INDEX idx_qsq_session (session_id),
    INDEX idx_qsq_question (question_id),
    CONSTRAINT fk_qsq_session FOREIGN KEY (session_id) REFERENCES quiz_sessions(id),
    CONSTRAINT fk_qsq_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- answers
CREATE TABLE IF NOT EXISTS answers (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    answer JSON NOT NULL,
    is_correct BOOLEAN NOT NULL,
    elapsed_ms INT NOT NULL,
    score_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ans_session (session_id),
    INDEX idx_ans_question (question_id),
    INDEX idx_ans_user (user_id),
    CONSTRAINT fk_ans_session FOREIGN KEY (session_id) REFERENCES quiz_sessions(id),
    CONSTRAINT fk_ans_question FOREIGN KEY (question_id) REFERENCES questions(id),
    CONSTRAINT fk_ans_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_bookmark_user_question (user_id, question_id),
    INDEX idx_bm_user (user_id),
    INDEX idx_bm_question (question_id),
    CONSTRAINT fk_bm_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_bm_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- feedback
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('report','question','general') NOT NULL,
    question_id VARCHAR(36) NULL,
    content TEXT NOT NULL,
    status ENUM('pending','in_progress','resolved','rejected') NOT NULL,
    handled_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fb_user (user_id),
    INDEX idx_fb_question (question_id),
    INDEX idx_fb_status (status),
    CONSTRAINT fk_fb_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_fb_question FOREIGN KEY (question_id) REFERENCES questions(id),
    CONSTRAINT fk_fb_handled_by FOREIGN KEY (handled_by) REFERENCES users(id)
);

-- user_daily_progress
CREATE TABLE IF NOT EXISTS user_daily_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    lives_remaining INT NOT NULL,
    questions_counted INT NOT NULL,
    points_counted INT NOT NULL,
    current_book VARCHAR(100) NOT NULL,
    current_book_index INT NOT NULL,
    current_difficulty ENUM('easy','medium','hard','all') NOT NULL,
    is_post_cycle BOOLEAN NOT NULL,
    last_updated_at TIMESTAMP NULL,
    UNIQUE KEY uk_udp_user_date (user_id, date),
    INDEX idx_udp_user (user_id),
    CONSTRAINT fk_udp_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- achievements
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    criteria TEXT NOT NULL,
    points INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ach_category (category),
    INDEX idx_ach_active (is_active)
);

-- user_achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    achievement_id VARCHAR(36) NOT NULL,
    unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id),
    INDEX idx_ua_user (user_id),
    INDEX idx_ua_achievement (achievement_id),
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

-- rooms
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(36) PRIMARY KEY,
    room_code VARCHAR(8) NOT NULL UNIQUE,
    room_name VARCHAR(100) NOT NULL,
    max_players INT NOT NULL,
    current_players INT NOT NULL,
    question_count INT NOT NULL,
    time_per_question INT NOT NULL,
    status ENUM('LOBBY','IN_PROGRESS','ENDED','CANCELLED') NOT NULL,
    host_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_status (status),
    INDEX idx_room_host (host_id),
    CONSTRAINT fk_room_host FOREIGN KEY (host_id) REFERENCES users(id)
);

-- room_players (ElementCollection from Room)
CREATE TABLE IF NOT EXISTS room_players (
    room_id VARCHAR(36) NOT NULL,
    player_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (room_id, player_id),
    CONSTRAINT fk_rp_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- room_room_players (RoomPlayer aggregate)
CREATE TABLE IF NOT EXISTS room_room_players (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    is_ready BOOLEAN NOT NULL,
    score INT NOT NULL,
    total_answered INT NOT NULL,
    correct_answers INT NOT NULL,
    average_reaction_time DOUBLE NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rrp_room (room_id),
    INDEX idx_rrp_user (user_id),
    CONSTRAINT fk_rrp_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_rrp_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- room_player_answers (ElementCollection map on RoomPlayer)
CREATE TABLE IF NOT EXISTS room_player_answers (
    room_player_id VARCHAR(36) NOT NULL,
    question_index INT NOT NULL,
    answer_data TEXT,
    PRIMARY KEY (room_player_id, question_index),
    CONSTRAINT fk_rpa_room_player FOREIGN KEY (room_player_id) REFERENCES room_room_players(id)
);


