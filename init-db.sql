-- Initialize database with basic tables
CREATE DATABASE IF NOT EXISTS biblequiz;
USE biblequiz;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture_url VARCHAR(500),
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    provider_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_provider (provider, provider_id),
    INDEX idx_is_active (is_active)
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_book_chapter (book, chapter),
    INDEX idx_difficulty (difficulty),
    INDEX idx_type (type),
    INDEX idx_language (language),
    INDEX idx_is_active (is_active)
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100) NOT NULL,
    testament ENUM('old', 'new') NOT NULL,
    order_index INT NOT NULL,
    chapter_count INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_name (name),
    UNIQUE KEY uk_name_vi (name_vi),
    INDEX idx_testament (testament),
    INDEX idx_order (order_index),
    INDEX idx_is_active (is_active)
);
