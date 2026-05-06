-- room_rounds.question_id may now reference either a row in `questions`
-- (built-in question bank) or `user_questions` (custom QuestionSet items).
-- The FK to `questions` was preventing custom-source multiplayer rooms
-- from starting (`Cannot add or update a child row: a foreign key
-- constraint fails (fk_rr_question)`), so the FK is dropped here.
-- The column itself remains; consumers must lookup by id when they need
-- the question content.
ALTER TABLE room_rounds DROP FOREIGN KEY fk_rr_question;
