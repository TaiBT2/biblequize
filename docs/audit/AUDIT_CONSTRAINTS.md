# AUDIT_CONSTRAINTS.md — Phase 1 Step 1.2

**Generated:** 2026-05-09
**Verifies:** Canonical constraints C1–C9 from `PROMPT_REWRITE_SPECS.md`

## Summary table

| Constraint | Status | Evidence (file:line) | Divergence |
|---|---|---|---|
| **C1** Tier names (CŨ — religious) | ✅ Match | `apps/web/src/data/tiers.ts:40-98`, `apps/web/src/i18n/vi.json:2-9`, `apps/web/src/i18n/en.json:2-9` | None (`Vinh Quang` only appears in season reward text, not tier name) |
| **C2** Mode names "Luyện Tập" / "Thi Đấu Ranked" | ✅ Match | `apps/web/src/i18n/vi.json:37-38` (Luyện tập / Leo Rank), `apps/mobile/src/i18n/vi.json:63-65` (Luyện Tập / Thi Đấu) | Web uses "Leo Rank" instead of "Thi Đấu Ranked" — minor wording variance |
| **C2** Layout Option Y (Practice + Ranked = 2 featured cards) | ✅ Match | `apps/web/src/pages/Home.tsx:152-157`, `apps/web/src/components/GameModeGrid.tsx:119-200` | None |
| **C3** 4 Liturgical seasons + ×1.5 bonus | ❌ **Diverged** | `apps/api/src/main/java/com/biblequiz/api/VarietyQuizController.java:184-212` only Christmas + Easter; `:24-43` says "no XP bonus" | Only 2/4 seasons; ×1.5 bonus dead code |
| **C4** BTTHĐ 2011 / 66 books / 50/50 VN-EN | ⚠️ Partial | 66 books confirmed in `seed/questions/`; bilingual VI+EN seed pairs (66 each) | **Bible version mismatch:** code uses **BTT 1926** (public domain), spec says BTTHĐ 2011 → spec wrong OR code wrong |
| **C5** Answer colors (A=Coral, B=Sky, C=Gold, D=Sage) | ✅ Match | Web `apps/web/src/components/quiz/AnswerButton.tsx:28-61`, `apps/web/tailwind.config.js:75-80`; Mobile `apps/mobile/src/screens/quiz/QuizScreen.tsx:17-22` (POS_RGB) | None — consistent web + mobile |
| **C6** Group roles (Leader/Mod/Member) | ✅ Match | `modules/group/entity/GroupMember.java:14-16` enum LEADER/MOD/MEMBER; `apps/web/src/pages/GroupDetail.tsx:13,27,276,281,359-360` | Visual emoji 👑 / 🛡️ / plain — verified in role chips component |
| **C7** Room lifecycle R1–R5 | ✅ Match | See "C7 detail" below | CANCELLED enum value defined but never set (cleanup needed) |
| **C8** SPEC_GROUP locked decisions Q-A...Q-O | ⚠️ Mostly match | See "C8 detail" below | Q-A scoring scope unclear; Q-N route mismatch on web |
| **C9** Defer features (TV Host, Multi-leader, Seasonal UI, Friend, Premium, Offline) | ✅ Correctly deferred | None of the 6 found in shipped code | Friend has stub Challenge entity; OfflineBanner exists but only `navigator.onLine` |

---

## C1 — Tier names

**Canonical (CŨ):** Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ.

- ✅ `apps/web/src/data/tiers.ts:40-98` — `nameKey` correct
- ✅ `apps/web/src/i18n/vi.json:2-9` — VN names correct
- ✅ `apps/web/src/i18n/en.json:2-9` — EN names correct
- ❌ Wrong names ("Tia Sáng", "Ánh Bình Minh", "Vinh Quang", "Ngọn Lửa") **NOT found** in tier definitions.
- ⚠️ "Vinh Quang" appears in `vi.json:874-882` but it is season reward badge text, not a tier name → OK.

**Verdict:** ✅ PASS

---

## C2 — Mode names + Layout Option Y

**Mode names:**
- Web: `practice` = "Luyện tập" (lowercase), `ranked` = "Leo Rank" (alternative wording — acceptable per audit but **prompt canonical wording is "Thi Đấu Ranked"** → spec rewrite should normalize).
- Mobile: `practice` = "Luyện Tập", `ranked` = "Thi Đấu" (closer to canonical).

**Layout Option Y:** Home page wraps `FeaturedDailyChallenge` + `GameModeGrid`. GameModeGrid renders Practice + RankedFeaturedCard as the 2 featured cards above Variety/Group rows.

**Verdict:** ✅ PASS (with wording note for spec normalization)

---

## C3 — 4 Liturgical seasons (×1.5 bonus)

**Canonical:** Phục Sinh (T2-4), Ngũ Tuần (T5-7), Cảm Tạ (T8-10), Giáng Sinh (T11-1) — ×1.5 score in Ranked + Daily Challenge.

**Code reality:**
- `VarietyQuizController.java:184-212` detects only **Christmas (Dec 1-25)** + **Easter (Mar + Apr 1-20)**
- `:24-43` controller comment: "no XP, no leaderboard" for variety modes
- ×1.5 multiplier exists as dead-code field in DTO; not consumed by ScoringService
- Pentecost (Ngũ Tuần) — NOT FOUND
- Thanksgiving (Cảm Tạ) — NOT FOUND
- `Season` entity exists (V7) with admin CRUD but is generic season construct, not liturgical-tied

**Verdict:** ❌ **DIVERGED — only 2/4 seasons; bonus unwired**
**Action:** Spec rewrite must document current 2-season state OR backlog item to ship missing 2 seasons + wire bonus.

---

## C4 — Bible content

- ✅ 66 books (Protestant) confirmed: 39 OT + 27 NT in `seed/questions/`. No Deuterocanonical entries.
- ✅ 50/50 VN/EN ratio: 66 `_quiz.json` (VI) + 66 `_quiz_en.json` (EN) files.
- ⚠️ **Bible version**: grep "BTTHĐ" or "BTT2011" returns 0 hits. Code references "Bản Truyền Thống 1926" (public-domain BTT 1926) in seed comments. **Spec says BTTHĐ 2011 (copyrighted) — likely spec is wrong** (project chose 1926 to avoid licensing).

**Verdict:** ⚠️ Partial — books OK, **Bible version constraint C4 conflicts with code**; needs decision in Phase 2.

---

## C5 — Answer color mapping

| Position | Color | Hex | Web evidence | Mobile evidence |
|---|---|---|---|---|
| A (idx 0) | Coral | #E8826A | `AnswerButton.tsx:29`, `tailwind.config.js:76` (`answer.a`) | `QuizScreen.tsx:18` POS_RGB[0] |
| B (idx 1) | Sky | #6AB8E8 | `AnswerButton.tsx:37`, `tailwind.config.js:77` (`answer.b`) | `QuizScreen.tsx:19` POS_RGB[1] |
| C (idx 2) | Gold | #E8C76A | `AnswerButton.tsx:45`, `tailwind.config.js:78` (`answer.c`) | `QuizScreen.tsx:20` POS_RGB[2] |
| D (idx 3) | Sage | #7AB87A | `AnswerButton.tsx:53`, `tailwind.config.js:79` (`answer.d`) | `QuizScreen.tsx:21` POS_RGB[3] |

**Verdict:** ✅ PASS — perfectly consistent. Mobile `colorPositionFor()` even handles 2-answer (T/F) edge case (A=Coral, D=Sage for max contrast).

---

## C6 — Group roles + Q-N route

- ✅ Backend: `GroupMember.java:14-16` enum `{LEADER, MOD, MEMBER}`
- ✅ Frontend: `GroupDetail.tsx:13,27,276,281,359-360` — typed role + `isLeader` / `isLeaderOrMod` checks
- ⚠️ **Q-N route**: Backend endpoint correctly renamed to `/api/groups/{id}/live-rooms` (not `/live-quiz`). However, **web frontend route is `/rooms` (generic multiplayer page)**, not `/live-rooms`. The original Q-N decision is about the API endpoint rename, which is ✅ — but spec should clarify that there's no separate `/live-rooms` SPA route.

**Verdict:** ✅ PASS (with route clarification needed in spec)

---

## C7 — Room lifecycle R1–R5

| Rule | Status | Evidence |
|---|---|---|
| **R1** Empty lobby → DELETE + ROOM_ENDED broadcast | ✅ | `RoomService.cleanupForPlayerLeave()` — currentPlayers==0 in LOBBY → endRoom() + broadcast `EMPTY_LOBBY`. `RoomPresenceListener.java:165-171` non-host disconnect → ALL_DISCONNECTED + endRoom() |
| **R2** Idle > `biblequiz.room.idle-timeout-minutes` (30 default) → DELETE | ✅ | `RoomCleanupScheduler.java:53-57` `@Scheduled fixedRate=10min` → `endLobbyRoomsOlderThan(now - 30min)`. Recent commit `1f40e6a` unified threshold (G4, G8) |
| **R3** ENDED retention 24h | ✅ | `RoomCleanupScheduler.java:66-70` `purgeExpiredEndedRooms()` deletes `cutoff = now - biblequiz.room.ended-retention-hours (24)`. V48 wires CASCADE. Commit `a1a8620` |
| **R4** Host disconnect 60s grace → promote | ✅ | `RoomPresenceListener.java:29-45,99-112` — schedules grace via `taskScheduler` (60s default `biblequiz.room.reconnect-grace-seconds`); `:147-159` promotes next member or ends with HOST_GONE |
| **R5** All disconnect > 60s OR stuck IN_PROGRESS > 90 min → auto-end | ✅ | `RoomPresenceListener.java:163-171` (all-disconnect); `RoomAbandonmentScheduler.java:30-76` STUCK_THRESHOLD_MINUTES=90L. Commit `7a43b0f` |
| **CANCELLED status deprecated** | ⚠️ | `Room.java:93` enum value still defined; `RoomPresenceListener.java:140` defensive check exists. Setter `setStatus(CANCELLED)` — **0 hits in code**. Safe to remove. |

Recent commits `5aef216`, `1f40e6a`, `7a43b0f`, `a1a8620`, `0e65bd9` confirm active hardening of R1–R5.

**Verdict:** ✅ PASS — fully wired. Cleanup nit: drop CANCELLED enum value.

---

## C8 — SPEC_GROUP locked decisions

| Decision | Status | Evidence |
|---|---|---|
| Q-A Solo quiz NOT in group leaderboard | ⚠️ Partial | `ChurchGroupService.getLeaderboard():86-127` — scopes to `groupMemberRepository.findByGroupId(groupId)` ✅ but sums all `UserDailyProgress` (no source filter). **Group members only ✅; solo-vs-group score distinction ❌** |
| Q-B Sequential mode = manual advance | ✅ | `RoomWebSocketController.java:514-540` — `/advance` handler gated to `GROUP_LIVE_SEQUENTIAL`; `:204-213` answer submit emits `SEQUENTIAL_PROGRESS` only, no auto-advance |
| Q-C Bỏ dedup live + solo path | ✅ | `ChurchGroupController.java:78-82` "Per spec v1.1 §7.5: each click creates a new room — no dedup" — confirmed no dedup in `roomService.createRoom()` |
| Q-D Mod role v1 exists | ✅ | `GroupMember.java:14-16` enum has MOD; `ChurchGroupService` enforces LEADER || MOD checks |
| Q-N `/live-quiz` → `/live-rooms` | ✅ (BE) / ⚠️ (FE) | BE: `ChurchGroupController.java:85,90` — `/live-rooms` ✅. FE route is `/rooms` (no `/live-rooms` SPA route). API parity preserved. |
| Q-O `questionIds` JSON list | ✅ | `GroupQuizSet.java:30-32` — `@Convert(JsonListConverter) columnDefinition="JSON"` `List<?> questionIds`. V35-V37 migrations |
| Multi-leader (defer v1.5) | ✅ Deferred | Only 1 LEADER per group (one `leader_id` FK on ChurchGroup); multi-leader logic absent |

**Verdict:** ✅ Mostly match. Q-A scoring scope and Q-N route note for Phase 2 spec.

---

## C9 — Defer list (must NOT be shipped)

| Feature | Status | Evidence |
|---|---|---|
| TV Host Mode (Kahoot 2-screen) | ✅ Deferred | `grep "tv-host\|TvHost\|host mode"` → 0 hits |
| Multi-leader system | ✅ Deferred | GroupMember has single LEADER + MOD workaround; no multi-leader logic |
| Seasonal UI theming | ✅ Deferred | `grep "seasonal.*theme\|snow effect"` → 0 hits |
| Friend System | ✅ Deferred | Challenge entity exists (peer challenges) but no Friend entity / friendship table |
| Premium tier / Subscription | ✅ Deferred | `grep "premium\|subscription"` returns false positives only (no payment/tier logic) |
| Offline mode (full PWA) | ✅ Deferred | `OfflineBanner.tsx` + `useOnlineStatus.ts` use `navigator.onLine` only; no service-worker cache strategy |

**Verdict:** ✅ PASS — defer list correctly absent from shipped code.
