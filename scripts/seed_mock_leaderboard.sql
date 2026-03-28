-- SQL Script to insert mock users and leaderboard data
USE biblequiz;

-- Insert Mock Users
INSERT INTO users (id, email, name, role, provider) VALUES
('u-mock-1', 'peter@example.com', 'Peter Parker', 'USER', 'local'),
('u-mock-2', 'mary@example.com', 'Mary Jane', 'USER', 'local'),
('u-mock-3', 'bruce@example.com', 'Bruce Wayne', 'USER', 'local'),
('u-mock-4', 'clark@example.com', 'Clark Kent', 'USER', 'local'),
('u-mock-5', 'diana@example.com', 'Diana Prince', 'USER', 'local'),
('u-mock-6', 'tony@example.com', 'Tony Stark', 'USER', 'local'),
('u-mock-7', 'steve@example.com', 'Steve Rogers', 'USER', 'local'),
('u-mock-8', 'natasha@example.com', 'Natasha Romanoff', 'USER', 'local'),
('u-mock-9', 'barry@example.com', 'Barry Allen', 'USER', 'local'),
('u-mock-10', 'hal@example.com', 'Hal Jordan', 'USER', 'local')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert User Daily Progress for today
SET @today = CURDATE();

INSERT INTO user_daily_progress (id, user_id, date, lives_remaining, questions_counted, points_counted, current_book, current_book_index, current_difficulty, is_post_cycle) VALUES
(UUID(), 'u-mock-1', @today, 10, 50, 450, 'Genesis', 0, 'medium', false),
(UUID(), 'u-mock-2', @today, 8, 45, 420, 'Genesis', 0, 'medium', false),
(UUID(), 'u-mock-3', @today, 15, 60, 550, 'Exodus', 1, 'hard', false),
(UUID(), 'u-mock-4', @today, 12, 55, 510, 'Exodus', 1, 'hard', false),
(UUID(), 'u-mock-5', @today, 20, 70, 680, 'Leviticus', 2, 'hard', false),
(UUID(), 'u-mock-6', @today, 5, 30, 290, 'Genesis', 0, 'easy', false),
(UUID(), 'u-mock-7', @today, 7, 35, 310, 'Genesis', 0, 'easy', false),
(UUID(), 'u-mock-8', @today, 9, 40, 380, 'Genesis', 0, 'medium', false),
(UUID(), 'u-mock-9', @today, 11, 48, 440, 'Exodus', 1, 'medium', false),
(UUID(), 'u-mock-10', @today, 14, 58, 530, 'Exodus', 1, 'hard', false)
ON DUPLICATE KEY UPDATE points_counted=VALUES(points_counted), questions_counted=VALUES(questions_counted);
