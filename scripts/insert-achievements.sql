-- Insert sample achievements
INSERT INTO achievements (id, name, description, icon, category, criteria, points, is_active, created_at, updated_at) VALUES
-- Quiz Achievements
('ach-001', 'First Quiz', 'Complete your first quiz', '🎯', 'quiz', '{"minQuizzes": 1}', 10, true, NOW(), NOW()),
('ach-002', 'Quiz Master', 'Complete 10 quizzes', '🏆', 'quiz', '{"minQuizzes": 10}', 50, true, NOW(), NOW()),
('ach-003', 'Quiz Legend', 'Complete 50 quizzes', '👑', 'quiz', '{"minQuizzes": 50}', 200, true, NOW(), NOW()),

-- Streak Achievements
('ach-004', 'Getting Started', '3 day streak', '🔥', 'streak', '{"minStreak": 3}', 25, true, NOW(), NOW()),
('ach-005', 'Week Warrior', '7 day streak', '⚡', 'streak', '{"minStreak": 7}', 100, true, NOW(), NOW()),
('ach-006', 'Month Master', '30 day streak', '🌟', 'streak', '{"minStreak": 30}', 500, true, NOW(), NOW()),

-- Points Achievements
('ach-007', 'Point Collector', 'Earn 1000 points', '💰', 'points', '{"minPoints": 1000}', 30, true, NOW(), NOW()),
('ach-008', 'Point Master', 'Earn 5000 points', '💎', 'points', '{"minPoints": 5000}', 150, true, NOW(), NOW()),
('ach-009', 'Point Legend', 'Earn 10000 points', '💍', 'points', '{"minPoints": 10000}', 300, true, NOW(), NOW()),

-- Books Achievements
('ach-010', 'Book Explorer', 'Study 5 different books', '📚', 'books', '{"minBooks": 5}', 40, true, NOW(), NOW()),
('ach-011', 'Bible Scholar', 'Study all books', '📖', 'books', '{"minBooks": 10}', 200, true, NOW(), NOW()),

-- Accuracy Achievements
('ach-012', 'Sharp Shooter', '80% accuracy', '🎯', 'accuracy', '{"minAccuracy": 0.8}', 60, true, NOW(), NOW()),
('ach-013', 'Perfect Aim', '90% accuracy', '🏹', 'accuracy', '{"minAccuracy": 0.9}', 120, true, NOW(), NOW()),
('ach-014', 'Bible Expert', '95% accuracy', '🧠', 'accuracy', '{"minAccuracy": 0.95}', 250, true, NOW(), NOW());
