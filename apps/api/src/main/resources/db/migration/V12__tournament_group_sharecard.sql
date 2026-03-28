-- ==========================================
-- V12: Tournament, Church Group, Share Card
-- ==========================================

-- Tournament tables
CREATE TABLE IF NOT EXISTS tournaments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bracket_size INT NOT NULL DEFAULT 8,
    status VARCHAR(20) NOT NULL DEFAULT 'LOBBY',
    creator_id VARCHAR(36) NOT NULL,
    current_round INT NOT NULL DEFAULT 0,
    started_at DATETIME NULL,
    ended_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tournament_creator FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tournament_participants (
    id VARCHAR(36) PRIMARY KEY,
    tournament_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    seed INT NULL,
    eliminated BOOLEAN NOT NULL DEFAULT FALSE,
    final_rank INT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tp_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    CONSTRAINT fk_tp_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_tp_tournament_user UNIQUE (tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS tournament_matches (
    id VARCHAR(36) PRIMARY KEY,
    tournament_id VARCHAR(36) NOT NULL,
    round_number INT NOT NULL,
    match_index INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    winner_id VARCHAR(36) NULL,
    is_bye BOOLEAN NOT NULL DEFAULT FALSE,
    started_at DATETIME NULL,
    ended_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tm_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

CREATE TABLE IF NOT EXISTS tournament_match_participants (
    id VARCHAR(36) PRIMARY KEY,
    match_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    lives INT NOT NULL DEFAULT 3,
    score INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    total_answered INT NOT NULL DEFAULT 0,
    is_winner BOOLEAN NULL,
    CONSTRAINT fk_tmp_match FOREIGN KEY (match_id) REFERENCES tournament_matches(id),
    CONSTRAINT fk_tmp_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_tmp_match_user UNIQUE (match_id, user_id)
);

-- Church Group tables
CREATE TABLE IF NOT EXISTS church_groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    group_code VARCHAR(6) NOT NULL UNIQUE,
    description TEXT NULL,
    avatar_url VARCHAR(500) NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    max_members INT NOT NULL DEFAULT 200,
    member_count INT NOT NULL DEFAULT 0,
    leader_id VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cg_leader FOREIGN KEY (leader_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS group_members (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gm_group FOREIGN KEY (group_id) REFERENCES church_groups(id),
    CONSTRAINT fk_gm_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_gm_group_user UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_announcements (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ga_group FOREIGN KEY (group_id) REFERENCES church_groups(id),
    CONSTRAINT fk_ga_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS group_quiz_sets (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    question_ids JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gqs_group FOREIGN KEY (group_id) REFERENCES church_groups(id),
    CONSTRAINT fk_gqs_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Share Card table
CREATE TABLE IF NOT EXISTS share_cards (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL,
    reference_id VARCHAR(36) NOT NULL,
    image_url VARCHAR(500) NULL,
    view_count INT NOT NULL DEFAULT 0,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sc_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_tournament_status ON tournaments(status);
CREATE INDEX idx_tp_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tm_tournament_round ON tournament_matches(tournament_id, round_number);
CREATE INDEX idx_tmp_match ON tournament_match_participants(match_id);
CREATE INDEX idx_cg_code ON church_groups(group_code);
CREATE INDEX idx_gm_group ON group_members(group_id);
CREATE INDEX idx_gm_user ON group_members(user_id);
CREATE INDEX idx_ga_group ON group_announcements(group_id);
CREATE INDEX idx_sc_user ON share_cards(user_id);
CREATE INDEX idx_sc_type_ref ON share_cards(type, reference_id);
