-- Allow QuestionSeeder sync-mode to hard-delete stale seed:json rows.
-- Without ON DELETE CASCADE here, V20's RESTRICT blocks deletion when a
-- user has answered the question. App is pre-launch with no real users,
-- so cascading the user history is acceptable.
ALTER TABLE user_question_history DROP FOREIGN KEY fk_uqh_question;
ALTER TABLE user_question_history
  ADD CONSTRAINT fk_uqh_question
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
