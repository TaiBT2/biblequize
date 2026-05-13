# 2026-04-29 — Bible Basics Catechism Quiz [IN PROGRESS]

> Replace Ranked unlock gate (XP/practice-accuracy) with a fixed 10-question
> doctrinal quiz. Pass 8/10 = unlock Ranked permanently. See
> docs/prompts/PROMPT_BIBLE_BASICS_QUIZ.md.
>
> Step 0 verified — 8 prompt overrides accepted (V31 not V29; multiple_choice_single;
> verse_start/verse_end split; new `category` column; JSON seed not SQL Flyway;
> co-exist with legacy earlyRankedUnlock; reuse BusinessLogicException).

### Step 1: Schema migration + entity fields [x] DONE
- [V31__add_basic_quiz_unlock.sql](apps/api/src/main/resources/db/migration/V31__add_basic_quiz_unlock.sql) — adds users.basic_quiz_* (4 cols) + questions.category + idx_questions_category
- [Question.java](apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java) — adds `category` field + getter/setter
- [User.java](apps/api/src/main/java/com/biblequiz/modules/user/entity/User.java) — adds basicQuizPassed/PassedAt/Attempts/LastAttemptAt + accessors
- BE compile + test-compile clean. Preexisting failures (DuplicateDetectionService bean missing in test ctx, QuestionReviewControllerTest.stats JSON path) confirmed on baseline — not introduced by Step 1.

### Step 1.5: JSON seed + extend QuestionSeeder for category [x] DONE
- [SeedQuestion.java](apps/api/src/main/java/com/biblequiz/infrastructure/seed/question/SeedQuestion.java) — adds optional `category` field
- [QuestionSeeder.java](apps/api/src/main/java/com/biblequiz/infrastructure/seed/question/QuestionSeeder.java) — `toEntity()` plumbs `category` through to `Question.category`
- [bible_basics_quiz.json](apps/api/src/main/resources/seed/questions/bible_basics_quiz.json) — 10 VI catechism questions, all `category="bible_basics"`
- [bible_basics_quiz_en.json](apps/api/src/main/resources/seed/questions/bible_basics_quiz_en.json) — 10 EN translations
- Câu 4 reference đổi từ John 1:1,14 → Cô-lô-se 2:9 (verseStart=9, verseEnd=null) — VI + EN explanation updated to quote Col 2:9
- DB verified: 20 rows seeded (10 vi + 10 en), all `category='bible_basics'`, idempotent (re-seed skips all 20)
- BE regression: 663 tests, 1 failure + 51 errors — IDENTICAL to Step 1 baseline (all preexisting, none introduced)

### Step 2: BasicQuizService + 3 endpoints + replace Ranked gate [x] DONE
- [QuestionRepository.java](apps/api/src/main/java/com/biblequiz/modules/quiz/repository/QuestionRepository.java) — added `findByCategoryAndLanguageAndIsActiveTrue` + count variant
- 4 DTOs in [api/dto/basicquiz/](apps/api/src/main/java/com/biblequiz/api/dto/basicquiz/): Status, Question, Submit, Result responses
- [BasicQuizCooldownException.java](apps/api/src/main/java/com/biblequiz/modules/quiz/exception/BasicQuizCooldownException.java) extends BusinessLogicException, holds `secondsRemaining`
- [GlobalExceptionHandler.java](apps/api/src/main/java/com/biblequiz/infrastructure/exception/GlobalExceptionHandler.java) — specific handler returns `secondsRemaining` in body
- [BasicQuizService.java](apps/api/src/main/java/com/biblequiz/modules/quiz/service/BasicQuizService.java) — getStatus / getQuestions (shuffled, no answers) / submitAttempt (server-side scoring, cooldown enforcement, idempotent on already-passed)
- [BasicQuizController.java](apps/api/src/main/java/com/biblequiz/api/BasicQuizController.java) — `GET /status`, `GET /questions?language`, `POST /submit`
- [SessionService.java:79-90](apps/api/src/main/java/com/biblequiz/modules/quiz/service/SessionService.java#L79-L90) — Ranked gate replaced: now checks `basicQuizPassed` only (legacy earlyRankedUnlock fields untouched, dead-but-co-existing until V32)
- [BasicQuizServiceTest.java](apps/api/src/test/java/com/biblequiz/service/BasicQuizServiceTest.java) — 11 tests cover fresh status, cooldown active, passed, getQuestions happy/incomplete-seed, pass 8/10, perfect 10/10, fail 7/10 with review, cooldown rejection, already-passed rejection, unknown questionId rejection
- BE regression: 674 tests (+11 new), 1 failure + 51 errors — all preexisting (DuplicateDetectionService cascade, QuestionReviewControllerTest.stats); 0 new failures from Step 2
### Step 3: BasicQuizCard FE component (4 states) [x] DONE
- [BasicQuizCard.tsx](apps/web/src/components/BasicQuizCard.tsx) — 4 states (first/retry/cooldown/passed) with local 1s countdown + server refetch on hit zero
- [Home.tsx](apps/web/src/pages/Home.tsx) — BasicQuizCard mounted above GameModeGrid section
- i18n: `basicQuiz.card.*` namespace added to vi.json + en.json (12 keys covering 4 states)
- [BasicQuizCard.test.tsx](apps/web/src/components/__tests__/BasicQuizCard.test.tsx) — 8 test cases: 4 states + 2 navigations + cooldown ticker + skeleton
- FE regression: 1009 tests pass, 100 files (incl. BasicQuizCard.test 8 new); 0 regressions
- i18n validator: 123 hardcoded / 0 missing → IDENTICAL to baseline before Step 3
### Step 4: BasicQuiz page (10 Q + result screens) [x] DONE
- [main.tsx](apps/web/src/main.tsx) — added `/basic-quiz` route inside AppLayout group, wrapped in RequireAuth
- [BasicQuiz.tsx](apps/web/src/pages/BasicQuiz.tsx) — 10-question MCQ player + result screens (pass / fail with review). No timer, no energy, no streak per spec.
- Phase machine: loading → playing → submitting → result; live cooldown countdown on fail screen
- i18n: `basicQuiz.page.*` namespace added (22 keys covering header, prev/next/submit, error path, pass screen, fail review, cooldown msg)
- [BasicQuiz.test.tsx](apps/web/src/pages/__tests__/BasicQuiz.test.tsx) — 6 cases: render question, submit-disabled until all answered, prev/next preserves answer, pass screen + nav to /ranked, fail screen review, error path with retry
- FE regression: 1015 tests, 101 files (+6 new tests); 0 regressions
- i18n validator: 123 hardcoded / 0 missing — IDENTICAL baseline
### Step 5: Admin filter + 10-min safeguard on delete [x] DONE
- BE: [QuestionRepository.java](apps/api/src/main/java/com/biblequiz/modules/quiz/repository/QuestionRepository.java) — `findWithAdminFilters` now accepts `category` (8th param)
- BE: [AdminQuestionController.java](apps/api/src/main/java/com/biblequiz/api/AdminQuestionController.java) — `?category` query param + `assertBibleBasicsSafeguard` helper applied to delete / bulkDelete / update (active→inactive transition); throws `BusinessLogicException` if pool would drop < 10 active per language
- BE: incidental fix — added `@MockBean DuplicateDetectionService` to `AdminQuestionControllerTest` (preexisting test setup bug that cascaded 15 tests + 51 context errors across the suite)
- BE tests: 5 new safeguard tests + 4 fixed signatures = 20 tests pass (was 0/15 before fix)
- FE: [pages/admin/Questions.tsx](apps/web/src/pages/admin/Questions.tsx) — Category filter dropdown + Bible Basics badge on rows + `category` plumbed into fetchParams
- i18n: `admin.questions.filter.{categoryLabel,categoryAll,categoryBibleBasics}` (vi + en)
- BE regression: 679 tests, 1 failure + 36 errors (was 1+51 — net **-15 cascading errors fixed** by incidental test setup repair); 0 regressions introduced
- FE regression: 1015 tests, 0 regressions
### Step 6: i18n strings + remove old XP-unlock keys [x] DONE
- [Home.tsx](apps/web/src/pages/Home.tsx) — unmounted EarlyRankedUnlockModal, removed `useEarlyUnlockCelebration` hook + `practiceAccuracyPct` import
- Deleted 4 obsolete files:
  - `components/EarlyRankedUnlockModal.tsx`
  - `components/__tests__/EarlyRankedUnlockModal.test.tsx`
  - `hooks/useEarlyUnlockCelebration.ts`
  - `hooks/__tests__/useEarlyUnlockCelebration.test.ts`
- i18n: dropped `modals.earlyUnlock.*` (9 keys × 2 langs) — modal no longer exists
- FAQ rewrite: `faq.howStart` and `faq.howUnlockRanked` (vi + en) — old text described "≥80% practice → early unlock" and "1,000 XP path"; replaced with "complete Bible Basics catechism, score ≥8/10" guidance
- DEFERRED to follow-up PR (scope creep avoidance):
  - Drop `requiredTier:2` from GameModeGrid Ranked card config (would require updating ~6 dependent unit tests in GameModeGrid.test.tsx that assert lock-state UI)
  - Decommission `EarlyUnlockMetrics` admin page + `admin.earlyUnlock.*` keys (deferred until BE V32 drops the underlying earlyRankedUnlock fields)
- Verification: 997 FE tests pass (was 1015 → -18 from deleted modal+hook tests; 0 regressions); i18n validator clean (123 hardcoded / 0 missing); `npm run build` succeeds
### Step 7: Full regression [x] DONE 2026-04-29
**Test counts vs. pre-feature baseline:**

| Suite | Baseline | Final | Delta | Notes |
|---|---|---|---|---|
| BE | 663 / 1F + 51E | **679** / 1F + 36E | **+16 tests, −15 errors** | +11 BasicQuizServiceTest, +5 admin safeguard. -15 errors from incidental fix to AdminQuestionControllerTest's missing @MockBean. All remaining 1F + 36E preexisting (DuplicateDetectionService cascade, QuestionReviewControllerTest.stats JSON path), unrelated to Bible Basics work. |
| FE | 1009 / 0F | **997** / 0F | −12 net | +14 new tests (BasicQuizCard 8 + BasicQuiz 6), −26 deleted (EarlyRankedUnlockModal + useEarlyUnlockCelebration tests). Zero new failures. |
| FE i18n validator | 123 hardcoded / 0 missing | **123 / 0** | unchanged | No new debt introduced. |
| FE `npm run build` | green | **green** | — | 9.29s. |

**Liveness checks:**
- ✅ BE booted on :8080 (native via `mvnw spring-boot:run`)
- ✅ Flyway: V31 `add basic quiz unlock` applied (success=1 in flyway_schema_history)
- ✅ DB: 10 active vi + 10 active en bible_basics rows
- ✅ `GET /api/basic-quiz/status` → 401 (correct: auth-required endpoint reachable)
- ✅ `GET /api/basic-quiz/questions` → 401 with structured JSON error envelope

**6 commits shipped (oldest first):**
```
7cbfb1f  feat(db):    V31 schema for Bible Basics catechism quiz unlock
41ff511  feat(seed):  bible basics catechism — 10 VI/EN questions + extend seeder
8e46824  feat(api):   BasicQuizService + 3 endpoints + replace Ranked gate
19e3063  feat(home):  BasicQuizCard with 4 states + i18n + tests
65c8b7f  feat(quiz):  BasicQuiz page — 10-Q catechism player + result screens
4f186e9  feat(admin): Bible Basics — category filter + delete safeguard
2c3f35b  chore(home): retire EarlyRankedUnlockModal + obsolete unlock copy
```

**Follow-up items (deferred, separate PRs):**
- ~~Drop `requiredTier:2` + lock-state UI for Ranked card in GameModeGrid~~ — DONE 2026-04-29 in commit `2e424c8` (Ranked card removed entirely; BasicQuizCard banner is now the single Ranked gateway).

### v1.1 — Cleanup deprecated early ranked unlock system
> Sau khi Bible Basics Quiz stable trong production 1–2 tuần.

- [ ] V32 migration: `DROP COLUMN early_ranked_unlock, early_ranked_unlocked_at, practice_correct_count, practice_total_count` từ `users` table
- [ ] Backend: remove `SessionService.updateEarlyRankedUnlockProgress` + any remaining references; check `RankedController` and other callers
- [ ] Backend: retire `/api/admin/early-unlock-metrics` endpoint (+ service if dedicated)
- [ ] Frontend: delete `apps/web/src/pages/admin/EarlyUnlockMetrics.tsx` + its test + nav link in admin sidebar
- [ ] Frontend: drop `admin.earlyUnlock.*` i18n keys (vi + en, ~13 keys × 2 langs)
- [ ] TypeScript types: remove `earlyRankedUnlock`, `practiceCorrectCount`, `practiceTotalCount`, `earlyRankedUnlockedAt` from `User` / `UserResponse` / any DTOs
- [ ] `apps/web/src/utils/earlyUnlock.ts`: delete the entire module (orphan after Step 1.0 GameModeGrid surgery)
- [ ] Tests: clean up any remaining tests referencing the old early-unlock system

---
