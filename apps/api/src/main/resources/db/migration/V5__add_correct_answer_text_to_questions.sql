-- Add correct_answer_text to questions table for fill_in_blank questions
ALTER TABLE questions ADD COLUMN correct_answer_text TEXT;
