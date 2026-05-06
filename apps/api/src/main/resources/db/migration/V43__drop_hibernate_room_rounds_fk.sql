-- Hibernate (with ddl-auto=update in dev) re-created an FK constraint on
-- room_rounds.question_id → questions(id) with the auto-generated name
-- FKgqjwwfleqc3wt1qbsb8acxjka after V42 dropped the explicit one, because
-- the @ManyToOne mapping was still present on the entity. The entity has
-- now been changed to a plain String column, but the existing FK must be
-- dropped explicitly.
--
-- Use a dynamic statement so this migration is robust if the FK was
-- never created (e.g. fresh DBs running V42 + V43 against an entity that
-- already lacks the mapping).
SET @fk := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'room_rounds' AND COLUMN_NAME = 'question_id'
              AND REFERENCED_TABLE_NAME = 'questions'
              AND TABLE_SCHEMA = DATABASE()
            LIMIT 1);
SET @sql := IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE room_rounds DROP FOREIGN KEY ', @fk));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
