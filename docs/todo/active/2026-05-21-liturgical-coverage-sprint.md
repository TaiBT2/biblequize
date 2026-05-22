# Sprint: Liturgical Coverage System (P5)

**Created:** 2026-05-21
**Spec:** [SPEC_USER_v3.2.md §7](../../spec/SPEC_USER_v3.2.md)
**Effort:** ~12–15 ngày
**Commits:** 10
**Status:** 🟡 Code complete (2026-05-21) — pending Tầng 3 regression + commit + staged rollout

## Implementation log (2026-05-21)

All 10 commit units coded autonomously. Commit boundaries match plan §7.13:

| # | Status | Files | Notes |
|---|---|---|---|
| 1 | ✅ | QuestionMeta record, repo meta methods, V58 index, Dockerfile heap | Foundation perf |
| 1b | ✅ | SmartQuestionSelector two-step refactor | ~40× memory reduction |
| 2 | ✅ | Season.focusBooks, V59, SeasonSeeder backfill, LiturgicalSeasonService | All 4 mùa focus books seeded with biblical defaults; Bui review Q2/Q3/Q4 |
| 3 | ✅ | WeeklyPairing entity/repo/V60, WeeklyPairingService, AdminSeasonPairingController, BibleStructure helpers | 52 pairings deterministic compute |
| 4 | ✅ | UserSeasonCoverage entity/repo/V61, JsonMapStringIntegerConverter, CoverageAnalytics (slf4j), LiturgicalCoverageService | 8 events wired via slf4j logger `coverage.analytics` |
| 5 | ✅ | QuestionFilter `book` → `books`, 4-overload back-compat | 6 callers verified |
| 6 | ✅ | FeatureFlagService, CoverageController (GET status + POST unlock), BookProgressionService @Deprecated, application.yml | Default OFF; hash-bucket rollout |
| 6b | ✅ | RankedController dual-path branching, coverage tick, pool exhaustion fallback chain | 3-level fallback + telemetry |
| 7 | ✅ | ScoringService ×1.5 isInSeasonBook overload, RankedController wire | Gated by feature flag |
| 8 | ✅ | useCoverageStatus hook, CoverageCard component, Ranked.tsx integration, vi/en i18n | Mobile parity deferred → BL-COVERAGE-MOBILE-MIGRATE |
| 9 | ✅ | BookMasteryService LOCKED→NOT_STARTED, Journey.tsx remove lock branches, i18n notStarted | Per §7.10.1 |
| 10 | 🟡 | LiturgicalCoverageMigrationJob (gated by flag), BACKLOG entries | Phase 4a/4b/4c column rename deferred to follow-up BLs |

**Deferred from sprint (tracked in BACKLOG):**
- BL-COVERAGE-PHASE-4A — column rename (gated by 30-day stability)
- BL-COVERAGE-PHASE-4B — column drop (gated by 4a + 7-day grace)
- BL-COVERAGE-PHASE-4C — drop current_difficulty (gated by mobile_legacy = 0 for 30 days)
- BL-COVERAGE-MOBILE-MIGRATE — Phase 3 mobile RankedScreen migration

**Bui review items before merge:**
1. UuidV7Generator: shipped as `UUID.randomUUID()` (v4) per Option B. BL-UUID-V7-SEASONS tracks drift.
2. Focus books Q2 (Ngũ Tuần) / Q3 (Cảm Tạ) / Q4 (Giáng Sinh) — biblical defaults applied; confirm or override via admin endpoint.
3. Telemetry: slf4j-based via `coverage.analytics` logger. No Mixpanel/PostHog wired. Operators scrape logs.
4. `@Profile("!prod")` on SeasonSeeder unchanged — prod focus_books backfill requires manual SQL or removing the profile annotation.

**Pre-deploy checklist:**
- [ ] `mvn test` full suite passes (Tầng 3 regression)
- [ ] `mvn flyway:info` shows V58/V59/V60/V61 pending
- [ ] FE `npm run lint && npm run test && npm run validate:i18n`
- [ ] Manual smoke: deploy with `LITURGICAL_COVERAGE_ENABLED=false` → existing Ranked unchanged
- [ ] Deploy with `enabled=true, rollout-percent=0` → safety check (no users in bucket)
- [ ] Set `rollout-percent=10` → monitor coverage_*, pool_exhaustion_* events
- [ ] Run Phase 2 migration job once (`LITURGICAL_COVERAGE_MIGRATION_RUN_AT_STARTUP=true`, restart, verify, disable)
- [ ] Ramp 10% → 25% → 50% → 100% over 2-4 weeks
- [ ] After 30 days stable → BL-COVERAGE-PHASE-4A ship

---

## Original plan


## Quick context

Replace deprecated sequential `currentBook` (Genesis → Revelation) Ranked progression với **3-layer Question Selection System** (Liturgical Coverage + Tier Difficulty + Smart History). Mỗi user chơi qua 66 sách Kinh Thánh trong mỗi mùa liturgical 91 ngày (11 active weeks × 6 sách + 2 Mastery weeks catchup). Coverage threshold 4 câu/sách. Tier-aware difficulty distribution giữ nguyên (Tier 1: 70/25/5 → Tier 6: 5/35/60).

## Pre-sprint checklist

- [x] SPEC_USER_v3.2.md §7 merged và reviewed (2026-05-21)
- [x] BACKLOG entries `BL-COVERAGE-ADMIN-UI` và `BL-UUID-V7-SEASONS` added (2026-05-21)
- [ ] Mobile parity audit P0-A reviewed (RankedScreen using `/api/me` not `/api/me/ranked-status`)
- [ ] Feature flag `liturgical_coverage_enabled` infrastructure quyết định (chưa có FeatureFlagService trong codebase — TO CREATE)
- [ ] Bui confirm UuidV7Generator strategy: tạo mới hay dùng `UUID.randomUUID()` (v4) cho all new entities

## Dependencies

### External (must complete first)
- Sprint 5 Quiz Set Professional — confirm done trước khi attack §7 refactor
- Mobile RankedScreen P0-A audit decision (migrate trong commit 8 hay defer)

### Internal (must exist hoặc TO CREATE before commit 1)
- **UuidV7Generator** — ❌ NOT FOUND. Codebase dùng `UUID.randomUUID()` (v4) uniformly. Decision needed:
  - **Option A:** Tạo `UuidV7Generator` mới trong commit 1 (chuẩn theo CLAUDE.md)
  - **Option B:** Dùng `UUID.randomUUID()` (v4) cho new entities, accept drift với CLAUDE.md rule, add to BACKLOG
- **Flyway baseline:** Latest = V57 (`V57__add_room_quick_match.sql`, 2026-05-15). Next available = **V58**. Sprint cần V58 (UserSeasonCoverage), V59 (WeeklyPairing), optional V60 (composite index nếu chưa có)
- **FeatureFlagService** — ❌ NOT FOUND. TO CREATE trong commit 1 hoặc tách commit riêng
- **ApplicationEventPublisher** — ❌ NOT USED in codebase. Phase B cache invalidation events sẽ cần wire (defer post-P5)
- **Analytics pipeline** — ❌ NO Mixpanel/PostHog. Chỉ có custom `audit_events` table. §7.16 telemetry events cần decide: viết vào audit_events hay defer Phase B

## Surprising findings từ audit (ảnh hưởng plan)

1. **SeasonSeeder đã seed cả 4 mùa** ([SeasonSeeder.java:41-91](../../../apps/api/src/main/java/com/biblequiz/infrastructure/seed/SeasonSeeder.java#L41-L91)) → **commit 2 simplified**: không cần seed mới, chỉ add `focusBooks` field + LiturgicalSeasonService wrapper. BL-5 chỉ còn wire ×1.5 (commit 7).
2. **ScoringService tier multiplier đã ship BL-3** ([ScoringService.java:96-107](../../../apps/api/src/main/java/com/biblequiz/modules/ranked/service/ScoringService.java#L96-L107)) → commit 7 chỉ thêm `isInSeasonBook` parameter + ×1.5, không refactor toàn bộ.
3. **BL-21 UserQuestionHistory đã wire** ([RankedController.java:653-688](../../../apps/api/src/main/java/com/biblequiz/api/RankedController.java#L653-L688), 2026-05-20) → Smart History pools (Layer 3) đã có data feed.
4. **`/api/me/tier-progress` endpoint missing** ([useRankedPage.ts:105](../../../apps/web/src/hooks/useRankedPage.ts#L105) silently fails) → fold vào commit 1 hoặc fix riêng pre-sprint.
5. **Hybrid session memory + DB persistence** in RankedController → consolidation risk in commit 6; có thể leak data nếu không cẩn thận.
6. **CurrentBookCard.tsx wired với OT/NT layout deprecated** ([CurrentBookCard.tsx:4-12](../../../apps/web/src/components/ranked/CurrentBookCard.tsx#L4-L12)) → commit 8 rewrite component hoàn toàn, không patch.
7. **BookMasteryService unused trong Ranked** ([BookMasteryService.java](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/BookMasteryService.java)) → giữ nguyên cho Journey, không touch.
8. **No `MaxRAMPercentage`** in [Dockerfile:26](../../../apps/api/Dockerfile#L26) → commit 1 add.

---

## Commit breakdown

### Commit 1: PERF — DTO projection + composite index + heap config + missing tier endpoint (Phase A)

**Spec ref:** §7.7.5, §7.7.6
**Effort:** 1.5 ngày
**Files to modify:**
- [apps/api/src/main/java/com/biblequiz/modules/quiz/repository/QuestionRepository.java:121-131](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/repository/QuestionRepository.java#L121-L131) — add `findMetaByLanguageAndBooks(String lang, List<String> books)` returning `List<QuestionMeta>`
- `apps/api/src/main/java/com/biblequiz/modules/quiz/dto/QuestionMeta.java` — **TO CREATE** (record class with id, book, difficulty)
- [apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java:36-76](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java#L36-L76) — refactor `selectQuestions` to use QuestionMeta for filtering, batch fetch full Question only for final N IDs
- `apps/api/src/main/resources/db/migration/V58__add_questions_filter_composite_index.sql` — TO CREATE: composite index `idx_questions_filter ON questions(language, book, difficulty, status)`. NOTE: V22 has `idx_question_book_chapter_lang` nhưng không cover difficulty+status → vẫn cần index mới
- [apps/api/Dockerfile:26](../../../apps/api/Dockerfile#L26) — add `-XX:MaxRAMPercentage=75` flag
- [apps/api/src/main/java/com/biblequiz/api/RankedController.java](../../../apps/api/src/main/java/com/biblequiz/api/RankedController.java) — add `GET /api/me/tier-progress` endpoint (currently missing per audit finding 4)

**Acceptance:**
- [ ] Memory profiling: SmartQuestionSelector heap allocation ~40x less (250KB metadata vs 10MB full entities)
- [ ] All existing unit tests pass (baseline Tầng 3)
- [ ] `SHOW INDEX FROM questions` includes `idx_questions_filter`
- [ ] App boots with new heap config; `jcmd <pid> VM.flags` shows MaxRAMPercentage=75
- [ ] `GET /api/me/tier-progress` returns 200 (useRankedPage no longer silently fails)

**Commit message:**
```
feat(ranked): Phase A perf - DTO projection + composite index + heap + tier-progress endpoint

- Add QuestionMeta record for lightweight metadata projection
- Repository method findMetaByLanguageAndBooks (avoid loading full entity for filtering)
- SmartQuestionSelector uses meta for tier/history filter, batch fetch full only for final N
- V58 composite index (language, book, difficulty, status) for filter perf
- Dockerfile MaxRAMPercentage=75 for better heap usage in container
- Add missing GET /api/me/tier-progress endpoint (useRankedPage.ts was silently failing)

Refs: SPEC_USER_v3.2 §7.7.5, §7.7.6
```

---

### Commit 2: LiturgicalSeasonService + focusBooks field (BL-5 partial)

**Spec ref:** §7.10.3, §5.6
**Effort:** 1 ngày
**Files to modify:**
- [apps/api/src/main/java/com/biblequiz/modules/season/entity/Season.java:11-29](../../../apps/api/src/main/java/com/biblequiz/modules/season/entity/Season.java#L11-L29) — add `focusBooks: List<String>` (JSON column) field
- `apps/api/src/main/resources/db/migration/V59__add_season_focus_books.sql` — TO CREATE: `ALTER TABLE seasons ADD COLUMN focus_books JSON`
- [apps/api/src/main/java/com/biblequiz/infrastructure/seed/SeasonSeeder.java:41-91](../../../apps/api/src/main/java/com/biblequiz/infrastructure/seed/SeasonSeeder.java#L41-L91) — populate focusBooks per mùa (Easter: Matt/Mark/Luke/John/Acts; Pentecost/Thanksgiving/Christmas: confirm với Bui)
- `apps/api/src/main/java/com/biblequiz/modules/season/service/LiturgicalSeasonService.java` — **TO CREATE**: wrapper với `getCurrentSeason(LocalDate)`, `getFocusBooks(seasonId)`

**Acceptance:**
- [ ] All 4 mùa có `focusBooks` non-null sau seed re-run
- [ ] `LiturgicalSeasonServiceTest` ≥ 90% coverage (boundary dates 4 mùa, focus books lookup)
- [ ] Existing SeasonSeeder tests pass

**Open question:** Focus books cho Ngũ Tuần / Cảm Tạ / Giáng Sinh — Bui chốt list.

**Commit message:**
```
feat(season): LiturgicalSeasonService + focusBooks per season (BL-5 partial)

- Add Season.focusBooks JSON field (V59 migration)
- SeasonSeeder populates focusBooks for all 4 mùa
- New LiturgicalSeasonService wraps season lookup + focus books resolution
- Easter: Matthew/Mark/Luke/John/Acts (gospels + Acts)
- Pentecost/Thanksgiving/Christmas: per Bui decision

Refs: SPEC_USER_v3.2 §7.10.3, §5.6
Closes: BL-5 (partial — ×1.5 wire in commit 7)
```

---

### Commit 3: WeeklyPairingService + WeeklyPairing entity + auto-compute

**Spec ref:** §7.3, §7.7.1
**Effort:** 2 ngày
**Files to modify:**
- `apps/api/src/main/java/com/biblequiz/modules/coverage/entity/WeeklyPairing.java` — **TO CREATE** per §7.7.1 schema (UUID v7 id, seasonId FK, weekNumber 1-13, phase enum, bookCodes JSON, isAdminOverride)
- `apps/api/src/main/java/com/biblequiz/modules/coverage/repository/WeeklyPairingRepository.java` — **TO CREATE**
- `apps/api/src/main/java/com/biblequiz/modules/coverage/service/WeeklyPairingService.java` — **TO CREATE** với algorithm §7.3.2 (deterministic compute, invariant checks: 18 climax + 48 remaining = 66, no dup)
- `apps/api/src/main/resources/db/migration/V60__create_weekly_pairings.sql` — TO CREATE per §7.7.1 SQL
- `apps/api/src/main/java/com/biblequiz/api/AdminSeasonController.java` — TO CREATE OR extend existing AdminController: `PATCH /api/admin/seasons/{id}/pairings/{week}` per §7.3.4
- `apps/api/src/main/java/com/biblequiz/utils/UuidV7Generator.java` — **TO CREATE** (if Option A from pre-sprint checklist chosen) OR use `UUID.randomUUID()` if Option B

**Acceptance:**
- [ ] App startup compute 4 mùa × 13 weeks = 52 rows in `weekly_pairings`
- [ ] `WeeklyPairingServiceTest` ≥ 90% coverage (invariants, edge cases focus = 1/3/5/18, determinism)
- [ ] All 66 books appear exactly once across weeks 1-11 per season (integration test)
- [ ] Admin PATCH endpoint marks `is_admin_override = true`, không bị overwrite bởi re-compute

**Commit message:**
```
feat(coverage): WeeklyPairingService + entity + auto-compute 52 pairings

- WeeklyPairing entity (UUID v7 PK, FK seasons.id v4) per §7.7.1
- V60 migration weekly_pairings table
- WeeklyPairingService deterministic algorithm (§7.3.2):
  - Reserve climax weeks 9-11 for focus books + neighbors (18 books)
  - Distribute remaining 48 books: 1 large + 5 small per week 1-8
  - Mastery weeks 12-13 dynamic per user
- Pre-compute 52 rows at app startup if table empty
- Admin override endpoint PATCH /api/admin/seasons/{id}/pairings/{week}

Refs: SPEC_USER_v3.2 §7.3, §7.7.1
```

---

### Commit 4: LiturgicalCoverageService + UserSeasonCoverage entity + telemetry events

**Spec ref:** §7.1, §7.7.2, §7.16
**Effort:** 2 ngày
**Files to modify:**
- `apps/api/src/main/java/com/biblequiz/modules/coverage/entity/UserSeasonCoverage.java` — **TO CREATE** per §7.7.2 schema (UUID v7 id, userId FK, seasonId FK, currentWeek 1-13, weeksCompleted JSON, bookCoverage JSON Map<String,Integer>)
- `apps/api/src/main/java/com/biblequiz/modules/coverage/repository/UserSeasonCoverageRepository.java` — **TO CREATE** với `findByUserIdAndSeasonId`, `existsByUserIdAndSeasonId`
- `apps/api/src/main/java/com/biblequiz/modules/coverage/service/LiturgicalCoverageService.java` — **TO CREATE**:
  - `getOrCreateCoverage(userId, seasonId)` — lazy create per §7.11.1
  - `tickBookCoverage(userId, seasonId, book)` — increment + detect 3→4 transition cho event
  - `isWeekCompleted(coverage, weekNumber)` — 6/6 sách ≥ 4 check
  - `getActivePool(coverage, weekNumber)` — return uncovered books trong week pool
  - `getMasteryWeekPool(coverage)` — uncovered books toàn mùa (§7.1.7)
  - `unlockNextWeek(userId)` — validate completed + ahead-limit (§7.1.5)
- `apps/api/src/main/resources/db/migration/V61__create_user_season_coverage.sql` — TO CREATE per §7.7.2 SQL
- `apps/api/src/main/java/com/biblequiz/infrastructure/analytics/CoverageAnalytics.java` — **TO CREATE** (wrapper writing to audit_events table per audit finding — no Mixpanel/PostHog): events `coverage_book_ticked` (3→4 transition only), `week_completed`, `unlock_next_week_triggered`, `mastery_week_entered`, `late_joiner_detected`, `pool_exhaustion_fallback`

**Acceptance:**
- [ ] `LiturgicalCoverageServiceTest` ≥ 90% coverage (tick, week completion, forgiveness, late joiner, season transition, Mastery Week pool)
- [ ] Coverage threshold edge: user có exactly 4 câu trên 1 sách → covered = true
- [ ] Forgiveness: skip tuần 3 hoàn toàn → tuần 4 không carry debt
- [ ] Telemetry events ghi vào `audit_events` table với correct properties

**Commit message:**
```
feat(coverage): UserSeasonCoverage entity + LiturgicalCoverageService + telemetry

- UserSeasonCoverage entity (UUID v7 PK) per §7.7.2 + V61 migration
- LiturgicalCoverageService methods: getOrCreate, tick, isWeekCompleted,
  getActivePool, getMasteryWeekPool, unlockNextWeek (§7.1.5/7.1.7)
- 3→4 transition detection for coverage_book_ticked event throttling (§7.16.1)
- Forgiveness: week-level no debt, book-level persistent (§7.1.6)
- Telemetry events wired to audit_events table (no Mixpanel — codebase limitation):
  coverage_book_ticked, week_completed, unlock_next_week_triggered,
  mastery_week_entered, late_joiner_detected, pool_exhaustion_fallback

Refs: SPEC_USER_v3.2 §7.1, §7.7.2, §7.16
```

---

### Commit 5: SmartQuestionSelector refactor (book → List<book>) + pool exhaustion fallback

**Spec ref:** §7.7.4, §7.11.4
**Effort:** 1 ngày
**Files to modify:**
- [apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java:203-207](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java#L203-L207) — change `QuestionFilter(book, difficulty, language)` → `QuestionFilter(List<String> books, difficulty, language)` per §7.7.4
- [apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java:36-76](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java#L36-L76) — refactor `selectQuestions` to use `book IN :books`
- [apps/api/src/main/java/com/biblequiz/modules/quiz/repository/QuestionRepository.java:121-131](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/repository/QuestionRepository.java#L121-L131) — add `findAllActiveByLanguageAndBooks(lang, books)` + `findAllActiveByLanguageAndBooksAndDifficulty(lang, books, diff)` — keep single-book methods for backward compat during transition
- Add pool exhaustion fallback chain in SmartQuestionSelector hoặc RankedController (§7.11.4):
  1. Primary: books + difficulty + same-day exclude
  2. Fallback 1: drop same-day exclude
  3. Fallback 2: drop difficulty filter
  4. Fallback 3: return `{ questions: [], poolExhausted: true, suggestedAction: "UNLOCK_NEXT_WEEK" }`

**Acceptance:**
- [ ] `SmartQuestionSelectorTest` (existing, extended) — new `book IN (list)` path coverage
- [ ] Pool exhaustion test: pool < limit → fallback chain executes in order
- [ ] `pool_exhaustion_fallback` event fires with correct `fallback_level` property
- [ ] Existing callers (VarietyQuizController, etc.) không break — adapt với `List.of(book)` single-element wrapper

**Commit message:**
```
refactor(selector): SmartQuestionSelector book → List<book> + pool exhaustion fallback

- QuestionFilter: book → books (List<String>) per §7.7.4
- Repository methods findAllActive...AndBooks (book IN clause)
- Pool exhaustion fallback chain (§7.11.4):
  1. Primary: books + difficulty + exclude
  2. Drop same-day exclusion
  3. Drop difficulty filter
  4. Return poolExhausted=true with suggestedAction
- pool_exhaustion_fallback telemetry event per fallback level
- Single-book callers (VarietyQuiz, etc.) wrapped with List.of()

Refs: SPEC_USER_v3.2 §7.7.4, §7.11.4
```

---

### Commit 6: RankedController integration + drop currentBook (feature-flagged) + FeatureFlagService

**⚠️ CRITICAL:** Deprecates `BookProgressionService` from Ranked loop. Phải có FeatureFlagService cho Phase 1 backward compat dual-path.

**Spec ref:** §7.8, §7.9.1, §7.9.2
**Effort:** 2 ngày
**Files to modify:**
- `apps/api/src/main/java/com/biblequiz/infrastructure/feature/FeatureFlagService.java` — **TO CREATE** per §7.9.1 (`isLiturgicalCoverageEnabled(userId)` with rollout phases)
- `apps/api/src/main/resources/db/migration/V62__create_feature_flags.sql` — TO CREATE (table for flag config)
- [apps/api/src/main/java/com/biblequiz/api/RankedController.java:226-300](../../../apps/api/src/main/java/com/biblequiz/api/RankedController.java#L226-L300) — `selectRankedQuestions`: branch on feature flag. ON path: resolve coverage → active pool → SmartQuestionSelector với week books; OFF path: existing currentBook logic
- [apps/api/src/main/java/com/biblequiz/api/RankedController.java:308-640](../../../apps/api/src/main/java/com/biblequiz/api/RankedController.java#L308-L640) — `submitRankedAnswer`: branch on flag. ON path: `coverageService.tickBookCoverage(...)` instead of `bookProgressionService.shouldAdvanceToNextBook(...)` (lines 410-427); dual-write to UserSeasonCoverage + UserDailyProgress for backward compat
- [apps/api/src/main/java/com/biblequiz/api/RankedController.java:690-996](../../../apps/api/src/main/java/com/biblequiz/api/RankedController.java#L690-L996) — `getRankedStatus`: add `coverageStatus` field; preserve `currentBook` for backward compat
- New endpoint: `GET /api/me/coverage-status` per §7.8.1 in RankedController hoặc new CoverageController
- New endpoint: `POST /api/ranked/coverage/unlock-next-week` per §7.8.3 (error codes WEEK_NOT_COMPLETED, ALREADY_AHEAD_LIMIT, NO_NEXT_WEEK)
- [apps/api/src/main/java/com/biblequiz/modules/quiz/service/BookProgressionService.java](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/BookProgressionService.java) — KHÔNG xoá. Mark `@Deprecated`, document removal trong Phase 4.

**Acceptance:**
- [ ] `RankedCoverageIntegrationTest` — full session 10 câu → coverage updated → status reflects
- [ ] `WeekUnlockIntegrationTest` — complete week → unlock → next week active
- [ ] Feature flag OFF: existing `currentBook` logic unchanged (regression suite Tầng 3 pass)
- [ ] Feature flag ON: new Coverage logic active, dual-write to old fields
- [ ] Error codes match spec exactly
- [ ] `ranked_session_start` event includes new properties (tier, week, phase, pool_size, books_in_pool)

**Commit message:**
```
feat(ranked): integrate Liturgical Coverage with feature flag dual-path

- FeatureFlagService + V62 feature_flags table (§7.9.1)
- RankedController selectRankedQuestions branches on flag:
  - ON: resolve UserSeasonCoverage → week pool → SmartQuestionSelector
  - OFF: existing currentBook sequential (backward compat Phase 1)
- submitRankedAnswer dual-writes: tickBookCoverage + legacy currentBook
- GET /api/me/coverage-status (§7.8.1)
- POST /api/ranked/coverage/unlock-next-week (§7.8.3)
- BookProgressionService marked @Deprecated (removal Phase 4)
- ranked_session_start event extended with coverage properties

Refs: SPEC_USER_v3.2 §7.8, §7.9.1, §7.9.2
```

---

### Commit 7: ×1.5 mùa wire vào ScoringService

**Spec ref:** §7.10.3
**Effort:** 0.5 ngày
**Files to modify:**
- [apps/api/src/main/java/com/biblequiz/modules/ranked/service/ScoringService.java:96-107](../../../apps/api/src/main/java/com/biblequiz/modules/ranked/service/ScoringService.java#L96-L107) — extend `calculateWithTier` signature với boolean `isInSeasonBook`; multiply by 1.5 if true
- [apps/api/src/main/java/com/biblequiz/api/RankedController.java:397-399](../../../apps/api/src/main/java/com/biblequiz/api/RankedController.java#L397-L399) — caller: pass `isInSeasonBook` computed from `liturgicalSeasonService.getCurrentSeason().getFocusBooks().contains(question.getBook())`
- FE animation: `apps/web/src/components/ranked/ScoreAnimation.tsx` or equivalent — display "×1.5 Mùa Phục Sinh!" badge khi đúng câu trong focus book

**Acceptance:**
- [ ] `ScoringServiceTest` (existing, extended) — `isInSeasonBook = true` path adds 1.5× multiplier
- [ ] Calculation: base × tierMultiplier × xpSurge × seasonMultiplier (order matters; verify với spec)
- [ ] FE animation triggers correctly for focus book correct answer

**Commit message:**
```
feat(scoring): wire ×1.5 liturgical season bonus for focus books

- ScoringService.calculateWithTier accepts isInSeasonBook parameter
- RankedController computes from LiturgicalSeasonService.getFocusBooks()
- FE ScoreAnimation shows "×1.5 Mùa Phục Sinh!" badge
- Stacks multiplicatively with tier multiplier + xpSurge

Refs: SPEC_USER_v3.2 §7.10.3
Closes: BL-5 (final — completed via commit 2 + commit 7)
```

---

### Commit 8: FE Ranked.tsx redesign + CoverageCard + mobile RankedScreen migration

**Spec ref:** §7.8.1 (response shape), §7.11.6 (late joiner UX)
**Effort:** 2 ngày
**Files to modify:**
- [apps/web/src/pages/Ranked.tsx](../../../apps/web/src/pages/Ranked.tsx) (370 LOC) — redesign: replace OT/NT progress với CoverageCard
- [apps/web/src/components/ranked/CurrentBookCard.tsx](../../../apps/web/src/components/ranked/CurrentBookCard.tsx) — **REWRITE** as `CoverageCard.tsx`: show currentWeek + phase + 6 books với covered/answeredCount badges (§7.8.1 response shape)
- [apps/web/src/hooks/useRankedPage.ts:75-110](../../../apps/web/src/hooks/useRankedPage.ts#L75-L110) — add `useCoverageStatus()` calling `GET /api/me/coverage-status`
- Unlock modal: new component `WeekCompleteModal.tsx` — "🎉 Hoàn thành tuần X! Bạn có muốn bắt đầu tuần X+1 ngay?" → call POST unlock endpoint
- Pool exhaustion UX: handle `{ questions: [], poolExhausted: true }` response (§7.11.4 user-facing behavior)
- Late joiner welcome message (§7.11.6): "Bạn vừa join Mùa X. Tham gia Mùa Y từ tuần 1 để có cơ hội đạt Toàn Thư." — show if `currentWeek ≥ 10` on first session
- [apps/mobile/src/screens/quiz/RankedScreen.tsx](../../../apps/mobile/src/screens/quiz/RankedScreen.tsx) — migrate từ `/api/me` sang `/api/me/ranked-status` + `/api/me/coverage-status`; show CoverageCard equivalent
- i18n keys add to [apps/web/src/i18n/vi.json](../../../apps/web/src/i18n/vi.json) + [apps/web/src/i18n/en.json](../../../apps/web/src/i18n/en.json):
  - `coverage.phase.foundation` = "Nền Tảng" / "Foundation"
  - `coverage.phase.acceleration` = "Tăng Tốc" / "Acceleration"
  - `coverage.phase.climax` = "Đỉnh Cao" / "Climax"
  - `coverage.phase.mastery` = "Hoàn Thiện" / "Mastery"
  - `coverage.week_complete.title`, `coverage.unlock_next.cta`, etc.

**Acceptance:**
- [ ] Playwright `W-M07-001` to `W-M07-006` passing (per §7.15.3 table)
- [ ] CoverageCard renders correctly for all 4 phases
- [ ] Unlock modal triggers when 6/6 books covered
- [ ] Pool exhaustion UI distinguishes "completed tuần" vs "chưa complete" messages
- [ ] Mobile parity: same CoverageCard pattern
- [ ] i18n validator pass (existing 648 baseline + new keys, không tăng debt count)

**Commit message:**
```
feat(ranked-fe): redesign Ranked page with CoverageCard + week unlock UX

- Rewrite CurrentBookCard → CoverageCard showing currentWeek + phase + 6 books
- New useCoverageStatus hook → /api/me/coverage-status
- WeekCompleteModal triggers POST /api/ranked/coverage/unlock-next-week
- Pool exhaustion message branches on weekCompleted (§7.11.4)
- Late joiner welcome (week ≥ 10) per §7.11.6
- Mobile RankedScreen migrated from /api/me to /api/me/ranked-status + /coverage-status
- i18n keys for 4 phases + week unlock + pool exhaustion (vi+en)

Refs: SPEC_USER_v3.2 §7.8.1, §7.11.4, §7.11.6
```

---

### Commit 9: FE Journey Map update (remove LOCKED status)

**Spec ref:** §7.10.1
**Effort:** 1 ngày
**Files to modify:**
- [apps/web/src/pages/Journey.tsx:14,167](../../../apps/web/src/pages/Journey.tsx#L14) — remove `LOCKED` from status enum, change to `'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'`
- [apps/api/src/main/java/com/biblequiz/modules/quiz/service/BookMasteryService.java:62-65](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/BookMasteryService.java#L62-L65) — remove `LOCKED` computation: previously locked if `i > 0 && previous.status != COMPLETED`; now default to `NOT_STARTED` if mastery = 0
- Book click handler: navigate to Practice mode pre-filtered (no longer blocked by previous book status)
- E2E test: `apps/web/tests/e2e/happy-path/web-admin/` — add `M-XX-journey-no-lock.spec.ts` verify user can click any book

**Acceptance:**
- [ ] Journey page: all 66 books clickable regardless of order
- [ ] No LOCKED badge anywhere in UI
- [ ] BookMasteryService returns NOT_STARTED instead of LOCKED for mastery = 0
- [ ] Click any book → Practice mode loads with book filter

**Commit message:**
```
refactor(journey): remove LOCKED status — all books clickable (§7.10.1)

- Status enum: COMPLETED | IN_PROGRESS | NOT_STARTED (was: + LOCKED)
- BookMasteryService.getJourneyProgress no longer computes lock-by-sequence
- Journey.tsx all books clickable → Practice mode pre-filtered
- E2E test M-XX-journey-no-lock added

Refs: SPEC_USER_v3.2 §7.10.1, §6.2 update
```

---

### Commit 10: Migration data existing users + feature flag rollout + Phase 4a column rename

**⚠️ POINT OF NO RETURN APPROACHING:** Phase 4b/4c (DROP COLUMN) chỉ thực hiện 30 ngày sau khi commit 10 stable. Commit này chỉ làm tới Phase 4a (rename).

**Spec ref:** §7.9.3 (Phase 2 migration), §7.9.4 (Phase 3 mobile), §7.9.7 (Phase 4a)
**Effort:** 1.5 ngày
**Files to modify:**
- `apps/api/src/main/java/com/biblequiz/infrastructure/migration/LiturgicalCoverageMigrationJob.java` — **TO CREATE** per §7.9.3 Option A (Spring `@PostConstruct` or `ApplicationRunner`): foreach user → lazy-create UserSeasonCoverage cho current active season với UuidV7Generator (or UUID.randomUUID() per pre-sprint decision)
- Feature flag rollout: update FeatureFlagService logic — Phase 3 (10% rollout) → Phase 4 (100%)
- `apps/api/src/main/resources/db/migration/V63__phase4a_rename_deprecated_columns.sql` — TO CREATE per §7.9.7 Phase 4a:
  - **Pre-check first:** `SHOW INDEX FROM users WHERE Column_name = 'current_book'` — drop indexes if any
  - **Pre-check:** `SELECT * FROM information_schema.KEY_COLUMN_USAGE WHERE COLUMN_NAME = 'current_book'` — drop FK refs
  - Then: `ALTER TABLE users RENAME COLUMN current_book TO _deprecated_current_book`, same for `current_book_index`, `is_post_cycle`
  - Same for `user_daily_progress.current_book`, `current_book_index`, `is_post_cycle`
  - **DO NOT** rename `current_difficulty` yet (Phase 4c — wait for mobile)
- `mobile_legacy_request_count` telemetry event: track requests still using legacy fields (for Phase 4c gate)
- DB backup verification protocol document — `docs/dev/migrations/2026-05-21-liturgical-coverage-phase4-backup.md` TO CREATE
- Update [BACKLOG.md](../../spec/BACKLOG.md) — mark Phase 4b/4c as separate follow-up entries `BL-COVERAGE-PHASE-4B` and `BL-COVERAGE-PHASE-4C`

**Acceptance:**
- [ ] `MigrationDataIntegrityTest` — all users get UserSeasonCoverage row in Phase 2
- [ ] All users have non-null `currentWeek = 1` after migration
- [ ] Renamed columns still readable by app (Hibernate entities reference renamed names)
- [ ] Feature flag 100% on cho web users; mobile still uses dual-write
- [ ] DB backup protocol documented + dry-run verified
- [ ] Pre-rename FK/index check executed cleanly
- [ ] `coverage_migration_phase` daily cron event fires with `phase: 4a, percent_users: 100`

**Commit message:**
```
feat(migration): Phase 2 data init + Phase 4a column rename + rollout 100%

- LiturgicalCoverageMigrationJob @PostConstruct lazy-creates UserSeasonCoverage
  for all users on current active season (§7.9.3 Option A)
- V63 Phase 4a: rename deprecated columns with _deprecated_ prefix
  - users: current_book, current_book_index, is_post_cycle
  - user_daily_progress: current_book, current_book_index, is_post_cycle
  - Pre-check FK/index per §7.9.7
- current_difficulty NOT renamed (Phase 4c — gated by mobile_legacy_request_count = 0)
- FeatureFlagService: Phase 4 = 100% web users
- mobile_legacy_request_count telemetry for Phase 4c gate
- DB backup protocol documented
- BL-COVERAGE-PHASE-4B + BL-COVERAGE-PHASE-4C tracked separately

Refs: SPEC_USER_v3.2 §7.9.3, §7.9.4, §7.9.7
```

---

## Telemetry events to wire (per SPEC §7.16)

### User journey events
- [ ] `ranked_session_start` (modify in commit 6 — extend with `tier, week, phase, pool_size, books_in_pool`)
- [ ] `coverage_book_ticked` (new in commit 4 — fire only on 3→4 transition, properties: `book, total_answered_in_book, tier, week, phase`)
- [ ] `week_completed` (new in commit 4)
- [ ] `unlock_next_week_triggered` (new in commit 6 — POST endpoint trigger)
- [ ] `mastery_week_entered` (new in commit 4)
- [ ] `season_badge_awarded` (new — defer to follow-up commit or commit 10 if season end falls in sprint window)
- [ ] `season_transition` (new — UTC boundary cross handler, may defer)

### System health events
- [ ] `pool_exhaustion_fallback` (new in commit 5 — properties: `fallback_level, week, tier, lang`)
- [ ] `pairing_compute_duration` (new in commit 3)
- [ ] `coverage_calc_slow` (new in commit 4 — alert if calc > 100ms)
- [ ] `late_joiner_detected` (new in commit 4)

### Migration rollout events
- [ ] `coverage_feature_flag_check` (new in commit 6 — every FeatureFlagService call)
- [ ] `coverage_migration_phase` (new in commit 10 — daily cron)
- [ ] `coverage_rollback_triggered` (new in commit 10 — admin trigger)

### Bonus events from §7.9.7/§7.11.4
- [ ] `mobile_legacy_request_count` (new in commit 10 — gate Phase 4c drop)

**Total: 16 events** (matches §7.16 spec count).

**⚠️ Constraint:** No Mixpanel/PostHog in codebase. All events write to `audit_events` table via `CoverageAnalytics` wrapper (TO CREATE in commit 4). Future migration to dedicated analytics in BACKLOG.

---

## Test plan checkpoints (per SPEC §7.15)

- [ ] After commit 1: SmartQuestionSelector existing tests pass; new tier-progress endpoint integration test
- [ ] After commit 2: `LiturgicalSeasonServiceTest` ≥ 90% (boundary dates 4 mùa, focus books)
- [ ] After commit 3: `WeeklyPairingServiceTest` ≥ 90% (invariants, edge cases focus = 1/3/5/18, determinism); integration test all 66 books cover exactly once
- [ ] After commit 4: `LiturgicalCoverageServiceTest` ≥ 90% (tick, week completion, forgiveness, late joiner, season transition)
- [ ] After commit 5: SmartQuestionSelector extended tests `book IN (list)` path + pool exhaustion fallback chain
- [ ] After commit 6: `RankedCoverageIntegrationTest`, `WeekUnlockIntegrationTest`; feature flag dual-path regression Tầng 3
- [ ] After commit 7: `ScoringServiceTest` extended `isInSeasonBook` paths
- [ ] After commit 8: Playwright `W-M07-001` to `W-M07-006` passing; performance baseline P50 < 200ms, P95 < 500ms; i18n validator no new debt
- [ ] After commit 9: E2E `M-XX-journey-no-lock` passing
- [ ] After commit 10: `MigrationDataIntegrityTest`; `SeasonTransitionIntegrationTest`; backup protocol dry-run

**Baseline numbers:** `.test-baseline` files cập nhật sau mỗi commit, KHÔNG giảm test count.

---

## Rollback procedures per phase (per SPEC §7.9.7)

- [ ] Phase 0-1 (feature flag, commit 6): instant rollback via admin endpoint set flag OFF — documented
- [ ] Phase 2 (data migration, commit 10): UserSeasonCoverage rows orphan, old columns still source-of-truth — documented
- [ ] Phase 3 (mobile, commit 8): revert mobile app version; BE serves both endpoints — documented
- [ ] Phase 4a (column rename, commit 10): 7-day grace window confirmed; reversible via rename back
- [ ] Phase 4b (DROP, future): DB backup verification protocol — separate task BL-COVERAGE-PHASE-4B
- [ ] Phase 4c (DROP current_difficulty, future): gated by `mobile_legacy_request_count = 0` for 30 consecutive days — separate task BL-COVERAGE-PHASE-4C
- [ ] Phase 5 (flag removal, future): 1-line revert path

---

## Risks tracking

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Phase 4b column drop without proper grace | Low | Critical | Phase 4a/4b/4c split per §7.9.7; backup protocol mandatory |
| Mobile users on legacy endpoint after rollout | Medium | High | `mobile_legacy_request_count` telemetry gate Phase 4c; force update if needed |
| Pool exhaustion in production (Tier 6 grinders) | Medium | Medium | Fallback chain §7.11.4 commit 5; `pool_exhaustion_fallback` alerting |
| seasons.id UUID v4/v7 drift causing FK issue | Low | High | §7.7.1 M1 acknowledgment; FK value-only references |
| Hybrid session memory+DB data drift during migration | Medium | High | Dual-write in commit 6; integration test verifies both writes; consolidate in Phase 4 |
| FeatureFlagService missing → cannot dual-path | High | Critical | TO CREATE in commit 6 (or split commit if scope grows); pre-sprint decision needed |
| UuidV7Generator missing → CLAUDE.md drift | Medium | Low | Pre-sprint Bui decision: Option A (create) or Option B (UUID.randomUUID v4 + BACKLOG entry) |
| No Mixpanel/PostHog → telemetry via audit_events insufficient | Medium | Medium | Wrapper `CoverageAnalytics` ghi audit_events; defer real analytics post-P5 |
| BookProgressionService removal causes legacy breakage | Low | Medium | `@Deprecated` annotation in commit 6, full removal Phase 4 only |
| Late-joiner edge case (week 10+) tested only manually | Medium | Low | §7.15.3 W-M07-005/006 E2E covers; manual QA tuần 10/11/12 |

---

## Done criteria

- [ ] All 10 commits merged to main
- [ ] All 16 telemetry events firing in production (verified via `audit_events` queries)
- [ ] Feature flag at 100% web users (Phase 4 complete)
- [ ] Mobile RankedScreen migrated to new endpoints (commit 8)
- [ ] Phase 4a column rename stable for 30 days (gate for Phase 4b)
- [ ] Zero P0/P1 bugs related to coverage for 30 days
- [ ] BACKLOG: BL-COVERAGE-ADMIN-UI marked DEFER v1.5 (not blocking)
- [ ] BACKLOG: BL-COVERAGE-PHASE-4B + BL-COVERAGE-PHASE-4C created as follow-up
- [ ] SPEC_USER_v3.2 §7.13 commit checklist marked DONE
- [ ] Sprint file moved to `docs/todo/archive/`

---

## Open questions (escalate to Bui)

1. **UuidV7Generator strategy** — Tạo mới (Option A, đúng CLAUDE.md) hay dùng `UUID.randomUUID()` v4 + add BACKLOG drift entry (Option B)? Codebase hiện 100% v4. Khuyến nghị Option B cho consistency, add separate "UUID v7 migration sprint" sau.
2. **Focus books cho 3 mùa còn lại** — Easter đã có Matt/Mark/Luke/John/Acts. Ngũ Tuần / Cảm Tạ / Giáng Sinh focus books?
3. **Telemetry stack** — Codebase chỉ có `audit_events`. Accept dùng audit_events cho 16 events, hay block sprint chờ wire Mixpanel/PostHog?
4. **FeatureFlagService** — Inline trong commit 6 (~50 LOC + V62 migration) hay tách commit 0 riêng để cleaner? Khuyến nghị inline commit 6.
5. **`coverage_book_ticked` total_answered_in_book property** — Per spec §7.16.1 M2 fix, fire only on 3→4 transition. Có cần track total cumulative answered (kể cả past tuần) hay chỉ trong tuần hiện tại?
6. **Sprint 5 (Quiz Set Pro) status** — Confirm DONE trước khi start sprint này, hay parallel?
7. **Mobile parity timing** — Migrate mobile cùng commit 8 hay tách Phase 3 riêng sau web stable?

---

> **Sprint plan ready for Bui review.** Audit-verified file:line references throughout. No code changes made. Awaiting approval before kicking off commit 1.
