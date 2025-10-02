-- Bible Quiz Database Schema
-- V1: Initial tables for core functionality

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url VARCHAR(500),
    provider VARCHAR(50) NOT NULL DEFAULT 'local',
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_provider (provider)
);

-- Auth identities for OAuth2
CREATE TABLE auth_identities (
    id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_provider_user (provider, provider_user_id),
    INDEX idx_user_id (user_id)
);

-- Books of the Bible
CREATE TABLE books (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    testament VARCHAR(20) NOT NULL, -- OLD, NEW
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_name (name),
    INDEX idx_testament (testament),
    INDEX idx_order (order_index)
);

-- Questions table
CREATE TABLE questions (
    id VARCHAR(36) PRIMARY KEY,
    book VARCHAR(100) NOT NULL,
    chapter INT,
    verse_start INT,
    verse_end INT,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    type ENUM('multiple_choice_single', 'multiple_choice_multi', 'true_false', 'fill_in_blank') NOT NULL,
    content TEXT NOT NULL,
    options JSON,
    correct_answer JSON NOT NULL,
    explanation TEXT,
    tags JSON,
    source VARCHAR(255),
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_book_chapter (book, chapter),
    INDEX idx_difficulty (difficulty),
    INDEX idx_type (type),
    INDEX idx_language (language),
    INDEX idx_is_active (is_active)
);

-- Quiz sessions
CREATE TABLE quiz_sessions (
    id VARCHAR(36) PRIMARY KEY,
    mode ENUM('single', 'practice', 'ranked') NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    config JSON,
    status ENUM('created', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'created',
    score INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner_id (owner_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Quiz session questions
CREATE TABLE quiz_session_questions (
    id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL,
        question_id VARCHAR(36) NOT NULL,
    order_index INT NOT NULL,
    reveal_at TIMESTAMP NULL,
    time_limit_sec INT DEFAULT 30,
    answered_at TIMESTAMP NULL,
    is_correct BOOLEAN NULL,
    score_earned INT DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_question_id (question_id),
    INDEX idx_order (session_id, order_index)
);

-- Answers
CREATE TABLE answers (
    id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL,
        question_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
    answer JSON NOT NULL,
    is_correct BOOLEAN NOT NULL,
    elapsed_ms INT NOT NULL,
    score_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_session_question_user (session_id, question_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- User daily progress for ranked mode
CREATE TABLE user_daily_progress (
    id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    lives_remaining INT NOT NULL DEFAULT 10,
    questions_counted INT NOT NULL DEFAULT 0,
    points_counted INT NOT NULL DEFAULT 0,
    current_book VARCHAR(100) NOT NULL DEFAULT 'Genesis',
    current_book_index INT NOT NULL DEFAULT 0,
    current_difficulty ENUM('easy', 'medium', 'hard', 'all') NOT NULL DEFAULT 'all',
    is_post_cycle BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_date (user_id, date),
    INDEX idx_date (date)
);

-- Feedback
CREATE TABLE feedback (
    id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
    type ENUM('report', 'question', 'general') NOT NULL,
    question_id VARCHAR(36) NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
        handled_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type)
);

-- Bookmarks
CREATE TABLE bookmarks (
    id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        question_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_question (user_id, question_id),
    INDEX idx_user_id (user_id)
);

-- Insert default books
INSERT INTO books (id, name, name_vi, testament, order_index) VALUES
-- Old Testament
('01', 'Genesis', 'Sáng Thế Ký', 'OLD', 1),
('02', 'Exodus', 'Xuất Ê-díp-tô Ký', 'OLD', 2),
('03', 'Leviticus', 'Lê-vi Ký', 'OLD', 3),
('04', 'Numbers', 'Dân Số Ký', 'OLD', 4),
('05', 'Deuteronomy', 'Phục Truyền Luật Lệ Ký', 'OLD', 5),
('06', 'Joshua', 'Giô-suê', 'OLD', 6),
('07', 'Judges', 'Các Quan Xét', 'OLD', 7),
('08', 'Ruth', 'Ru-tơ', 'OLD', 8),
('09', '1 Samuel', '1 Sa-mu-ên', 'OLD', 9),
('10', '2 Samuel', '2 Sa-mu-ên', 'OLD', 10),
('11', '1 Kings', '1 Các Vua', 'OLD', 11),
('12', '2 Kings', '2 Các Vua', 'OLD', 12),
('13', '1 Chronicles', '1 Sử Ký', 'OLD', 13),
('14', '2 Chronicles', '2 Sử Ký', 'OLD', 14),
('15', 'Ezra', 'Ê-xơ-ra', 'OLD', 15),
('16', 'Nehemiah', 'Nê-hê-mi', 'OLD', 16),
('17', 'Esther', 'Ê-xơ-tê', 'OLD', 17),
('18', 'Job', 'Gióp', 'OLD', 18),
('19', 'Psalms', 'Thi Thiên', 'OLD', 19),
('20', 'Proverbs', 'Châm Ngôn', 'OLD', 20),
('21', 'Ecclesiastes', 'Truyền Đạo', 'OLD', 21),
('22', 'Song of Songs', 'Nhã Ca', 'OLD', 22),
('23', 'Isaiah', 'Ê-sai', 'OLD', 23),
('24', 'Jeremiah', 'Giê-rê-mi', 'OLD', 24),
('25', 'Lamentations', 'Ca Thương', 'OLD', 25),
('26', 'Ezekiel', 'Ê-xê-chi-ên', 'OLD', 26),
('27', 'Daniel', 'Đa-ni-ên', 'OLD', 27),
('28', 'Hosea', 'Ô-sê', 'OLD', 28),
('29', 'Joel', 'Giô-ên', 'OLD', 29),
('30', 'Amos', 'A-mốt', 'OLD', 30),
('31', 'Obadiah', 'Áp-đia', 'OLD', 31),
('32', 'Jonah', 'Giô-na', 'OLD', 32),
('33', 'Micah', 'Mi-chê', 'OLD', 33),
('34', 'Nahum', 'Na-hum', 'OLD', 34),
('35', 'Habakkuk', 'Ha-ba-cúc', 'OLD', 35),
('36', 'Zephaniah', 'Sô-phô-ni', 'OLD', 36),
('37', 'Haggai', 'A-ghê', 'OLD', 37),
('38', 'Zechariah', 'Xa-cha-ri', 'OLD', 38),
('39', 'Malachi', 'Ma-la-chi', 'OLD', 39),

-- New Testament
('40', 'Matthew', 'Ma-thi-ơ', 'NEW', 40),
('41', 'Mark', 'Mác', 'NEW', 41),
('42', 'Luke', 'Lu-ca', 'NEW', 42),
('43', 'John', 'Giăng', 'NEW', 43),
('44', 'Acts', 'Công Vụ Các Sứ Đồ', 'NEW', 44),
('45', 'Romans', 'Rô-ma', 'NEW', 45),
('46', '1 Corinthians', '1 Cô-rinh-tô', 'NEW', 46),
('47', '2 Corinthians', '2 Cô-rinh-tô', 'NEW', 47),
('48', 'Galatians', 'Ga-la-ti', 'NEW', 48),
('49', 'Ephesians', 'Ê-phê-sô', 'NEW', 49),
('50', 'Philippians', 'Phi-líp', 'NEW', 50),
('51', 'Colossians', 'Cô-lô-se', 'NEW', 51),
('52', '1 Thessalonians', '1 Tê-sa-lô-ni-ca', 'NEW', 52),
('53', '2 Thessalonians', '2 Tê-sa-lô-ni-ca', 'NEW', 53),
('54', '1 Timothy', '1 Ti-mô-thê', 'NEW', 54),
('55', '2 Timothy', '2 Ti-mô-thê', 'NEW', 55),
('56', 'Titus', 'Tít', 'NEW', 56),
('57', 'Philemon', 'Phi-lê-môn', 'NEW', 57),
('58', 'Hebrews', 'Hê-bơ-rơ', 'NEW', 58),
('59', 'James', 'Gia-cơ', 'NEW', 59),
('60', '1 Peter', '1 Phi-e-rơ', 'NEW', 60),
('61', '2 Peter', '2 Phi-e-rơ', 'NEW', 61),
('62', '1 John', '1 Giăng', 'NEW', 62),
('63', '2 John', '2 Giăng', 'NEW', 63),
('64', '3 John', '3 Giăng', 'NEW', 64),
('65', 'Jude', 'Giu-đe', 'NEW', 65),
('66', 'Revelation', 'Khải Huyền', 'NEW', 66);

-- Insert sample questions
INSERT INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active) VALUES
('q1', 'Genesis', 1, 1, 1, 'easy', 'multiple_choice_single', 
'Trong Sáng Thế Ký 1:1, Đức Chúa Trời đã làm gì?',
'["Dựng nên trời và đất", "Dựng nên con người", "Phán xét thế gian", "Lập giao ước với Áp-ra-ham"]',
'0',
'Sáng Thế Ký 1:1: Ban đầu Đức Chúa Trời dựng nên trời và đất.',
'["st1", "sangkheky"]',
'Kinh Thánh',
'vi',
TRUE),

('q2', 'Genesis', 1, 27, 27, 'easy', 'multiple_choice_single',
'Đức Chúa Trời dựng nên con người theo hình ảnh của ai?',
'["Thiên sứ", "Đức Chúa Trời", "Động vật", "Cây cối"]',
'1',
'Sáng Thế Ký 1:27: Đức Chúa Trời dựng nên loài người như hình Ngài.',
'["st1", "connguoi"]',
'Kinh Thánh',
'vi',
TRUE),

('q3', 'Genesis', 3, 6, 6, 'medium', 'multiple_choice_single',
'Ê-va đã ăn trái cây từ cây nào?',
'["Cây sự sống", "Cây biết điều thiện và điều ác", "Cây tri thức", "Cây khôn ngoan"]',
'1',
'Sáng Thế Ký 3:6: Người nữ thấy trái của cây đó dùng làm thức ăn được.',
'["st3", "eva", "toi"]',
'Kinh Thánh',
'vi',
TRUE);

