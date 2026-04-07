-- Indexes for duplicate detection queries
-- Use CREATE INDEX without IF NOT EXISTS for MySQL 5.x compatibility
-- Wrap in stored procedure to handle "already exists" gracefully

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'questions' AND INDEX_NAME = 'idx_question_book_chapter_lang') = 0,
  'CREATE INDEX idx_question_book_chapter_lang ON questions(book, chapter, language)',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'questions' AND INDEX_NAME = 'idx_question_book_verse_lang') = 0,
  'CREATE INDEX idx_question_book_verse_lang ON questions(book, chapter, verse_start, language)',
  'SELECT 1'
));
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
