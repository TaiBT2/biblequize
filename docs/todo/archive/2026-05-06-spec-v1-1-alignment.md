# 2026-05-06 — Spec v1.1 alignment [DONE]

> **Source:** SPEC_GROUP_v1.1.md §15.4 — implementation team adjustments after spec audit resolved 4 pending decisions.
> **Branch:** `feature/group-live-and-scheduled` (current).
> **Scope:** 3 small code changes (<1 day) + TODO update marking decisions resolved.

### Resolved decisions (per spec v1.1)

| Q | v1.1 resolution | Code action |
|---|---|---|
| Q-A | Solo NOT into group leaderboard (§7.5 + §10.2 aligned) | No code change — already correct |
| Q-B | Manual advance (host clicks "Sang câu tiếp") — KEEP P1-3 fix | No code change — P1-3 commit `497c1d3` correct |
| Q-C | Concurrent rooms allowed, no dedup | **Adj-1 below** |
| Q-D | Keep MOD role in v1, remove v1.5 | No code change — current correct |
| Q-N | Rename `/live-quiz` → `/live-rooms` | **Adj-3 below** |

### Tasks

#### Task SPEC11-1: Adj-1 — Bỏ dedup live mode in createLiveQuiz [x] DONE
- **Spec ref**: §8.2 line 538-540, §8.7 line 629-630
- **File**: `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` line 639-647
- **Action**: delete dedup block; always `roomService.createRoom(...)`
- **Estimated**: ~5 LOC
- **Commit**: `fix(group): remove dedup in createLiveQuiz per spec v1.1 §8.7 (concurrent rooms)`

#### Task SPEC11-2: Adj-2 — Bỏ dedup solo path in playQuizSet [x] DONE
- **Spec ref**: §7.5 implementation note line 502-503
- **File**: `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` line 580-602
- **Action**: delete dedup block in solo path; always create new SPEED_RACE room. (GFA-17 long-term refactor solo→Practice session deferred.)
- **Estimated**: ~5 LOC + drop unused repo method `findFirstByGroupQuizSetIdAndStatusAndMode`
- **Commit**: `fix(group): remove dedup in playQuizSet so solo doesn't merge two members`

#### Task SPEC11-3: Adj-3 — Rename endpoint /live-quiz → /live-rooms [x] DONE
- **Spec ref**: §13.5, §15.3 Q-N row, Phụ lục B
- **File(s)**:
  - `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` — `@PostMapping("/{id}/live-quiz")` → `/live-rooms`
  - `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` — `@GetMapping("/{id}/active-rooms")` → also rename to `/live-rooms` (GET) per spec §13.5 row 947
  - `apps/web/src/api/groups.ts:23` — URL path
  - `apps/api/src/test/java/com/biblequiz/api/ChurchGroupControllerTest.java` — mock paths
- **Estimated**: 4 file edits, ~10 LOC
- **Commit**: `fix(group): rename /live-quiz → /live-rooms per spec v1.1 §13.5`

#### Task SPEC11-4: Update tracking section for v1.1 alignment [x] DONE
- Mark v1.0 follow-ups as superseded by v1.1
- Move v1.5/v2 deferred tasks to roadmap section
- Commit: `docs(todo): align with SPEC_GROUP_v1.1 — mark resolved decisions`

---
