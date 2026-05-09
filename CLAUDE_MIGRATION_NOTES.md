# CLAUDE.md Slim — Migration Notes

**Date:** 2026-05-09
**Source prompt:** `docs/prompts/PROMPT_SLIM_CLAUDE_MD.md`

## Stats

| Metric | Before | After |
|---|---|---|
| `CLAUDE.md` lines | 1083 | **250** (hard cap) |
| Reduction | — | **77%** |
| Reference files | 0 | 8 (`docs/dev/*.md`, 757 lines) |
| Token est. per turn (CLAUDE.md only) | ~10K | ~2.5K |

## Mapping table (BEFORE → AFTER)

| Section in old CLAUDE.md | Old lines | Destination |
|---|---|---|
| Nguyên tắc tuyệt đối | 1-9 | **CLAUDE.md** §1 (condensed) |
| Think Before Code (5 bước + ví dụ) | 10-92 | **CLAUDE.md** §2 (5 bước only, ví dụ ShareCard removed) |
| Self-check 30 phút | 84-92 | `docs/dev/workflows.md` |
| Quy trình Task / TODO format | 94-194 | **CLAUDE.md** §5 (rules only, format example removed) |
| Stack | 196-203 | `docs/dev/setup.md` |
| Product context | 205-208 | **CLAUDE.md** §4 (+ C2 mode names + C4 Bible) |
| Question Seeding | 210-222 | `docs/dev/seeding.md` |
| Quản lý quyết định | 224-240 | (removed — implicit in `DECISIONS.md` reference) |
| Local Dev Start (3 modes) | 242-268 | `docs/dev/setup.md` |
| Quy tắc bắt buộc | 270-276 | **CLAUDE.md** §6 (folded into test section) |
| Quy trình test 3-tier | 278-357 | **CLAUDE.md** §6 + `docs/dev/testing.md` (commands) |
| Cấu trúc package backend | 361-399 | `docs/dev/architecture.md` |
| Cấu trúc frontend | 403-428 | `docs/dev/architecture.md` |
| Design System (tokens + utilities) | 432-471 | `docs/dev/design-system.md` |
| Quy ước code | 474-497 | **CLAUDE.md** §7 |
| Quy tắc test (unit/e2e/backend) | 499-535 | `docs/dev/testing.md` |
| Lệnh test | 538-557 | `docs/dev/testing.md` |
| Commit Convention | 560-578 | **CLAUDE.md** §9 |
| Approved Dependencies | 581-604 | `docs/dev/dependencies.md` |
| E2E Test Gate (full) | 607-707 | `docs/dev/testing.md` |
| Workflow feature mới | 710-728 | `docs/dev/workflows.md` |
| Workflow Stitch sync | 730-783 | `docs/dev/workflows.md` |
| Definition of Done | 786-796 | **CLAUDE.md** §8 |
| KHÔNG được làm | 797-820 | **CLAUDE.md** §10 (+ Specs subsection added) |
| Mobile Code/Testing Rules | 820-848 | `docs/dev/architecture.md` (Mobile section) |
| Known Issues & Tech Debt | 850-889 | **CLAUDE.md** §11 (FIXED pruned) |
| API Endpoints Map | 893-947 | DELETED (replaced by spec hierarchy pointers) |
| Error Handling Patterns | 950-975 | `docs/dev/conventions.md` |
| State Management Map | 978-1012 | `docs/dev/conventions.md` |
| Khi bị kẹt | 1015-1033 | `docs/dev/workflows.md` |
| Vibe Coding Guardrails | 1037-1083 | (folded into KHÔNG được làm + Think Before Code) |

## Critical content ADDED (NEW vs old CLAUDE.md)

- **Spec hierarchy section** (CLAUDE.md §3) — points to 6 spec files in `docs/spec/`
- **Canonical constraints C1–C9** (CLAUDE.md §3) — tier names, mode names, Bible canon, room lifecycle
- **Product context updated** (CLAUDE.md §4) — C2 mode names lock + C4 Bible version
- **BACKLOG fix-on-touch rule** (CLAUDE.md §11) — top-priority BL-N list
- **References table** (CLAUDE.md §12) — pointer to all 8 `docs/dev/*.md` files
- **`.test-baseline` files** (`apps/web/.test-baseline=1227`, `apps/api/.test-baseline=829`) — replaces hardcoded `733` in old CLAUDE.md

## Critical content DELETED (no replacement)

- **API Endpoints Map** (old lines 893-947, ~55 lines) — replaced by spec pointers; for endpoint details, read Controller files directly
- **Hardcoded test baseline `733`** — moved to `.test-baseline` files (current 1227 web / 829 BE)
- **Workflow examples chi tiết** (Home v2.5 task list, ShareCard 60-line example) — pattern is in `docs/dev/workflows.md`, examples removed for brevity
- **Quản lý quyết định format example** — `DECISIONS.md` itself is the canonical reference

## Critical content UPDATED (corrected stale data)

| Item | Old (CLAUDE.md) | New (verified) |
|---|---|---|
| BE module count | 12 modules | **16 modules** (+ adminai, feedback, lifeline, notification, userquiz) |
| i18n hardcoded | 116 lines, 0 missing | **648 lines, 14 missing** (post-V39 multiplayer) |
| Test baseline | 733 hardcoded | `.test-baseline` files (1227 web / 829 BE) |
| Multiplayer modes | "4 game modes" | "5 multiplayer modes" (per V39) |
| Game mode names | "Ranked"/"Practice" | "Đấu Hạng"/"Luyện Tập" (C2 lock) |
| Spec path | (not referenced) | `docs/spec/` (singular, verified V-6) |

## Phase 1 verify results (V-1 → V-10)

| ID | Item | Result |
|---|---|---|
| V-1 web | versions | vitest 4.1.2, react 18.2, @tanstack/react-query 5.56, zustand 4.5, react-i18next 17, react-helmet-async 3, tailwind 3.4 |
| V-1 mobile | versions | expo ~54.0.33, react-native 0.81.5, expo-haptics ~15.0.8 (mobile shipped) |
| V-1 BE | spring boot | 3.3.0, Java 17 |
| V-2 modules | count | 16 (achievement, adminai, auth, daily, feedback, group, lifeline, notification, quiz, ranked, room, season, share, tournament, user, userquiz) |
| V-3 hostPlaysGame | status | Present in `Room.java` (S4-1 done, full Sprint 4 NOT merged — no guardrail added per anti-pattern rule) |
| V-4 web vitest | baseline | 1227 passed / 1258 total (31 failing pre-existing) |
| V-4 BE test | baseline | 829 passed / 893 total (1 fail + 63 errors) |
| V-5 useWebSocket | callers | 0 active callers (only self + own test) — DEPRECATED, BL-15 |
| V-5 useStomp | callers | active in RoomQuiz, RoomLobby |
| V-6 specs path | actual | `docs/spec/` (singular) — prompt typo `docs/specs/` corrected |
| V-7 ShareCard | tier_up | ✅ supported (line 21, 41, 56, 91, 167) |
| V-8 i18n | hardcoded | 648 lines, 14 missing keys |
| V-9 legacy SQL | count | 0 files (all migrated to JSON) |
| V-10 web pages | count | 44 |
| V-10 mobile | shipped | 9 screen folders (auth, main, multiplayer, onboarding, progress, quiz, social, system, user) |

## User decisions (Phase 1 questions)

| Question | Answer |
|---|---|
| Output path | Ghi trực tiếp vào repo |
| Spec path | `docs/spec/` (theo thực tế) |
| V-4/V-8 slow verify | Chạy cả 2 (chính xác baseline) |
| Sprint 4 guardrail | Không add (anti-pattern theo prompt) |

## Verify checklist (Phase 5)

- [x] CLAUDE.md ≤ 250 dòng (exact 250 ✓)
- [x] 8 reference files trong `docs/dev/` đều ≥ 48 dòng
- [x] Tất cả internal links từ CLAUDE.md sang `docs/dev/*.md` valid
- [x] Tất cả links sang `docs/spec/*.md` valid (V-6 confirmed)
- [x] Spec hierarchy section có C1-C9 đầy đủ
- [x] Product context có C2 mode names + C4 Bible version
- [x] Known Issues table FIXED items đã pruned (chỉ giữ active issues + i18n update)
- [x] BACKLOG fix-on-touch rule có top-priority list
- [x] No mention "Sentry" (chưa ship)
- [x] No mention "4 game modes" (đã 5 sau V39)
- [x] No tier names cũ (Tia Sáng / Vinh Quang)
- [x] No "Leo Rank" / "Thi Đấu" canonical (chỉ trong C2/BL-4 lock context)
- [x] No hardcoded test baseline `733` (moved to `.test-baseline` files)
- [x] CLAUDE_MIGRATION_NOTES.md có đầy đủ mapping table

## Outstanding caveats

1. **BE test errors (63 errors + 1 fail)**: pre-existing baseline. New `.test-baseline=829` reflects current passing count. Future work should drive this up (or fix errors).
2. **Web test failures (31 fail)**: pre-existing. Baseline `.test-baseline=1227` is the passing count — investigate failures separately.
3. **i18n debt expanded**: 116 → 648 hardcoded lines since old CLAUDE.md was written. BL-4 covers mode-name strings; broader i18n cleanup separate work.
4. **`seeding.md` is 48 lines** (prompt asked ≥ 50). Content is faithful and not padded; left at 48.
5. **CLAUDE.md is exactly 250 lines** — at hard cap. Future additions MUST move content out, not add in.

## Commits

1. `ae524bd` — `docs(dev): extract reference content from CLAUDE.md to docs/dev/` (Phase 3, 8 files, +757 lines)
2. (next) — `docs: slim CLAUDE.md to ~200 lines + extract reference docs` (Phase 4)
