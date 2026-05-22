# 2026-05-22 — Liturgical Coverage: việc cần làm thêm

> **Source:** Sau khi push branch `feat/liturgical-coverage` (6 commits, code-complete chưa verify)
> **Scope:** Tổng hợp mọi việc tồn đọng của chuỗi Liturgical Coverage để làm sau.

---

## A. Verification — BẮT BUỘC trước khi merge PR

- A-1 Chạy `cd apps/api && mvn test` full trên môi trường có DB
  - Status: [ ] TODO
  - Phân biệt regression mới vs baseline cũ: UserControllerTest/RoomControllerTest/SecurityTest (~80 errors — pre-existing, missing @MockBean), LifelineServiceTest 1 (UnnecessaryStubbing), QuestionReviewControllerTest 1. KHÔNG phải do branch này.
  - Fix mọi failure THỰC SỰ do branch gây ra trước khi merge.
- A-2 Chạy `cd apps/web && npm run test && npm run lint && npm run validate:i18n`
  - Status: [ ] TODO
  - Baseline: Ranked.test.tsx 42 stale failures (BL-RANKED-TEST-STALE-MILESTONE) — pre-existing, không phải regression.
- A-3 Apply Flyway V58-V63 trên DB trống → confirm migrate clean
  - Status: [ ] TODO
  - Thứ tự V63: apply migration TRƯỚC, deploy app sau, để QuestionSeeder self-heal questions table.
- A-4 Mobile: `cd apps/mobile && npx tsc --noEmit` + manual build emulator
  - Status: [ ] TODO

## B. Manual QA trên staging (sau khi deploy flag OFF)

- B-1 Deploy `LITURGICAL_COVERAGE_ENABLED=false` → confirm Ranked cũ không đổi
  - Status: [ ] TODO
- B-2 Bật `enabled=true, rollout-percent=100` (test account) → verify:
  - Status: [ ] TODO
  - Tier 6 nhận ~60% Hard (P0 — trước đây mobile bug uniform random)
  - CoverageCard render, 6-book grid
  - Trả lời đủ 4 câu/sách → coverage tick; 6/6 → WeekCompleteModal trên results
  - ×1.5 fire cho focus book
  - Pool exhaustion → PoolExhaustedModal
  - Badge: seed UserSeasonBadge unshown → BadgeAwardModal trên /ranked → mark-shown
- B-3 Run Phase 2 migration job 1 lần (`LITURGICAL_COVERAGE_MIGRATION_RUN_AT_STARTUP=true`, restart, verify, tắt lại)
  - Status: [ ] TODO

## C. Staged rollout

- C-1 Ramp `rollout-percent`: 0 → 10 → 25 → 50 → 100 qua 2-4 tuần, monitor `coverage_*` + `pool_exhaustion_*` logs
  - Status: [ ] TODO
- C-2 Sau 30 ngày stable → BL-COVERAGE-PHASE-4A (rename deprecated columns)
  - Status: [ ] TODO

## D. FMC ministry review (parallel-safe, business decision)

- D-1 Mang `docs/audit/FOCUS_BOOKS_AUDIT.md` cho đội mục vụ FMC
  - Status: [ ] TODO
  - Confirm/edit focus books Q2 Ngũ Tuần / Q3 Cảm Tạ / Q4 Giáng Sinh (hiện là Claude estimate)
- D-2 Sau FMC confirm → update `SeasonSeeder.java:57-65` `FOCUS_BOOKS_BY_QUARTER`
  - Status: [ ] TODO
  - Prod: SeasonSeeder có `@Profile("!prod")` → cần manual SQL `UPDATE seasons SET focus_books=...`

## E. Follow-up PROMPTs / sprints chưa làm

- E-1 PROMPT_E2E_SEED_INFRA — seed helpers + 3 W-M07 Playwright tests (4 commits)
  - Status: [ ] TODO — cần BE test-seed endpoints (Phase 1 audit xác định) + live stack
- E-2 Commit 6 mobile tests — blocked: chưa có RN component-test infra
  - Status: [!] BLOCKED → `BL-MOBILE-COMPONENT-TEST-INFRA` (pnpm add fail trên Windows env — cần Defender exclusion hoặc CI)
- E-3 Add BACKLOG entry `BL-VARIETY-SEASONAL-MIGRATE` (VarietyQuizController.getSeasonalContent dùng hardcode riêng, nên migrate sang LiturgicalSeasonService)
  - Status: [ ] TODO

## F. Quyết định còn treo (Bui)

- F-1 `WeekCompleteModal` UX timing — đã chốt Option B (defer to results). ✅ Done.
- F-2 UuidV7Generator — đã chốt Option B (dùng `UUID.randomUUID()` v4). Drift track ở `BL-UUID-V7-SEASONS`. ✅ Done.
- F-3 Telemetry stack — hiện slf4j logger `coverage.analytics` (16 events). Quyết định khi nào wire Mixpanel/PostHog thật.
  - Status: [ ] TODO (defer post-launch)
- F-4 "Song of Songs" vs "Song of Solomon" — đã chốt "Song of Songs". ✅ Done.

## G. Cleanup / housekeeping

- G-1 Update `CLAUDE.md` spec hierarchy table: `SPEC_USER_v3.1.md` → `SPEC_USER_v3.2.md`
  - Status: [ ] TODO
- G-2 Archive `SPEC_USER_v3.1.md` sau khi v3.2 stable; xóa drafts `docs/prompts/SPEC_USER_v3_2_section_7_draft*.md` + `SPEC_USER_v3_2_section_7_FINAL.md`
  - Status: [ ] TODO
- G-3 Tạo PR cho branch `feat/liturgical-coverage` → review → merge
  - Status: [ ] TODO
- G-4 Khi toàn bộ DONE: move 2 file sprint (`2026-05-21-liturgical-coverage-sprint.md` + file này) sang `docs/todo/archive/`, cập nhật TODO.md index
  - Status: [ ] TODO

## H. BACKLOG items đã track (defer post-launch — không block v1)

Chỉ liệt kê để nhớ, chi tiết ở `docs/spec/BACKLOG.md`:
- `BL-COVERAGE-PHASE-4A/4B/4C` — rename + drop deprecated columns (currentBook…)
- `BL-COVERAGE-HARD-QUOTA` — patchwork mastery gap: WeeklyPairing chọn "sách lớn" bằng chapter-count proxy, không phải Hard-question count thật → Tier 6 có thể bypass Hard tuần đầu
- `BL-COVERAGE-ADMIN-UI` — admin UI cho weekly pairing override (v1.5)
- `BL-UUID-V7-SEASONS` — migrate seasons.id v4 → v7
- `BL-QUESTION-RESEED-HISTORY-PRESERVATION` — preserve user history khi rename book
- `BL-RANKED-TEST-STALE-MILESTONE` — 42 stale testid failures trong Ranked.test.tsx
- `BL-MOBILE-COMPONENT-TEST-INFRA` — RN component test setup

> **⚠️ Ưu tiên cao trong defer list:** `BL-COVERAGE-HARD-QUOTA` — đây là correctness gap (tiêu chí 4 "tránh patchwork mastery"), nên xử lý sớm sau launch.
