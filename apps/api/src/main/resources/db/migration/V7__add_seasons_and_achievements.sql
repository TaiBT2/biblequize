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

-- Achievement / Badge system
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(36) PRIMARY KEY,
    key_name VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(50),
    category VARCHAR(50) NOT NULL,
    threshold INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
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
    (UUID(), 'flame_7', 'Ngọn Lửa', 'Chơi 7 ngày liên tiếp', 'flame', 'streak', 7),
    (UUID(), 'scholar_10', 'Học Giả', 'Hoàn thành 10 sách Kinh Thánh', 'book', 'progress', 10),
    (UUID(), 'champion_3', 'Vô Địch', 'Đạt Top 1 daily 3 lần', 'crown', 'rank', 3),
    (UUID(), 'persistent_1000', 'Kiên Trì', 'Trả lời 1000 câu hỏi', 'target', 'participation', 1000),
    (UUID(), 'perfect_20', 'Hoàn Hảo', 'Đạt streak 20 liên tiếp', 'zap', 'streak', 20),
    (UUID(), 'elder', 'Trưởng Lão', 'Đạt tier Trưởng Lão', 'shield', 'tier', 8000),
    (UUID(), 'apostle', 'Sứ Đồ', 'Đạt tier Sứ Đồ', 'star', 'tier', 80000);
