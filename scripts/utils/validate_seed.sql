-- ============================================================
-- BibleQuiz Seed Data Validation
-- Run: mysql -u root -p -P 3307 biblequiz < scripts/utils/validate_seed.sql
-- ============================================================

-- 1. Check total questions per book
SELECT '=== POOL SIZE PER BOOK ===' AS '';
SELECT
    book,
    COUNT(*) AS total,
    SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) AS easy,
    SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) AS medium,
    SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) AS hard,
    CASE
        WHEN SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) >= 30
         AND SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) >= 20
         AND SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) >= 10
        THEN 'READY'
        ELSE 'NEED MORE'
    END AS ranked_status
FROM questions
WHERE is_active = true
GROUP BY book
ORDER BY book;

-- 2. Check for missing required fields
SELECT '=== MISSING REQUIRED FIELDS ===' AS '';
SELECT id, book, chapter,
    CASE WHEN content IS NULL OR content = '' THEN 'MISSING content' ELSE 'OK' END AS content_check,
    CASE WHEN options IS NULL OR options = '' THEN 'MISSING options' ELSE 'OK' END AS options_check,
    CASE WHEN correct_answer IS NULL OR correct_answer = '' THEN 'MISSING correct_answer' ELSE 'OK' END AS answer_check,
    CASE WHEN explanation IS NULL OR explanation = '' THEN 'MISSING explanation' ELSE 'OK' END AS explanation_check
FROM questions
WHERE is_active = true
  AND (content IS NULL OR content = ''
    OR options IS NULL OR options = ''
    OR correct_answer IS NULL OR correct_answer = ''
    OR explanation IS NULL OR explanation = '')
LIMIT 20;

-- 3. Check difficulty distribution
SELECT '=== DIFFICULTY DISTRIBUTION ===' AS '';
SELECT
    difficulty,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questions WHERE is_active = true), 1) AS percentage
FROM questions
WHERE is_active = true
GROUP BY difficulty;

-- 4. Check for duplicate IDs
SELECT '=== DUPLICATE IDS ===' AS '';
SELECT id, COUNT(*) AS cnt
FROM questions
GROUP BY id
HAVING COUNT(*) > 1
LIMIT 10;

-- 5. Check seed data specifically
SELECT '=== SEED DATA SUMMARY ===' AS '';
SELECT
    book,
    COUNT(*) AS seed_questions
FROM questions
WHERE id LIKE 'seed-%' AND is_active = true
GROUP BY book
ORDER BY book;

-- 6. Overall summary
SELECT '=== OVERALL SUMMARY ===' AS '';
SELECT
    COUNT(*) AS total_questions,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) AS active,
    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) AS inactive,
    COUNT(DISTINCT book) AS books_covered
FROM questions;

-- 7. Books NOT meeting ranked minimum (need attention)
SELECT '=== BOOKS NEEDING MORE QUESTIONS ===' AS '';
SELECT
    book,
    SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) AS easy,
    CONCAT(30 - SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END), ' more easy needed') AS easy_gap,
    SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) AS medium,
    CONCAT(20 - SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END), ' more medium needed') AS medium_gap,
    SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) AS hard,
    CONCAT(10 - SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END), ' more hard needed') AS hard_gap
FROM questions
WHERE is_active = true
GROUP BY book
HAVING SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) < 30
    OR SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) < 20
    OR SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) < 10
ORDER BY book;
