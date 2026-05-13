# Audit Report: Quiz Set Editor Redesign (BL-AD-8 Phase A)

**Date:** 2026-05-13
**Prompt:** `docs/prompts/PROMPT_QUIZ_SET_EDITOR_PAGE.md`
**Mockups:** `docs/mockups/quiz_set_editor_unified_page.html` + `quiz_set_editor_mobile.html`

---

## Section 1: Backend — Group Quiz Set Endpoints

All quiz-set endpoints live in **`apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java`** (not a dedicated `GroupQuizSetController`). Base path `/api/groups/{id}`.

| Method | Path | Line | Request | Auth |
|---|---|---|---|---|
| POST | `/quiz-sets` | 334 | `Map{name, questionIds, …}` | `requireLeaderOrMod()` |
| GET | `/quiz-sets` | 382 | query: status, search, sort | member |
| PATCH | `/quiz-sets/{setId}` | 359 | `Map` (metadata **+** questions) | `requireLeaderOrMod()` |
| PATCH | `/quiz-sets/{setId}/publish` | 442 | empty | `requireLeaderOrMod()` |
| PATCH | `/quiz-sets/{setId}/archive` | 455 | empty | `requireLeaderOrMod()` |
| PATCH | `/quiz-sets/{setId}/unarchive` | 468 | empty | `requireLeaderOrMod()` |
| POST | `/quiz-sets/{setId}/clone` | 481 | empty | `requireLeaderOrMod()` |
| DELETE | `/quiz-sets/{setId}` | 494 | empty | `requireLeaderOrMod()` |
| POST | `/quiz-sets/{setId}/solo-practice` | 513 | `Map{questions}` | member |
| GET | `/quiz-sets/{setId}/my-mastery` | 563 | — | authenticated |
| GET | `/quiz-sets/{setId}/my-attempts` | 587 | — | authenticated |
| GET | `/quiz-sets/{setId}/leaderboard` | 646 | — | authenticated |
| POST | `/quiz-sets/custom` | 1027 | `Map{name, description, questions}` | `requireLeaderOrMod()` |
| POST | `/quiz-sets/{setId}/play` | 1128 | `Map{playerCount, …}` | authenticated |
| POST | `/ai-generate` | 965 | `Map{book, chapter, count, difficulty, …}` | `requireLeaderOrMod()` |

### Missing endpoints (must build in Phase B)

- **`POST /quiz-sets/{sid}/questions/{qid}/ai-rewrite`** — regen single question without auto-save (D8).
- **`POST /quiz-sets/{sid}/questions/reorder`** — bulk reorder body `{questionIds:[…]}`.
- **`POST /quiz-sets/{sid}/ai-generate`** — set-scoped AI gen that **saves directly to set**. Current `/api/groups/{id}/ai-generate` returns drafts and saves to question pool but does NOT auto-append to a set.
- **`POST /quiz-sets/{sid}/questions`** + **`PATCH /quiz-sets/{sid}/questions/{qid}`** + **`DELETE /quiz-sets/{sid}/questions/{qid}`** — granular per-question CRUD. Currently only the `PATCH /quiz-sets/{setId}` umbrella accepts bulk question payload.

### Reusable

- `PATCH /quiz-sets/{setId}` (line 359) already merges metadata + questions in one call → usable for debounced auto-save without new endpoint, but slot-level granularity is missing for ai-rewrite/single update.

---

## Section 2: Data Model

### GroupQuizSet entity
**File:** `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupQuizSet.java`

- `id` (line 23-24): String UUID
- `group` (line 26-28): ManyToOne → ChurchGroup
- `createdBy` (line 30-32): ManyToOne → User
- `name` (line 34-35), `description` (65-66), `coverImageUrl` (68-69), `coverScripture` (75-76), `authorNote` (78-79), `tags` JSON (71-73)
- **`questionIds`** (line 37-39): `List<?>` stored as JSON column `question_ids` via `JsonListConverter` — **no junction table**
- `difficulty` (81-82): enum `{EASY, MEDIUM, HARD, MIXED}`
- `publishStatus` (102-104): enum `PublishStatus { DRAFT, PUBLISHED, ARCHIVED, SOFT_DELETED }` — **line 19**, default `PUBLISHED`
- `estimatedDurationMin` (84-85), `playCount` (90-91), `averageRating` (93-94), `totalRatings` (96-97), `language` (60-61)

### Question entity
**File:** `apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java`

- `id` (17-19), `book` (21-22), `chapter` (24), `verseStart`/`verseEnd` (26-30)
- `difficulty` (32-34): enum `{easy, medium, hard}`
- `type` (36-38): enum `{multiple_choice_single, multiple_choice_multi, true_false, fill_in_blank}`
- `content` TEXT (40-41), `options` JSON (43-45), `correctAnswer` JSON list-of-int (47-49), `correctAnswerText` (58-59), `explanation` TEXT (51-52)
- `source` String (64): values include `"admin"`, `"ai-generated"`, `"group-custom"`
- `reviewStatus` (77-79): `{PENDING, ACTIVE, REJECTED}`
- **MISSING fields:** `groupId`, `quizSetId`, `scriptureRef` (composed from book+chapter+verse), per-question `aiProvider`/`createdBy`

**⚠️ Implication:** Questions are global pool entities; linkage is one-way via `GroupQuizSet.questionIds[]`. Cannot easily query "questions belonging to set X" except by IN clause on JSON ids. Reorder = mutate JSON array.

---

## Section 3: Frontend — Current Create Flow

**Two parallel flows exist** (both will be replaced):

### Flow A — Modal on GroupDetail
- **File:** `apps/web/src/components/group/CreateQuizSetModal.tsx` (774 LOC)
- **Triggers:** `apps/web/src/pages/GroupDetail.tsx:1528, 1557` (button `onClick={openCreateModal}`)
- **Tabs:** AI tạo (line 280-450) / Tự soạn (line 454-566)
- **API calls:**
  - `aiApi.post('/api/groups/{gid}/ai-generate')` line 118 (90s timeout)
  - `api.get('/api/groups/{gid}/ai-quota')` lines 81, 139
  - `api.post('/api/groups/{gid}/quiz-sets/custom')` line 163
- **Phase I:** delete this file + its imports

### Flow B — Page `QuizSetCreate` (metadata-only, NO question editor)
- **File:** `apps/web/src/pages/group/QuizSetCreate.tsx` (510 LOC)
- **Route:** `apps/web/src/main.tsx:143` `/groups/:id/quiz-sets/new` → renders `QuizSetCreate`
- **Behavior:** sets name + cover icon + tags + scripture only, then `createQuizSet()` line 63 and `navigate('/quiz-sets/{id}')` to QuizSetDetail (line 73). NO question CRUD UI.
- **Phase C decision:** REPLACE this component at route `:143` with new `QuizSetEditor`, OR keep file and rewrite its body. Recommended: rewrite content of `QuizSetCreate.tsx` → `QuizSetEditor.tsx` and update import in `main.tsx`.

### Route gap
- `apps/web/src/main.tsx:143` exists: `/groups/:id/quiz-sets/new`
- **MISSING:** `/groups/:id/quiz-sets/:setId/edit` — must add. Spec calls for `setId/edit` but current `:setId` (line 144) already routes to `QuizSetDetail` (play/view). Need to insert new route BEFORE `:setId` or use suffix `/edit`.

---

## Section 4: AI Generation for Group Context

### Existing endpoint
- `POST /api/groups/{id}/ai-generate` at `ChurchGroupController.java:965`
- Request: `Map{book, chapter, verseStart, verseEnd, topic, count, difficulty, language}`
- Response: `{success, questions, used, limit, remaining}` or 429 `{success:false, error:"QUOTA_EXCEEDED"}`
- **Saves to question pool** (table `questions`) but does NOT auto-append to a quiz set — caller must follow with `PATCH /quiz-sets/{setId}` to link.

### AI infrastructure
- **Router:** `apps/api/src/main/java/com/biblequiz/modules/adminai/provider/AIProviderRouter.java`
- **Request DTO:** `AIGenerationRequest.java:12-21` (scripture, difficulty, type, language, count 1-10, prompt sanitized, provider, claudeModels)
- **Result DTO:** `AIGenerationResult.java:10-14` (questions, inputTokens, outputTokens, providerUsed)
- **Quota service:** `apps/api/src/main/java/com/biblequiz/modules/adminai/quota/AIQuotaService.java:39` `tryAcquire(int)` + `:59` `snapshot()` — Redis key `ai:quota:{yyyy-MM-dd}` UTC, daily limit `biblequiz.ai.quota.daily-limit` default **200** (matches D9)
- **BL-AD-7 (DeepSeek)** dependency: `BedrockDeepSeekProvider.java` exists (modified in git status). Verify integration before Phase F.

### Missing for Phase F
- Set-scoped variant: `POST /quiz-sets/{sid}/ai-generate` that calls router + saves + auto-links to set in one transaction.
- Per-question rewrite: `POST /quiz-sets/{sid}/questions/{qid}/ai-rewrite` returning draft WITHOUT saving (per D8).

---

## Section 5: Mobile

**Status:** MISSING. No `apps/mobile/src/screens/*QuizSet*` files.

**Phase H scope:** responsive WEB only (`useMediaQuery('(max-width:768px)')` in QuizSetEditor.tsx). RN port deferred to a separate sprint.

---

## Section 6: Reusable Components

| Component | Location | Reusable? |
|---|---|---|
| Admin Question form | `apps/web/src/pages/admin/Questions.tsx:485-661` | **No — inline modal**, tightly coupled to admin state. Need to extract or rebuild for group context. |
| `qs-bg-deep`, `qs-badge-*`, `qs-difficulty-*` CSS classes | `apps/web/src/styles/*.css` | Yes — reuse for editor background + difficulty chips |
| `aiApi` client | `apps/web/src/api/client.ts:13` | Yes — 90s timeout already configured for AI calls |
| `quizSets.ts` API functions | `apps/web/src/api/quizSets.ts:66-231` | Yes — full CRUD + folders + mastery already typed |
| `AppLayout` | `apps/web/src/layouts/AppLayout.tsx` | Yes — Editor route stays inside AppLayout (sidebar + bottom nav) |
| Bible verse text endpoint | — | **MISSING:** `BookController.java:33` only returns structure (book/chapter/verses metadata), no verse text. **Phase E P1:** defer verse preview card, show reference only. |

---

## Section 7: Recommended Phase B-I Plan

### Phase B — Backend additions (new endpoints)

1. `POST /api/groups/{gid}/quiz-sets/{sid}/questions` — add 1 question (creates `Question`, pushes id into `questionIds[]`)
2. `PATCH /api/groups/{gid}/quiz-sets/{sid}/questions/{qid}` — partial update single question
3. `DELETE /api/groups/{gid}/quiz-sets/{sid}/questions/{qid}` — remove question + filter from `questionIds[]`
4. `POST /api/groups/{gid}/quiz-sets/{sid}/questions/reorder` — body `{questionIds:[uuid…]}` overwrite array
5. `POST /api/groups/{gid}/quiz-sets/{sid}/ai-generate` — wraps router + auto-link to set (per D4)
6. `POST /api/groups/{gid}/quiz-sets/{sid}/questions/{qid}/ai-rewrite` — returns draft, does NOT save

### Migrations needed
- **None for schema** — existing JSON `questionIds` column is sufficient.
- **Optional Flyway V56:** add index on `questions.id` (already PK, no need). **Confirm: no migration.**
- Highest existing: `V55__rooms_is_co_play.sql`.

### LOC estimate per phase

| Phase | LOC delta | Files touched |
|---|---|---|
| B (backend) | ~600 | ChurchGroupController.java + new DTOs + 15+ tests |
| C (routing + scaffold) | ~250 | main.tsx + rewrite QuizSetCreate→QuizSetEditor |
| D (sidebar) | ~700 | 6 new components |
| E (editor) | ~900 | 6 new components + auto-save hook |
| F (AI) | ~550 | 3 new components + 2 mutations |
| G (publish) | ~250 | navigation guard + publish modal |
| H (mobile) | ~750 | 5 mobile-specific layout components |
| I (cleanup) | -800 (delete) + 200 (spec) | delete CreateQuizSetModal + SPEC_GROUP §6.X |
| **Total** | **~3,400 LOC delta** | matches prompt estimate (2,500-3,500) |

### Risks

- **R1 (P1):** Concurrent edit by 2 leaders → last-write-wins on `PATCH /quiz-sets/{setId}` (per prompt P1). Acceptable for v1.
- **R2 (P0):** Question entity has no `source="group-{userId}"` field beyond generic `"group-custom"` — cannot distinguish AI-generated within group context. Decision: rely on `source` string convention (`"ai-group"` vs `"group-custom"`) — confirm in Phase B before coding.
- **R3 (P1):** Verse preview defer (no Bible text endpoint). Ship scripture ref input without preview card — UX gap vs mockup.
- **R4 (P0):** Existing `QuizSetCreate.tsx` metadata-only flow is reachable from links elsewhere. Need to grep for `to="/quiz-sets/new"` and verify no broken nav after rewrite.
- **R5 (P2):** `CreateQuizSetModal` referenced at `GroupDetail.tsx:1859-1864` and trigger lines 1528/1557 — Phase C must update BOTH render + trigger.

### Decisions locked (user confirmed 2026-05-13)

| # | Question | Decision |
|---|---|---|
| Q1 | File strategy | **NEW file** `apps/web/src/pages/group/QuizSetEditor.tsx`. Keep `QuizSetCreate.tsx` until Phase I cleanup. Update `main.tsx:143` to import new component. |
| Q2 | `/edit` route | **NEW route** `/groups/:id/quiz-sets/:setId/edit` inserted **before** `main.tsx:144` so `:setId` is not shadowed. |
| Q3 | Verse preview | **DEFER** to BL-AD-9. Phase E ships scripture ref input only (no italic gold card). Track in BACKLOG. |
| Q4 | `Question.source` | **`ai-group`** for AI-gen in group context, **`group-custom`** for manual. Sidebar source icon (✨ vs ✏️) dispatches on this string. |

---

## Section 8: Open Items / P0 Blockers

- **P0:** BL-AD-7 (DeepSeek Bedrock) — verify merged before Phase F. Files modified in git status (`AIProviderRouter.java`, `BedrockDeepSeekProvider.java`) suggest in-progress.
- **P0:** Confirm `Question.source` value convention with user before Phase B (R2).
- **P1:** Verse preview defer (R3).

---

*End of audit. Ready for user review → "go Phase B".*
