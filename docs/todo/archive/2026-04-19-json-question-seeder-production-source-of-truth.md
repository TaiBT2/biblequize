# 2026-04-19 — JSON Question Seeder (production source of truth) [DONE]

### Task SE-1: Dedup check
- Status: [x] DONE — 300 questions, 0 duplicates within-file hay cross-book (verified by Python script)

### Task SE-2: Schema rename `text` → `content`
- Status: [x] DONE — sed replace trên 4 JSON files. Verify: 0 remaining `"text":`, 300 `"content":` occurrences

### Task SE-3: Move JSONs vào classpath
- Status: [x] DONE — `data/*.json` → `apps/api/src/main/resources/seed/questions/`

### Task SE-4: QuestionSeeder implementation
- Status: [x] DONE
- Files:
  - `infrastructure/seed/question/SeedQuestion.java` — DTO với Jackson `@JsonIgnoreProperties(ignoreUnknown=true)` cho forward-compat
  - `infrastructure/seed/question/QuestionSeeder.java` — `@EventListener(ApplicationReadyEvent)` chạy sau Flyway xong. Deterministic UUID từ `(book, chapter, verseStart, verseEnd, language, normalized-content)` → idempotent
  - Validation: skip rows thiếu required field với log warn
  - True/false backfill options `["Đúng","Sai"]` hoặc `["True","False"]` theo language
  - Config: `app.seeding.questions.enabled` (default true) + `.pattern` override
  - Source tag: `"seed:json"` để admin trace row origin sau này
- Test: `service/seed/QuestionSeederTest.java` — 20 cases (ID stability, case/whitespace insensitivity, entity mapping, true_false backfill, source tagging, enum parsing)
- Commit: "feat(api): runtime question seeder from classpath JSON files"

### Task SE-5: DEPRECATED — Deprecate old R__*.sql files
- Status: [ ] DEFERRED — riêng task, cần review cẩn thận từng file (30+ files), scope lớn
- Recommendation: trước khi xóa R__*.sql, convert questions còn thiếu (Psalms, Matthew, John, v.v. — chưa có trong JSON) sang JSON format
