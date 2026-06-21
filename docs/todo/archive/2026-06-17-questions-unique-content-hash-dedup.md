# 2026-06-17 — Questions: DB UNIQUE constraint chống trùng + dedup data cũ

> **Source**: User lo add câu mới sẽ trùng câu trong DB → chọn hướng "thêm UNIQUE constraint DB".
> **Scope**: BE Flyway migration `questions` (generated `content_hash` + UNIQUE index) + dedup 287 cặp legacy↔seed:json đã tồn tại (repoint history → xoá legacy). KHÔNG đụng module khác.

## Bối cảnh đã khảo sát (2026-06-17)

- Dedup key = **logical identity**: `book | chapter | verse_start | verse_end | language | normalized(content)`.
  - normalized = lowercase + bỏ 14 dấu câu `?!.,;:"'()[]{}` + gộp whitespace (khớp `DuplicateDetectionService.normalizeText`).
  - KHÔNG dùng content-only: sẽ loại nhầm câu hợp lệ (vd "Chúa Giê-su sinh ra ở đâu?" Luke 2:7 vs Matthew 2:1).
- Seed JSON (6696 câu) **0 collision**. Nhưng DB dev **287 cặp trùng** = mỗi cặp 1 `seed:json` + 1 `legacy` (source tên câu KT, import cũ). Tất cả nhóm size=2, đúng 1 seed:json/nhóm.
- Legacy dup rows bị tham chiếu: **310 `answers` + 4 `quiz_session_questions` + 3 `user_question_history`** (các bảng khác 0).
- Unique keys cần né khi repoint: `answers(session_id,question_id,user_id)`, `user_question_history(user_id,question_id)`. `quiz_session_questions` không có → repoint thẳng.
- MySQL prod+dev = 8.0 → dùng generated STORED column + `REGEXP_REPLACE`. Test = H2 + Flyway off → migration KHÔNG chạy trong test (không phá Tầng 3).
- `content_hash` KHÔNG thêm vào entity `Question` → Hibernate (dev `ddl-auto:update`, prod `none`) bỏ qua, không xung đột.

### Tasks
- UCH-1 Migration V68: generated `content_hash` + dedup (repoint 7 FK → xoá legacy) + UNIQUE index
  - Status: [x] DONE (viết + validate trên clone dev DB 2026-06-17) — chờ apply qua Flyway lần start BE kế · chưa commit
  - **Validate trên clone `biblequiz` (7580 rows)**: questions 7580→7293 (−287 đúng) · distinct hash = row count · 0 null · unique index OK · answers/uqh/qsq giữ nguyên 915/97/25 · 0 orphan · 0 nhóm trùng còn lại · insert near-dup (HOA + "???") bị chặn ERROR 1062 · "Where was Jesus born?" Luke 2:7 vs Matthew 2:1 vẫn cùng tồn tại (hash khác)
  - Files: `apps/api/src/main/resources/db/migration/V68__dedupe_questions_unique_content_hash.sql`
  - Test: chạy trên **bản sao** dev DB (clone `biblequiz` → `biblequiz_v68test`), verify: total giảm đúng 287, distinct hash = row count, UNIQUE index tồn tại, answers/uqh/qsq repoint đúng, 0 FK orphan. Rồi apply dev thật.
  - **Spec impact**: [x] None (admin dedup đã có trong SPEC_ADMIN; đây là DB hardening, no user-facing behavior change)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · test trên clone pass · apply dev · `audit.sh` no NEW broken · commit

- UCH-2 (optional, defer) Map `DataIntegrityViolationException` (dup content_hash) → 409 ở GlobalExceptionHandler
  - Status: [ ] TODO — defer, vì service đã chặn content-only (superset), DB constraint chỉ là backstop hiếm khi bắn. Đụng file nhạy cảm → tách commit riêng nếu làm.

### Out of scope
- Prod deploy: viết migration generic (data-driven) để chạy được prod, nhưng deploy prod do user quyết định/timing riêng.
- Hợp nhất 2 normalization khác nhau trong app (`normalizeText` vs `findByNormalizedContent`) — ghi nhận, không sửa trong task này.
