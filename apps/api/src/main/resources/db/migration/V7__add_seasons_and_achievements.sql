-- Season system
CREATE TABLE IF NOT EXISTS seasons (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_season_dates (start_date, end_date)
);

CREATE TABLE IF NOT EXISTS season_rankings (
    id VARCHAR(36) PRIMARY KEY,
    season_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    total_points INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    final_rank INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES seasons(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_season_user (season_id, user_id)
);

-- Achievement / Badge system — drop old schema if exists, recreate with new columns
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;

CREATE TABLE achievements (
    id VARCHAR(36) PRIMARY KEY,
    key_name VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(50),
    category VARCHAR(50) NOT NULL,
    threshold INT NOT NULL DEFAULT 0
);

CREATE TABLE user_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    achievement_id VARCHAR(36) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE KEY uk_user_achievement (user_id, achievement_id)
);

-- Seed default achievements
INSERT INTO achievements (id, key_name, name, description, icon, category, threshold) VALUES
    (UUID(), 'flame_7', 'Ngon Lua', 'Choi 7 ngay lien tiep', 'flame', 'streak', 7),
    (UUID(), 'scholar_10', 'Hoc Gia', 'Hoan thanh 10 sach Kinh Thanh', 'book', 'progress', 10),
    (UUID(), 'champion_3', 'Vo Dich', 'Dat Top 1 daily 3 lan', 'crown', 'rank', 3),
    (UUID(), 'persistent_1000', 'Kien Tri', 'Tra loi 1000 cau hoi', 'target', 'participation', 1000),
    (UUID(), 'perfect_20', 'Hoan Hao', 'Dat streak 20 lien tiep', 'zap', 'streak', 20),
    (UUID(), 'elder', 'Truong Lao', 'Dat tier Truong Lao', 'shield', 'tier', 8000),
    (UUID(), 'apostle', 'Su Do', 'Dat tier Su Do', 'star', 'tier', 80000);
