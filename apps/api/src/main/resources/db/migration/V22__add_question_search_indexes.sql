-- Indexes for duplicate detection queries
CREATE INDEX IF NOT EXISTS idx_question_book_chapter_lang ON questions(book, chapter, language);
CREATE INDEX IF NOT EXISTS idx_question_book_verse_lang ON questions(book, chapter, verse_start, language);
