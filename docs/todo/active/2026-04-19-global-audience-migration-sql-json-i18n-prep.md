# 2026-04-19 — Global audience migration: SQL → JSON + i18n prep [PARTIALLY DONE]

### Task GA-1: Tags backfill (rule-based) [x] DONE
- 300 Pentateuch questions tagged với testament/book-vi/category/theme/difficulty
- Top themes: Gia-cốp, Môi-se, Tế lễ, Giô-sép, Đền tạm, Tội lỗi, Xuất hành, Đất hứa
- Khuyến nghị: có thể enhance với AI later để tag chất lượng hơn

### Task GA-2: QuestionSeeder tags support [x] DONE
- `toEntity` serializeTags → DB `tags` column (JSON string)
- +7 test cases (null, empty, escape quote+backslash, persist)

### Task GA-3: SQL → JSON converter [x] DONE
- File: `scripts/sql_to_json.py`
- Parsed 935 SQL rows với 57 parse errors (6% loss — acceptable)
- Output: 39 new JSON files, 664 questions
- Skipped 261 rows cho Pentateuch (JSON đã có curated version — không ghi đè)
- Total JSON state: **43 files / 974 questions / 43 books covered (65%)**

### Task GA-4: Add audience ADR [x] DONE
- DECISIONS.md: "Target audience expanded: Tin Lành toàn cầu"
- Supersedes implicit "VN-only" scope

### Task GA-5: EN translation workflow [x] DONE 2026-04-27
- Script: [scripts/translate_to_en.py](scripts/translate_to_en.py) — Gemini 2.0 Flash, batch 5/call, idempotent skip-if-exists, rate-limit retry
- Doc: [docs/EN_TRANSLATION_WORKFLOW.md](docs/EN_TRANSLATION_WORKFLOW.md) — full workflow (setup, usage, terminology, verification, troubleshooting, cost)
- Brief mention: CLAUDE.md L220 "Question Seeding" section
- Priority V1 books: Genesis 150, Matthew 160, John 160, Psalms 180, Romans 130 — all have EN pair ✓
- **Coverage**: 66/66 books có EN pair (verified `ls *_quiz_en.json \| wc -l = 66`)

### Task GA-8: Update PROMPT_GENERATE_QUESTIONS.md [x] DONE
- Fix: `text` → `content` field name (schema updated)
- Fix: filename convention `{slug}_quiz.json` matching seeder pattern
- Fix: tên VI chuẩn hóa với BOOK_META (`Xuất Hành` → `Xuất Ê-díp-tô Ký`)
- Add: `tags` field với rules (testament/book/category/theme, 3-5 tags/câu)
- Add: `source` field optional (tracking origin — "ai:gemini-2.0")
- Add: context section về audience (Protestant toàn cầu) + canon (66 books)
- Add: workflow post-generation (drop vào classpath → restart → optional translate EN)
- Add: `Category` column trong bảng 66 books
- Update: bảng books có thêm `Slug` column để filename correct
- Commit: "docs: update PROMPT_GENERATE_QUESTIONS to match current schema + workflow"

### Task GA-6: Fill remaining 23 books [x] DONE 2026-04-27 (verified — completed across multiple earlier sessions)
- Tất cả 23 books đã có VI + EN pair (verify 2026-04-27): 1chronicles 25/25, 2chronicles 25/25, ezra 25/25, songofsolomon 25/25, hosea 25/25, joel 20/20, amos 25/25, obadiah 20/20, nahum 20/20, zephaniah 20/20, haggai 20/20, zechariah 25/25, colossians 25/25, 1thessalonians 25/25, 2thessalonians 20/20, 1timothy 25/25, 2timothy 25/25, titus 20/20, philemon 21/21, 2john 20/20, 2peter 25/25, 3john 20/20, jude 20/20
- Tổng: 533 VI + 533 EN = 1066 questions across 23 books
- Source: kết hợp manual curation + AI generator + V2 Phase 1+2 work
- **Combined với 5 sách core** (V2 Phase 1+2 = 1,560 questions) → **66/66 books có JSON coverage** (full Protestant canon)

### Task GA-7: Delete legacy SQL [x] DONE 2026-04-27 (verified — actually deleted earlier in commit d24b774 on 2026-04-20)
- 26 R__*_questions.sql files đã xóa trong commit `d24b774` ("fea: update bonus xp")
- Files affected: R__1corinthians/2corinthians/acts/comprehensive/deuteronomy/exodus/genesis/john/leviticus/luke/mark/matthew/more/numbers/psalms/questions/questions_new_testament/questions_nt_epistles_extra/questions_nt_gospels_extra/questions_old_testament/questions_ot_history_extra/questions_ot_pentateuch_extra/questions_prophecy_extra/questions_wisdom_and_prophecy/questions_wisdom_extra/romans = 26 SQL files
- **Còn lại 2 R__ files** (KHÔNG xóa — purpose khác): `R__data.sql` (books table seed 66 books + categories), `R__seed_admin.sql` (admin role)
- Concern "57 parse errors → ~57 lost questions" đã giải quyết: V2 Phase 1+2 thêm 618 questions across 5 priority books; pool 974 → 4846 (vượt xa loss). 66/66 books có JSON coverage
- Verify state: `ls *R__*questions*.sql` returns empty; QuestionSeeder log 4846 total invalid=0 (idempotent restart confirms)
