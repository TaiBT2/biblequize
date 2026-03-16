-- Idempotent add of asked_question_ids JSON column to user_daily_progress
-- Flyway uses the configured schema; no explicit USE here

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_daily_progress'
    AND COLUMN_NAME = 'asked_question_ids'
);

SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE user_daily_progress ADD COLUMN asked_question_ids JSON NULL',
  'DO 0'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


