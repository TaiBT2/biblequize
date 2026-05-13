# IMPL_NOTES — Quiz Set Solo + Co-Play

Date: 2026-05-11
Branch: main
Phase: 0 (pre-flight verification) — **STOP before Phase 1**

---

## 🚨 TL;DR — Prompt is significantly stale vs. current codebase

The audit (2026-05-10) caught some gaps but the implementation prompt assumes greenfield. **At least 60% of what Phase 1 wants to build already exists** under different names. Pushing through verbatim would create duplicate tables, conflicting endpoints, and an attempt-limit semantics conflict with the spec.

**Recommendation:** revise the prompt against the findings below before any commit. Phase 0 verification revealed too much overlap to silently proceed.

---

## P0.1 findings — what already exists

### Solo replay infrastructure — ALREADY SHIPPED (Sprint 5 / BL-S5-1)

| Prompt assumption | Reality |
|---|---|
| `QuizSetPlayService.startSoloPlay()` to be created | [`ChurchGroupController.startSoloPractice`](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L496-L540) already does this |
| Endpoint `POST /api/groups/{groupId}/quiz-sets/{setId}/play-solo` | Existing endpoint is `POST /api/groups/{id}/quiz-sets/{setId}/solo-practice` |
| SessionService extension for `predefinedQuestionIds` | Already supports `customQuestionIds` config (line 147-158 of [SessionService.java](apps/api/src/main/java/com/biblequiz/modules/quiz/service/SessionService.java#L147-L158), tagged BL-S5-1) and `groupQuizSetId` link (line 121-125) |
| New `quiz_set_solo_attempts` per-attempt table (V51) | [V51 already shipped](apps/api/src/main/resources/db/migration/V51__group_quiz_set_mastery.sql) — but as **GroupQuizSetMastery** (aggregate per (user, set), not per-attempt). Tracks `total_attempts`, `best_score`, `best_accuracy`, `learned_question_ids` |
| Track best score for leaderboard | Existing endpoint `GET /api/groups/{id}/quiz-sets/{setId}/my-mastery` (line 546) returns mastery; no per-set leaderboard endpoint yet |

### Co-play infrastructure — MOSTLY SHIPPED

| Prompt assumption | Reality |
|---|---|
| New entry point: `POST /api/rooms { groupQuizSetId }` | Existing endpoint `POST /api/groups/{groupId}/quiz-sets/{setId}/play` ([line 935](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L935-L981)) already creates Room with `groupQuizSetId` + `customQuestionIds`, mode `SPEED_RACE`, member-gated |
| RoomQuizService Priority 0a branch on `room.groupQuizSetId` | Priority 0 on `customQuestionIds` already implemented at [RoomQuizService.java line 480-487](apps/api/src/main/java/com/biblequiz/modules/room/service/RoomQuizService.java#L480-L487). `/play` pre-loads `customQuestionIds`, so questions already flow through correctly. The audit's "branch point line 481" already exists |
| `Room.groupQuizSetId` field new | Exists since earlier migration: [Room.java line 61-62](apps/api/src/main/java/com/biblequiz/modules/room/entity/Room.java#L61-L62) |

### Scheduled mode (defer per prompt) — ALSO PARTIALLY SHIPPED

- [`ScheduledQuizService.java`](apps/api/src/main/java/com/biblequiz/modules/group/service/ScheduledQuizService.java) + `ScheduledQuizScheduler.java` exist
- Migration V40 created `scheduled_quizzes` + `scheduled_quiz_attempts` tables
- This is where `attempts_per_user INT default 3` lives ([SPEC_GROUP §3.x line 306](docs/spec/SPEC_GROUP_v1.3.md#L306)) — **NOT for solo replay**

### Migrations directory state

```
V49__add_host_plays_game.sql
V50__group_quiz_set_metadata.sql
V51__group_quiz_set_mastery.sql        ← TAKEN (mastery, not solo-attempts)
V52__group_quiz_set_folder.sql         ← TAKEN (folders)
V53__quiz_sessions_group_quiz_set_id.sql  ← TAKEN
```

**Next free version is V54.** Prompt's `V51__quiz_set_solo_attempts.sql` and `V52__rooms_group_quiz_set_fk.sql` numbering is invalid.

---

## P0.2 conflicts that block Phase 1 as written

### Conflict A — 3-attempt limit semantics

- **Prompt P1.2** says: hardcoded max 3 solo attempts per (user, set), 4th throws 409, cites "SPEC §9.1.4".
- **Spec reality** ([SPEC_GROUP §3.7 line 324-348](docs/spec/SPEC_GROUP_v1.3.md#L324-L348)): solo practice is **mastery-tracked, NOT attempt-limited**. `total_attempts` is a counter for personal stats, no cap. Mastery encourages repeat practice until all questions learned.
- The "default 3" in spec line 306 / 734 is for **ScheduledQuiz.attempts_per_user**, a different feature.
- Searching `9.1.4` in the spec returns nothing — citation is stale or wrong.

**→ Decision needed**: introduce a hard 3-attempt cap (overrides Sprint 5 mastery design) OR keep mastery semantics (no cap; remove the 409 error from prompt). Bui must confirm before P1.2.

### Conflict B — per-attempt table vs mastery aggregate

- **Prompt P1.1** creates `quiz_set_solo_attempts` (one row per session).
- **Spec/V51** uses `group_quiz_set_mastery` (aggregate per user/set with `total_attempts` counter + `best_score`).
- These are incompatible designs. Adding a per-attempt table duplicates data and orphans the existing mastery flow.

**→ Decision needed**: extend mastery (no new table), or replace mastery (deprecate V51 entity), or store attempts in `quiz_sessions` already (already linked via `groupQuizSetId` since V53). My recommendation: **drop P1.1 entirely** and read attempts via `SELECT * FROM quiz_sessions WHERE group_quiz_set_id = ? AND user_id = ?` since V53 already wired this.

### Conflict C — endpoint duplication

- Prompt P1.3 wants `POST /api/groups/{groupId}/quiz-sets/{setId}/play-solo`.
- Existing: `POST /api/groups/{id}/quiz-sets/{setId}/solo-practice` (same shape, working today).
- Adding `/play-solo` next to `/solo-practice` = two endpoints doing the same thing.

**→ Decision needed**: extend existing `/solo-practice` (add attempt-limit/leaderboard fields to its response) OR rename existing endpoint (breaking FE callers) OR pick one path and stick with it.

### Conflict D — co-play entry endpoint

- Prompt P2.5 wants FE to `POST /api/rooms { mode, groupQuizSetId, questionCount }`.
- Existing FE flow goes through `POST /api/groups/{id}/quiz-sets/{setId}/play` which already does the right thing (member check + room creation + groupQuizSetId set).
- The audit's "Gap 1" (joinRoom missing membership) is **real** — but the createRoom path is fine.

**→ Decision needed**: keep existing `/play` endpoint (recommended; only joinRoom needs hardening) OR migrate to generic `/api/rooms` (much larger refactor, FE+BE).

---

## What IS still missing (real gaps)

After verification, these prompt items remain valid work:

| Prompt task | Status | Notes |
|---|---|---|
| **P2.1** — FK + index for `rooms.group_quiz_set_id` | ✅ Real gap, do as **V54** | Audit Gap 2 confirmed |
| **P2.3** — RoomService.joinRoom membership check (🚨 SECURITY) | ✅ Real gap | [RoomService.java line 120](apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java#L120) has no `groupQuizSetId`-aware membership gate. Critical |
| **P2.4** — RoomDetailsDTO exposes `groupQuizSetId/Name/totalQuestions` | Likely real gap | Need to verify by reading DTO; prompt cites lines 651-714 of RoomService |
| **P2.6** — FE WebSocket type + lobby/quiz screen quiz set badge | Real gap | FE wiring not yet done |
| **P1.4** — FE QuizSetCard redesign per `MOCKUP_QUIZSET_CARDS.html` | Real work | Pure FE; mockup exists; no BE conflict |
| Per-set **leaderboard** endpoint (GET .../leaderboard) | Real gap | `/my-mastery` exists but no aggregated leaderboard endpoint shipped |
| `MOCKUP_QUIZSET_CARDS.html` reference file | ✅ Located | [docs/group-page/MOCKUP_QUIZSET_CARDS.html](docs/group-page/MOCKUP_QUIZSET_CARDS.html) |

---

## Recommended revised plan (proposal — needs Bui sign-off)

**Drop entirely:**
- P0 work that assumed solo replay didn't exist — wasted assumption ✓ (this commit)
- P1.1 (V51 new table) — V51 is taken, design conflict with mastery
- P1.2 (QuizSetPlayService new service) — duplicates `solo-practice` endpoint
- P1.3 part 1 (`/play-solo` endpoint) — duplicates `/solo-practice`
- P2.5 part 1 (`POST /api/rooms` co-play creation) — duplicates `/play` endpoint

**Keep with renumbering:**
- P1.3 part 2 — add `GET .../my-attempts` (read from `quiz_sessions` filtered by `group_quiz_set_id`)
- P1.3 part 3 — add `GET .../leaderboard` (aggregate `MAX(score)` from quiz_sessions per (user, set))
- P1.4 — FE card redesign + wire **existing** `/solo-practice` endpoint
- P2.1 — Migration **V54** FK + index for `rooms.group_quiz_set_id`
- P2.3 — RoomService.joinRoom membership check (security critical)
- P2.4 — RoomDetailsDTO quiz set context
- P2.5 part 2 — FE wire **existing** `/play` endpoint to QuizSetCard "Chơi cùng nhau" button
- P2.5 part 3 — CreateRoom.tsx `?quizSetId=` query param support (if still needed; may be moot if `/play` is the only path)
- P2.6 — FE WebSocket payload + quiz screen badge

**Resolve before coding:**
1. **Attempt limit policy** — hard 3-cap (Conflict A), unlimited mastery, or configurable per-set?
2. **`quiz_set_solo_attempts` table** — drop in favor of `quiz_sessions.group_quiz_set_id`?
3. **Endpoint naming** — keep `/solo-practice` (existing) or migrate to `/play-solo`?
4. ~~`MOCKUP_QUIZSET_CARDS.html` location~~ — confirmed at `docs/group-page/MOCKUP_QUIZSET_CARDS.html`.

---

## Branch decision (P0.2)

Per prompt: *"Nếu SessionService support questionIds → wire qua SessionService (cleaner)"*.

**SessionService already supports** `customQuestionIds` + `groupQuizSetId` (BL-S5-1, V53). And `/solo-practice` already wires through it. So the "cleaner" option is in fact already implemented. Phase 1's stated branch decision is moot.

---

## Files I read (for traceability)

- `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` lines 485-562, 920-981
- `apps/api/src/main/java/com/biblequiz/modules/quiz/service/SessionService.java` lines 90-210
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomQuizService.java` lines 470-510
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` lines 115-175
- `apps/api/src/main/java/com/biblequiz/modules/room/entity/Room.java` lines 50-75
- `apps/api/src/main/resources/db/migration/V51__group_quiz_set_mastery.sql`
- `apps/api/src/main/resources/db/migration/` listing
- `docs/spec/SPEC_GROUP_v1.3.md` lines 295-360 (§3.7 mastery), search for "9.1.4" / "attempts_per_user"
- `apps/api/src/main/java/com/biblequiz/modules/group/` listing

## NO code changes done in Phase 0
- No source files modified.
- Only this `IMPL_NOTES.md` written.

---

## Stop reason

Per prompt Rule #1 ("STOP after each commit"), Rule #5 ("Honest pushback"), Rule #8 ("Surface uncertainty").

**Awaiting Bui's resolution of Conflicts A–D before any Phase 1 code.**
