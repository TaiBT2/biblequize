# 2026-05-01 — Leaderboard LB-2 Sprint: 3 tabs + 4 liturgical seasons [DONE]

> **Sprint summary**: Bui's mid-Sprint request — bỏ Daily tab + thay 1-mùa/năm bằng 4 mùa Cơ-đốc. 3 commits trên main. Bonus discovered + fixed `endAt`/`endDate` field mismatch causing countdown to always be null.
> **Commits**: 5ef9b48 (LB-2.1 BE seeder + service) · 16d10bd (LB-2.2 FE 3 tabs + dynamic label + endDate fix) · LB-2.3 wrap-up.
> **Tests**: BE 19/19 (12 LeaderboardController + 7 SeasonService). FE Leaderboard.test.tsx 22/22 isolated. Combined Leaderboard + components: 223/224 (1 fail BasicQuizCard pre-existing timer flakiness, NOT regression). i18n 0 missing.

> **Source:** Bui's request 2026-05-01 — bỏ Daily tab, thay 1-mùa/năm bằng 4 mùa Cơ-đốc theo quarter (Mùa Phục Sinh / Ngũ Tuần / Cảm Tạ / Giáng Sinh).
> **Decision:** Pick 1A · 2A · 3C · 4B — xem `DECISIONS.md` 2026-05-01 "Leaderboard tabs + 4 liturgical seasons".
> **Scope:** BE seeder + service refactor; FE tab restructure + dynamic Mùa label; i18n updates. KHÔNG xóa data DB cũ (legacy random-UUID "Mùa Phục Sinh 2026" — leave alone).
> **Pre-flight:**
> - ✅ `SeasonSeeder` already uses liturgical names (Mùa Giáng Sinh 2025, Mùa Phục Sinh 2026) — extend pattern to 4 seasons/year
> - ✅ `seasonRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual` already exists — reuse for date-based active lookup
> - ✅ `/api/seasons/active` endpoint already exists — FE just consumes it
> - ⚠️ Existing DB rows from old seeder (random UUID) won't conflict if new seeder uses deterministic IDs `season-{year}-q{1-4}`

### Task LB-2.1: Backend SeasonSeeder + service refactor [x] DONE 2026-05-01
- Status: [x] DONE — pending commit
- File(s):
  - `apps/api/.../infrastructure/seed/SeasonSeeder.java` — refactor to seed 4 mùa/năm × 2 năm (current + next), idempotent via deterministic ID
  - `apps/api/.../modules/season/service/SeasonService.java` — switch `getActiveSeason()` from `findByIsActiveTrue()` to date-based `findByStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today)`
  - `apps/api/.../api/SeasonController.java` — verify `/api/seasons/active` returns season.name + endAt for FE consumption
  - `apps/api/.../modules/season/service/SeasonServiceTest.java` (if exists) or create — test 4 quarter mappings
- Approach:
  - Quarter-aligned dates: Q1 (Jan 1 - Mar 31) Mùa Phục Sinh / Q2 (Apr 1 - Jun 30) Mùa Ngũ Tuần / Q3 (Jul 1 - Sep 30) Mùa Cảm Tạ / Q4 (Oct 1 - Dec 31) Mùa Giáng Sinh
  - Seeder: iterate years (current, next), iterate quarters (1-4) → upsert via `findById` check
  - Service: simple date lookup, no caching needed (cheap query)
- Checklist:
  - [x] Refactor SeasonSeeder — idempotent via deterministic ID `season-{year}-q{1-4}`, seeds 8 rows (current + next year)
  - [x] Refactor SeasonService.getActiveSeason — date-based primary, falls back to `findByIsActiveTrue` for legacy
  - [x] Test BE: SeasonServiceTest 7/7 (was 6 + 2 new date-based tests, dropped 1 redundant)
  - [x] LeaderboardControllerTest still 12/12
  - [x] Commit: `feat(season): 4 liturgical seasons + date-based active lookup (LB-2.1)` (5ef9b48)

### Task LB-2.2: Frontend remove Daily tab + dynamic Mùa label [x] DONE 2026-05-01
- Status: [x] DONE — pending commit
- File(s):
  - `apps/web/src/pages/Leaderboard.tsx` — remove 'daily' from Tab type, default tab = 'weekly', tab "MÙA" label use `season.name` dynamic
  - `apps/web/src/pages/__tests__/Leaderboard.test.tsx` — update tab tests
  - `apps/web/src/i18n/{vi,en}.json` — update `leaderboard.tierSeasonSubtitle` to remove hardcoded "Vinh Quang Mùa Xuân 2026" (use template with {{seasonName}})
- Approach:
  - Remove "Hôm nay" tab; default activeTab to 'weekly' (changes initial fetch)
  - Tab label "MÙA" → render `season?.name ?? t('leaderboard.season')` — falls back to "Mùa" generic when season query loading
  - Section header "Xếp Hạng Mùa" stays (generic) but subtitle uses dynamic season name interpolation
  - Sidebar widgets unaffected (LeaderboardSeasonWidget already shows season.name dynamic)
- Checklist:
  - [x] Tab type → `'weekly' | 'season' | 'all_time'` (Daily removed)
  - [x] Default activeTab = 'weekly'
  - [x] Tab "Mùa" label dynamic from `season.name.toUpperCase()` with generic fallback
  - [x] Tabs array refactored to `TAB_TO_API_PATH` map (cleaner than inline label/path)
  - [x] i18n subtitle: `tierSeasonSubtitle` now `{{seasonName}}` interpolated; `tierSeasonSubtitleFallback` for no-season case
  - [x] Bug fix: `season.endAt` → `season.endDate` (BE returns endDate, FE was reading non-existent endAt)
  - [x] LeaderboardSeasonWidget: same endAt → endDate fix
  - [x] Tests: 22/22 pass (was 21 + 2 LB-2.2 - 1 daily-tab test removed)
  - [x] Tầng 2 pages: 480 pass (29 fails Ranked baseline)
  - [x] i18n validator: 0 missing, +2 hardcoded JSDoc (accepted debt)
  - [x] Commit: `feat(leaderboard): 3 tabs + dynamic Mùa label + fix endDate bug (LB-2.2)` (16d10bd)

### Task LB-2.3: Final regression + bug report update [x] DONE 2026-05-01
- Status: [x] DONE — pending commit
- Checklist:
  - [x] BE: LeaderboardControllerTest 12/12 + SeasonServiceTest 7/7 = 19/19
  - [x] FE: Leaderboard.test.tsx 22/22 isolated
  - [x] FE combined Leaderboard + components: 223/224 (1 BasicQuizCard timer flakiness pre-existing — verified isolated pass)
  - [x] FE Tầng 2 pages: 480 pass (29 fails Ranked baseline drift, NOT new regressions)
  - [x] i18n validator: 0 missing keys
  - [x] Update BUG_REPORT_LEADERBOARD.md with LB-2 sprint section
  - [x] Commit: `chore(leaderboard): LB-2 Sprint wrap-up (LB-2.3)` (958e53f)

---
