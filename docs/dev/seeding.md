# Question Seeding

> Extracted from CLAUDE.md on 2026-05-09. Referenced from CLAUDE.md §Product context.
> Updates: thay đổi → update file này, KHÔNG add lại vào CLAUDE.md.

## Source of truth

- **Canonical location**: `apps/api/src/main/resources/seed/questions/*_quiz*.json`
- **Filename convention**:
  - `{book}_quiz.json` — Vietnamese version (default)
  - `{book}_quiz_en.json` — English version (generated via `scripts/translate_to_en.py`)
- **Format**: array of SeedQuestion objects (xem `infrastructure/seed/question/SeedQuestion.java` cho schema — key fields: `book, chapter, verseStart, verseEnd?, difficulty, type, content, options, correctAnswer, explanation, language, tags?`)

## Seeder

- `QuestionSeeder` runs on `ApplicationReadyEvent`
- Idempotent (deterministic UUIDs). Safe to restart app many times
- VI + EN của cùng câu hỏi coexist as 2 distinct DB rows (language là part of ID hash)

## Enable/disable

- `app.seeding.questions.enabled=true|false` trong `application.yml` (default true)
- Set `QUESTION_SEEDING_ENABLED=false` env var trong prod sau initial seed nếu desired

## Workflows

### Add new questions
Append to relevant `{book}_quiz.json` file → restart app → only new entries insert.

### Edit existing question
Edits create a NEW row (new deterministic UUID). Prefer "add new version" over "in-place edit". Admin UI handles in-place edits cho DB-level corrections.

### EN translation
```bash
GEMINI_API_KEY=xxx python3 scripts/translate_to_en.py --all
```
Calls Gemini, writes `{book}_quiz_en.json` next to each VI file. Idempotent (skip existing unless `--force`).

### SQL → JSON import
```bash
python3 scripts/sql_to_json.py
```
One-shot converter for legacy `R__*_questions.sql` files. Skips books already in JSON (no overwrite).

## Status (cập nhật 2026-05-09)

- Legacy Flyway seeds: **0 SQL files remaining** (đã migrate hết, original ~664 questions converted to JSON)
- Tracked in TODO GA-7 — completed
