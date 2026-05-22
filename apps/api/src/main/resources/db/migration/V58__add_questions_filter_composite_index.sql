-- §7.7.6 — Composite index for Question filter perf
-- Covers: SmartQuestionSelector tier-aware multi-book filter queries
-- (language, book, difficulty, is_active) — most-selective leading column for ranked selection
-- Pre-Phase A of Liturgical Coverage sprint (V58, 2026-05-21)

CREATE INDEX idx_questions_filter
    ON questions (language, book, difficulty, is_active);
