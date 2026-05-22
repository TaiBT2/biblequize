# Ranked Question Selection — Code Audit

**Date:** 2026-05-21
**Auditor:** Claude Code
**Scope:** Read-only audit of how the Ranked mode selects, scores and advances questions across BE + Web + Mobile.

---

## Executive Summary

1. The canonical Ranked selection path is `POST /api/ranked/questions/select` (`RankedController.java:226-300`). It resolves the caller's tier, delegates to `SmartQuestionSelector.selectQuestions` which distributes Easy/Medium/Hard% per `TierDifficultyConfig.java:12-22`, then post-filters by `excludeIds`. Web sends this endpoint with `book / difficulty / language` payload (`Ranked.tsx:49-55`).
2. **Mobile DOES NOT use this endpoint.** `RankedScreen.tsx:133-151` issues three legacy `GET /api/questions` calls (filtered → book-only → any-book) with **no tier distribution** — the exact pre-BL-20 pattern that the web side was migrated away from on 2026-05-20.
3. Liturgical seasons are seeded (`SeasonSeeder.java:35-100`) but are pure leaderboard frames — `SmartQuestionSelector` has zero references to "season" and `ScoringService.calculateWithTier` only multiplies by `×1.5` from `xpSurgeUntil` (admin-set milestone burst), never from the active season.
4. Book progression is two-track: `BookProgressionService.shouldAdvanceToNextBook` (50 Q / ≥60% accuracy, session-scope, `BookProgressionService.java:106-111`) AND a second mastery gate in `RankedController.java:572-585` (≥100 unique Q & ≥70 correct on `UserBookProgress`). Whichever fires first advances `UserDailyProgress.currentBook`. No Revelation→Genesis wraparound; `BookProgressionService.java:40-42` returns null at canon end and the session flips to `isPostCycle=true` with `currentDifficulty="hard"` (`RankedController.java:423-426`).
5. `currentBook` is round-tripped (FE reads it on `ranked-status`, sends it on `/select`, BE filters by it, persists post-advance) but is **not displayed anywhere on the main /ranked page** — `Ranked.tsx:1-12` imports `RankedHeader / TierProgressCard / SeasonCard / RankedActionFooter` only. `CurrentBookCard.tsx` exists in the codebase but is not rendered by `Ranked.tsx`.

---

## A. Backend Entry Points

### A.1 `POST /api/ranked/questions/select`

**File:** `apps/api/src/main/java/com/biblequiz/api/RankedController.java:226-300`

**Request body (parsed):**
```json
{ "limit": number?, "excludeIds": string[]?, "book": string?, "difficulty": string?, "language": string? }
```

**Flow:**
1. `:231-232` `limit` defaults to 10; clamped to `[1, 50]`, else reset to 10.
2. `:233-236` `book`, `difficulty`, `language` parsed via `stringOrNull`; `language` defaults to `"vi"`.
3. `:238-244` `excludeIds` parsed into a `Set<String>`.
4. `:246-253` Resolve caller `userId` from `Authentication` email → `UserRepository.findByEmail`.
5. `:255-258` Build `QuestionFilter(book, difficulty, language)` — `book` set null if blank; `difficulty` set null if blank OR `"all"`.
6. `:261-271` **Authenticated path** — call `smartQuestionSelector.selectQuestions(userId, limit + excludeSet.size() + 5, filter)`, then iterate result skipping `excludeIds`, take first `limit`.
7. `:274-286` **Fallback** — if `picked.size() < limit` AND `filter.book() != null`, re-call selector with `book=null` (same difficulty + language) and top up.
8. `:287-295` **Guest path** — `questionRepository.findAllActiveByLanguage(language)`, drop excludeIds, `Collections.shuffle`, take first `limit`.
9. `:297-299` Response: `{ "questions": List<Question> }`.

**No `@PreAuthorize`** — endpoint is reachable unauthenticated (guest branch) but `/ranked` is auth-gated client-side via `AppLayout` per the Javadoc comment at `:289-290`.

### A.2 `POST /api/ranked/sessions`

**File:** `RankedController.java:165-202`

Creates `sessionId = "ranked-" + System.currentTimeMillis()` (`:168`). Hydrates `Progress` from today's `UserDailyProgress` if user authenticated (`:178-189`). Returns `{ sessionId, currentBook, bookProgress }`. Does not select questions; FE must call `/ranked/questions/select` afterwards.

### A.3 `POST /api/ranked/sessions/{id}/answer`

**File:** `RankedController.java:308-640`

Submit flow (high level):
- `:317-329` server-side answer validation (`ScoringService.validateMultipleChoiceSingle` / `validateFillInBlank`).
- `:337` lookup/create in-memory `Progress` via `RankedSessionService.getOrCreate`.
- `:340-352` recover energy lazily from `UserDailyProgress.lastUpdatedAt`.
- `:354-362` early return `blocked=true` when `questionsCounted >= 100` OR `livesRemaining <= 0`.
- `:363-366` wrong answer → `livesRemaining -= 5`, reset streak.
- `:367` `questionsCounted = min(100, n+1)`.
- `:373-406` correct → `pointsToday += scoringService.calculateWithTier(...)` (passes `tierLevel`, `xpSurgeActive`).
- `:411-427` `bookProgressionService.shouldAdvanceToNextBook(...)` — first advance gate.
- `:451-487` upsert `UserDailyProgress` (lives/questionsCounted/points/asked-ids/currentBook/currentBookIndex/isPostCycle/currentDifficulty).
- `:496-503` `recordRankedQuestionHistory` (BL-21, see A.7).
- `:516` invalidate leaderboard cache; `:519-521` `seasonService.addPoints(user, earned, 1)`.
- `:550-586` per-book mastery — second advance gate (`UserBookProgress.answeredCount >= 100 && correctCount >= 70`).

### A.4 `GET /api/me/ranked-status`

**File:** `RankedController.java:690-996`

Returns the canonical FE state object. Selection-relevant fields: `currentBook`, `currentBookIndex`, `currentDifficulty`, `isPostCycle`, `askedQuestionIdsToday`, `askedQuestionCountToday`, `livesRemaining`, `questionsCounted`, `pointsToday`, `cap`, `dailyLives`, `resetAt`, plus season placement / weekly combo (`:914-974`).

**Day rollover logic** at `:714-792`: if today has no UDP row but yesterday does, carry `currentBook / currentBookIndex / currentDifficulty / isPostCycle` forward; reset `livesRemaining=100 / questionsCounted=0 / pointsCounted=0 / askedQuestionIds=[]`. If no prior record at all, init with `Genesis / index 0 / difficulty "all"`.

**`resetAt`** computed at `:982-994`: `now + 24h` (production) or `now + 2m` (test mode flag at `:986`).

### A.5 `GET /api/me/tier`

**File:** `RankedController.java:1029-1067`

Sums `UserDailyProgress.pointsCounted` over all dates (`:1040-1043`), feeds `RankTier.fromPoints`. Returns `{ totalPoints, tier, tierName, tierMinPoints, nextTier, nextTierName, nextTierMinPoints, pointsToNextTier, progressPercent }`.

> The FE actually consumes `/api/me/tier-progress` (used by `useRankedPage.ts:105`), not `/me/tier`. Endpoint `/me/tier` exists but is unused by the current Ranked page.

### A.6 `POST /api/ranked/sync-progress`

**File:** `RankedController.java:998-1027`

Returns today's UDP snapshot. Authenticated only (`:1003-1005` returns 401 if no email).

### A.7 `recordRankedQuestionHistory` (private)

**File:** `RankedController.java:653-688`

Upserts `UserQuestionHistory`: bumps `timesSeen`, sets `lastSeenAt = now`, and on correct sets `nextReviewAt = now + min(30, timesCorrect × 3)` days; on wrong `nextReviewAt = now + 1d` (`:679-685`). Mirrors `SessionService.recordQuestionHistory` per the comment.

### A.8 `RankedSessionService`

**File:** `apps/api/src/main/java/com/biblequiz/modules/ranked/service/RankedSessionService.java` — in-memory `Map<String, Progress>` (not read line-by-line; referenced from controller at `:170, :196, :337, :609`). Holds session-scope counters: `livesRemaining, questionsCounted, pointsToday, currentStreak, currentBook, currentBookIndex, questionsInCurrentBook, correctAnswersInCurrentBook, isPostCycle, currentDifficulty, date, cap, dailyLives`. Session lifetime is process-lifetime (no Redis backing referenced).

---

## B. Book Progression Logic

### B.1 First advance gate (session-scope)

**File:** `BookProgressionService.java:106-111`

```java
return questionsCompleted >= 50 &&
        correctAnswers >= (int) (questionsCompleted * 0.6) &&
        !isCompletedAllBooks(currentBook);
```

**Trigger:** ≥ 50 questions in current book (session-counter `Progress.questionsInCurrentBook`) AND ≥ 60% session accuracy AND not Revelation. Called from `RankedController.java:411-412`.

### B.2 Second advance gate (DB-scope, per-book mastery)

**File:** `RankedController.java:572-585`

**Threshold:** `UserBookProgress.answeredCount >= 100 && correctCount >= 70` — uses **unique** question IDs since `:560-563` only bumps `answeredCount` when the question is new for this user+book.

**Net effect:** Two parallel advance triggers. The 50/60% session gate fires sooner for users grinding the same book in one sitting; the 100/70 unique-Q gate is the persistent mastery line.

### B.3 Order rule

**File:** `BookProgressionService.java:12-26`

Hard-coded canonical 66-book Protestant order (Genesis → Revelation). `getNextBook` looks up by `indexOf` then `+1`.

### B.4 Wraparound

**File:** `BookProgressionService.java:40-42`

```java
if (currentIndex == -1 || currentIndex >= BIBLE_BOOKS_ORDER.size() - 1) {
    return null; // At the end of Bible or invalid book
}
```

**No wraparound.** Revelation → null → `RankedController.java:422-426` sets `p.isPostCycle=true` and `p.currentDifficulty="hard"`.

### B.5 Side effects on advance

- `p.currentBook = nextBook` (`:418` first gate, `:576` second gate)
- `p.questionsInCurrentBook = 0`, `p.correctAnswersInCurrentBook = 0` (`:420-421`, `:579-580`)
- `udp.setCurrentBook(...)` + `setCurrentBookIndex(...)` persisted (`:477-478`, `:581-583`)
- **No badge / modal / event** trigger observed in the advance branches. Achievement check at `:529-531` passes `currentBookIndex` to `achievementService.checkAndAward` but is unrelated to per-advance celebration.

### B.6 Mastery tracking call sites

`UserBookProgress` is mutated only by `RankedController.java:550-586`. **Practice / Daily / Multiplayer / Variety modes do NOT write `UserBookProgress`** — grep `userBookProgressRepository` finds writes only in RankedController. (Read-only verification across the modules dir not exhaustively spot-checked, but `BookMasteryService.java` does not exist as a separate service.)

---

## C. SmartQuestionSelector

### C.1 `selectQuestions()` signature

**File:** `SmartQuestionSelector.java:36-76`

```java
public List<Question> selectQuestions(String userId, int count, QuestionFilter filter)
```

If `filter.difficulty()` is non-null → single call to `selectWithSmartHistory` with that difficulty (`:37-40`).
Otherwise → resolve tier via `userTierService.getTierLevel(userId)` (`:43`), look up `DifficultyDistribution` (`:44`), split `count` into easy/medium/hard via `Math.round` (`:46-48`), and call `selectWithSmartHistory` three times (`:51-56`). Top-up via difficulty-agnostic call when undercount (`:58-72`). Final `Collections.shuffle(questions)` at `:74`.

### C.2 Tier difficulty distribution

**File:** `TierDifficultyConfig.java:13-22`

| Tier | Easy% | Medium% | Hard% | Timer (s) |
|---|---|---|---|---|
| 1 | 70 | 25 | 5 | 30 |
| 2 | 55 | 35 | 10 | 28 |
| 3 | 35 | 45 | 20 | 25 |
| 4 | 20 | 50 | 30 | 23 |
| 5 | 10 | 40 | 50 | 20 |
| 6 | 5 | 35 | 60 | 18 |
| default | 50 | 35 | 15 | 30 |

**Match with prompt-cited "SPEC §3.2 70/25/5 → 5/35/60":** YES at the T1 and T6 endpoints. Middle rows not separately verified against a spec line (see Section H).

### C.3 4-pool priority

**File:** `SmartQuestionSelector.java:90-154` (method `selectWithSmartHistory`)

| Pool | % cap | Query / classification | File:line |
|---|---|---|---|
| 1 — never seen | `(int)(count*0.6)` | `!seenIds.contains(q.id)` | `:107-108`, alloc `:130-131` |
| 2 — need review | `(int)(count*0.2)` | `reviewIds.contains(q.id)` (from `historyRepository.findNeedReviewQuestionIds(userId, now)`) | `:95`, `:109-110`, alloc `:133-134` |
| 3 — seen long ago (>30d) | `(int)(count*0.15)` | `h.getLastSeenAt().isBefore(now.minusDays(30))` | `:104, :114-115`, alloc `:136-137` |
| 4 — seen recently | fill remainder | else branch | `:116-118`, fill `:139-151` |

Pool boundaries use **integer floor** via `(int)` cast (not `Math.round` like the tier split in C.1) — minor inconsistency.

Pool source = `findByFilter(filter)` (`:156-174`) which returns the full active `List<Question>` for the (language, book?, difficulty?) tuple — **no SQL LIMIT**.

### C.4 Shuffle implementation

**Method:** `java.util.Collections.shuffle` (in-memory, after the pool is fully loaded into a `List`).

**File:line:**
- `SmartQuestionSelector.java:123-126` (per-pool shuffle)
- `:74` (final post-merge shuffle)
- `RankedController.java:293` (guest path uniform shuffle)

**Memory characteristic:** Load-all-then-shuffle. The four repository methods at `QuestionRepository.java:121-131` are `SELECT q FROM Question q WHERE ...` with **no `Pageable` / no `LIMIT`** — the entire active question table for the (lang, book, difficulty) tuple is materialized per call. `selectQuestions` per non-explicit-difficulty invocation triggers 3-4 such full pulls (easy + medium + hard + optional any-difficulty top-up).

---

## D. Frontend — Web

### D.1 `Ranked.tsx` request body

**File:** `apps/web/src/pages/Ranked.tsx:48-55`

```tsx
const pickRes = await api.post('/api/ranked/questions/select', {
  limit: 10,
  excludeIds,
  book: rankedStatus.currentBook,
  difficulty: rankedStatus.currentDifficulty,
  language: getQuizLanguage(),
})
```

**Fields sent:** `limit`, `excludeIds`, `book`, `difficulty`, `language`.

**Sources:**
- `book` ← `rankedStatus.currentBook` (`Ranked.tsx:52`)
- `difficulty` ← `rankedStatus.currentDifficulty` (`Ranked.tsx:53`)
- `language` ← `getQuizLanguage()` (`Ranked.tsx:54`, util resolves to `'vi'` or `'en'`)
- `excludeIds` = `union(rankedStatus.askedQuestionIdsToday, localStorage["askedQuestionIds"])` (`Ranked.tsx:44-46`)
- `limit` = hard-coded `10` (`Ranked.tsx:50`)

### D.2 Re-fetch after answer

`useRankedPage.ts:75-91` defines `fetchStatus` (GET `/api/me/ranked-status`). It's invoked on `isInitialized` (`:111`), on `visibilitychange` when tab becomes visible (`:131`), and on a custom `'rankedStatusUpdate'` window event (`:132-134, :136`). No automatic refetch is wired after each individual answer inside `/quiz`; the quiz screen dispatches its own updates outside this hook's scope.

### D.3 UI display — currentBook visibility on /ranked

`Ranked.tsx:1-12` imports only `RankedHeader, TierProgressCard, SeasonCard, RankedActionFooter`. **No JSX in `Ranked.tsx` renders `rankedStatus.currentBook`.** `CurrentBookCard.tsx` exists at `apps/web/src/components/ranked/CurrentBookCard.tsx:1-40+` but is not imported by `Ranked.tsx`. The value is sent to BE but not shown to user on the entry page.

### D.4 UI display — currentDifficulty

Not displayed on `/ranked`. Sent to BE per D.1.

### D.5 UI display — tier / liturgical season

- Tier: `TierProgressCard` (imported `Ranked.tsx:10`, rendered `:132-139`).
- Liturgical season: `SeasonCard` (imported `:11`, rendered `:354`). Pulls season name + chips; **no question-pool effect** (see Section F).

### D.6 State management

`useRankedPage.ts` uses `useState` + `useEffect` directly — not TanStack Query (despite `CLAUDE.md` rule "API call: TanStack Query"). Three separate fetches (`fetchStatus`, `fetchMyRank`, `fetchTierProgress`) initialised on `isInitialized` (`:110-112`).

---

## E. Frontend — Mobile

### E.1 `RankedScreen.tsx` request body

**File:** `apps/mobile/src/screens/quiz/RankedScreen.tsx:133-151`

```tsx
step = 'GET /api/questions (filtered)'
if (questions.length < 10) {
  const params: any = { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
  if (currentBook) params.book = currentBook
  if (currentDifficulty && currentDifficulty !== 'all') params.difficulty = currentDifficulty
  addUnique((await apiClient.get('/api/questions', { params })).data ?? [])
}
step = 'GET /api/questions (book-only fallback)'
if (questions.length < 10 && currentBook) {
  addUnique((await apiClient.get('/api/questions', {
    params: { limit: 10 - questions.length, book: currentBook, excludeIds: Array.from(exclude) }
  })).data ?? [])
}
step = 'GET /api/questions (any-book fallback)'
if (questions.length < 10) {
  addUnique((await apiClient.get('/api/questions', {
    params: { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
  })).data ?? [])
}
```

**Fields sent:** `limit`, `excludeIds`, `book?`, `difficulty?`. Language is **not sent**.

### E.2 Comparison with web

| Field | Web sends? | Mobile sends? |
|---|---|---|
| `limit` | yes (10, fixed) | yes (`10 - questions.length`, varies) |
| `excludeIds` | yes | yes |
| `book` | yes | yes (1st + 2nd call), no (3rd fallback) |
| `difficulty` | yes | yes (1st call only, skipped if `"all"`) |
| `language` | yes | **no** |

### E.3 Discrepancy

**YES — Major.**

1. Mobile hits `GET /api/questions` (legacy uniform-random search endpoint), **not** `POST /api/ranked/questions/select`. The mobile flow therefore **never invokes `SmartQuestionSelector`** and **never applies the `TierDifficultyConfig` 70/25/5 → 5/35/60 distribution**. This is exactly the pre-BL-20 web pattern that the FE javadoc at `RankedController.java:204-225` and the comment at `Ranked.tsx:39-43` describe as the bug fix that motivated the new endpoint on 2026-05-20.
2. Mobile does not send `language` — depending on `/api/questions` default behaviour, this may return a vi/en mixed pool (cf. prior bug fix `f8799d0 fix(quick-match): filter DB question pool by language (was leaking vi+en mix)` in repo history).
3. The flow comment at `RankedScreen.tsx:102-103` ("web parity Ranked.tsx:30-83") is stale — mobile parity diverged when web migrated.

### E.4 Re-fetch after answer

No automatic refetch wired inside `RankedScreen.tsx`. The three TanStack Queries (`['me']`, `['tier-progress']`, `['ranked-status']`, `['season','active']` at `:57-81`) rely on TanStack staleTimes (60s for ranked-status). Refresh on screen re-mount only.

### E.5 UI element displaying currentBook / currentDifficulty / tier

`RankedScreen.tsx` renders:
- Tier card with badge + 5-star sub-tier + next-tier preview + linear bar (`:189-230`).
- Stats card with energy + 3 mini-stats (streak / questions today / points today) (`:232-275`).
- Season card with name + `×1.5 XP bonus` chip + rank/points (`:277-309`).

**`currentBook` and `currentDifficulty` are NOT displayed.** Same as web.

---

## F. Liturgical Season Integration (negative confirmation of prompt claims)

### Claim 1 — `SeasonSeeder.java` is leaderboard-only, no question filter

**Confirmed.** `SeasonSeeder.java:35-100` only inserts `Season(id, name, start, end, isActive)` rows. The `Season` entity is not referenced by `SmartQuestionSelector` (grep below) and the only consumer in Ranked flow is `seasonService.addPoints(user, earned, 1)` for leaderboard scoring (`RankedController.java:519-521`).

### Claim 2 — `SmartQuestionSelector` has zero "season" references

**Confirmed.** `Grep "season" -i SmartQuestionSelector.java` → **0 matches** across the entire file. The selector does not know seasons exist.

### Claim 3 — `ScoringService.calculateWithTier` ×1.5 multiplier is `xpSurgeUntil`, not liturgical season

**Confirmed.** `ScoringService.java:96-107`:

```java
public ScoreResult calculateWithTier(Question.Difficulty difficulty, int clientElapsedMs,
                                      int currentStreak, boolean isDailyFirst, int tierLevel,
                                      boolean xpSurgeActive) {
    ScoreResult base = calculate(difficulty, clientElapsedMs, currentStreak, isDailyFirst);
    double multiplier = tierRewardsConfig.getRewards(tierLevel).xpMultiplier();
    if (xpSurgeActive) {
        multiplier *= 1.5;
    }
    int boosted = (int) Math.round(base.earned * multiplier);
    ...
}
```

`xpSurgeActive` is computed at `RankedController.java:390-391` from `user.getXpSurgeUntil() != null && user.getXpSurgeUntil().isAfter(LocalDateTime.now())` — admin-set per-user burst window (BL-3 Milestone Burst), not derived from `Season`. No code path multiplies by `1.5` based on an active liturgical season.

### Claim 4 — `/api/variety/seasonal` is hard-coded 2/4 banner

**Confirmed.** `VarietyQuizController.java:184-212`:
- Only `CHRISTMAS` (Dec 1-25) and `EASTER` (Mar OR Apr 1-20) branches.
- Returns `{ season, hasEvent, title, description, books[] }` — purely informational banner payload.
- Hard-codes `books: ["Matthew", "Luke", "Isaiah"]` / `["Matthew", "Mark", "Luke", "John"]`.
- **Not called from Ranked flow.** Mùa Ngũ Tuần and Mùa Cảm Tạ branches do not exist here.

### F.1 Grep audit (raw)

- `season` in `SmartQuestionSelector.java`: **0 matches**.
- `season` in `RankedController.java`: 30+ matches (verified content above) — all are `seasonService.addPoints` for leaderboard, `seasonRankingRepository` for top-N thresholds + placement, or response field setters (`seasonRank`, `seasonPoints`, etc.). **Zero references in the selection branch (`selectRankedQuestions`, lines 226-300)**.

### F.2 ×1.5 multiplier source — summary

| Source | Wired? | File:line |
|---|---|---|
| Admin `xpSurgeUntil` (Milestone Burst) | YES | `ScoringService.java:101-103` + `RankedController.java:390-391` |
| Liturgical season active | **NOT WIRED** | n/a — `Season` entity never reaches `ScoringService` |
| `xpMultiplier` per tier (1.0x → 2.0x) | YES | `TierRewardsConfig.java:11-21` + `ScoringService.java:100` |

---

## G. Edge cases observed

### G.1 Pool exhaustion fallback

`RankedController.java:274-286` — if `picked.size() < limit` AND `filter.book() != null`, re-call `smartQuestionSelector.selectQuestions` with `book=null` (keeps difficulty + language). Within `SmartQuestionSelector.selectQuestions` itself, `:58-72` already does a difficulty-relaxed top-up. **No further fallback** if difficulty + language pool also dries up — response simply returns fewer than `limit` questions (or empty, in which case `Ranked.tsx:58-61` alerts `"Bạn đã trả lời hết câu hỏi có sẵn hôm nay"`).

No fallback drops `excludeIds`. Guest path (`:287-295`) has no fallback at all — just a uniform shuffle over the language-filtered pool.

### G.2 Energy = 0 behavior

`/ranked/questions/select` does **not** gate on energy. The endpoint returns questions regardless. FE gates via `Ranked.tsx:104` (`canPlay = livesRemaining > 0 && questionsCounted < cap`). On the answer endpoint, `RankedController.java:354-362` short-circuits with `blocked=true` when `livesRemaining <= 0` or `questionsCounted >= 100`.

### G.3 Daily cap 100 reached

Same as G.2 — selection endpoint does not gate; answer endpoint short-circuits. `DAILY_QUESTION_CAP = 100` at `RankedController.java:123`.

### G.4 Guest user (no `Authentication`)

`selectRankedQuestions` guest branch at `RankedController.java:287-295` — uniform random `findAllActiveByLanguage`, no history awareness, no tier distribution. Defensive (per Javadoc), but reachable since the endpoint has no `@PreAuthorize`.

### G.5 Tier 1 without Basic Quiz passed

No Basic-Quiz gate in `RankedController` — `Grep "PreAuthorize|hasRole|isAuthenticated"` over `RankedController.java` → **0 matches**. `BasicQuizController` exists and `BasicQuizService` enforces cooldown, but Ranked endpoints do not check basic-quiz pass state. Gating is presumably FE-only via `AppLayout` / route guards.

### G.6 Daily reset

No cron job. Reset is lazy on read in `getRankedStatus` (`RankedController.java:714-792`) which creates a new UDP row carrying `currentBook / currentBookIndex / currentDifficulty / isPostCycle` forward and resetting energy/questions/points/asked-ids.

---

## H. Discrepancies between SPEC and code

| Spec reference | Spec says | Code says | File:line | Severity |
|---|---|---|---|---|
| SPEC_USER §3.2 Tier distribution | T1 70/25/5 → T6 5/35/60 | T1 70/25/5 → T6 5/35/60 (exact match endpoints; T2-T5 also defined) | `TierDifficultyConfig.java:13-22` | **MATCH** |
| SPEC_USER §5.6 / C3 Liturgical Season ×1.5 | 4 mùa × 1.5 score (Phục Sinh / Ngũ Tuần / Cảm Tạ / Giáng Sinh) | NOT WIRED — only `xpSurgeUntil` (admin per-user) applies ×1.5; `ScoringService` has no Season parameter | `ScoringService.java:96-107`, `RankedController.java:519-521` (only addPoints, no multiplier) | **SPEC DRIFT** |
| SPEC_USER §6.2 Mastery threshold | (canonical formula — not opened) | Two independent gates: session 50Q / ≥60% accuracy AND DB 100 unique Q / ≥70 correct | `BookProgressionService.java:106-111`, `RankedController.java:572-585` | **SPEC DRIFT** (dual-gate not documented as canonical) |
| Mobile parity (general C-section / SPEC_USER mobile parity) | Mobile must match web Ranked flow | Mobile uses legacy `/api/questions` × 3 calls; no `SmartQuestionSelector`; no language param; no tier distribution | `RankedScreen.tsx:133-151` vs `Ranked.tsx:48-55` | **SPEC DRIFT** (critical) |
| SPEC_USER C2 mode naming "Đấu Hạng" | "Đấu Hạng" canonical VN | Mobile screen header says `"Thi Đấu Xếp Hạng"` (`RankedScreen.tsx:184`); CTA says `"Vào Thi Đấu"` (`:330`) | `RankedScreen.tsx:184, 330` | **SPEC DRIFT** (C2 lock) |
| SPEC_USER §5.6 Variety seasonal | 4 liturgical seasons canonical | Only `CHRISTMAS` (Dec 1-25) + `EASTER` (Mar / Apr 1-20) hard-coded; `NORMAL` otherwise | `VarietyQuizController.java:186-211` | **SPEC DRIFT** (2/4 seasons missing — Ngũ Tuần + Cảm Tạ) |
| SPEC_USER (CLAUDE.md) "API call: TanStack Query" | TanStack Query for FE fetches | `useRankedPage.ts` uses raw `useState + useEffect` for 3 fetches | `useRankedPage.ts:66-141` | **SPEC DRIFT** (convention) |

---

## I. Open questions for Bui

1. **Mobile selection endpoint migration intent** — `RankedScreen.tsx:133-151` still uses the legacy 3-call `/api/questions` pattern that web abandoned 2026-05-20 (BL-20). Was this an oversight or an explicit "defer mobile" decision? If it's a bug, should it be tracked as BL-N alongside BL-20? The Javadoc comment at `:102-103` claims "web parity" which is now false.

2. **Dual book-advance gate intent** — Two independent triggers can advance `UserDailyProgress.currentBook`:
   - `BookProgressionService.shouldAdvanceToNextBook` (50 Q / 60% session accuracy, `:106-111`)
   - The DB mastery check (`UserBookProgress.answeredCount ≥ 100 && correctCount ≥ 70`, `RankedController.java:572-585`)

   When a user accumulates 100 unique Q on Genesis but never hit 60% accuracy in a single session, the second gate fires and they jump to Exodus. When they grind 50 Q at 60% in one session without yet hitting 100 unique Q, the first gate fires. Is having both gates the canonical intent, or is one of them legacy that should be retired?

3. **`isPostCycle` Revelation→? behaviour** — `RankedController.java:423-426` sets `isPostCycle=true` and `currentDifficulty="hard"` permanently when the user runs past Revelation. There is no documented "what happens after post-cycle for a few months" path. Should the `book` filter be wiped in `/ranked/questions/select` once `isPostCycle=true`? Currently FE keeps sending `book: rankedStatus.currentBook = "Revelation"` (`Ranked.tsx:52`), so the BE selector keeps filtering on Revelation and relying on the no-book fallback at `:274-286` — is that intended?

4. **Guest path policy** — `/ranked/questions/select` is reachable unauthenticated and serves uniform random questions (`RankedController.java:287-295`). The Javadoc says `/ranked` is auth-gated by `AppLayout` so this is "defensive only". Should the endpoint enforce auth (`401`) instead of silently serving guests? Same question for the answer endpoint (no explicit `401` either).

5. **Empty pool UX** — When `selectQuestions` returns `[]` (e.g. user has exhausted the entire (language, book, difficulty) pool plus the no-book fallback also gave duplicates), web alerts the user (`Ranked.tsx:58-61`). The BE has no concept of "graceful exhaustion" — it just returns `{questions: []}` and treats the day as continuable. Should the BE flip a `cap=questionsCounted` style hint so FE can disable Start permanently for the day instead of bouncing the alert?

6. **Mobile language leak** — `RankedScreen.tsx:133-151` doesn't send `language` to `/api/questions`. Given the recent `f8799d0 fix(quick-match): filter DB question pool by language (was leaking vi+en mix)` fix in repo history, is mobile Ranked currently shipping mixed-language pools to users with `en` UI? Worth confirming whether `/api/questions` defaults to vi or to user-derived language server-side.

---

## Appendix: File inventory

Files fully read:
- `apps/api/src/main/java/com/biblequiz/api/RankedController.java` (1088 lines)
- `apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java` (208 lines)
- `apps/api/src/main/java/com/biblequiz/modules/ranked/service/TierDifficultyConfig.java` (30 lines)
- `apps/api/src/main/java/com/biblequiz/modules/ranked/service/TierRewardsConfig.java` (28 lines)
- `apps/api/src/main/java/com/biblequiz/modules/ranked/service/ScoringService.java` (141 lines)
- `apps/api/src/main/java/com/biblequiz/modules/quiz/entity/UserDailyProgress.java` (169 lines)
- `apps/api/src/main/java/com/biblequiz/modules/quiz/entity/UserQuestionHistory.java` (92 lines)
- `apps/api/src/main/java/com/biblequiz/modules/quiz/repository/QuestionRepository.java` (256 lines)
- `apps/api/src/main/java/com/biblequiz/modules/quiz/service/BookProgressionService.java` (134 lines)
- `apps/api/src/main/java/com/biblequiz/infrastructure/seed/SeasonSeeder.java` (106 lines)
- `apps/web/src/pages/Ranked.tsx` (370 lines)
- `apps/web/src/hooks/useRankedPage.ts` (152 lines)
- `apps/mobile/src/screens/quiz/RankedScreen.tsx` (535 lines)

Files partially read / grepped:
- `apps/api/src/main/java/com/biblequiz/api/VarietyQuizController.java` (lines 175-213; `/seasonal` endpoint)
- `apps/web/src/components/ranked/CurrentBookCard.tsx` (lines 1-40)
- `apps/api/src/main/java/com/biblequiz/modules/ranked/service/RankedSessionService.java` (referenced, not opened — call sites in controller used as ground truth)

Files confirmed to exist (Glob):
- `apps/api/src/main/java/com/biblequiz/modules/season/{entity,repository,service}/*.java`
- `apps/api/src/main/java/com/biblequiz/modules/ranked/service/{GameModeUnlockConfig,PrestigeService,TierProgressService,UserTierService}.java`
- `apps/api/src/main/java/com/biblequiz/modules/quiz/entity/UserBookProgress.java`
- `apps/mobile/src/screens/quiz/RankedResultScreen.tsx`, `apps/mobile/src/components/home/{RankedStandardCard,HeroRankedCard}.tsx`

Files NOT FOUND (none — all expected paths existed).
