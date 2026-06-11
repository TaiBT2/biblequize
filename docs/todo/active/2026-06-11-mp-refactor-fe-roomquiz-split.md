# 2026-06-11 — MP refactor FE: typed STOMP events + useRoomChannel + RoomQuiz split

> **Source**: Refactor review 2026-06-11 (branch `refactor/multiplayer`). RoomQuiz.tsx = god component
> (1.530 LOC, 47 useState, 23 STOMP events inline); onMessage switch trùng lặp với RoomQuizHost;
> reconnect không rehydrate (F-web-4).
> **Scope**: Structure only — NO behavior change. Render output + event semantics giữ nguyên.
> **Status**: DONE (2026-06-11) — FMR-1..8 complete; vitest 1283/1284 pass (same 1 pre-existing fail).
> **Baseline**: FE vitest 1283/1284 pass @ ad5378a — **1 fail PRE-EXISTING**
> ("Câu hỏi test?" / "✓ ĐÁP ÁN" — thực tế nằm ở `room/__tests__/RoomQuizHost.test.tsx:64`,
> assert hành vi pre-anti-spoiler), KHÔNG phải do refactor này; đừng đuổi theo nó trong sprint này.

### Code prefix: `FMR` (FE Multiplayer Refactor)

### Invariants (must not break)
- Anti-spoiler: `correctIndex === null` cho tới ROUND_END/QUESTION_REVEALED — hook không được expose sớm.
- Identity theo `userId` (server-stable), KHÔNG dùng `localStorage.userName` cho logic (fix d504299b).
- Score server-authoritative — FE chỉ render; combo banner cosmetic giữ nguyên.
- Timer neo `startedAtMs` từ server (250ms recompute) giữ nguyên.

### Tasks

- [x] FMR-1 Typed STOMP event union trong `src/types/room.ts`
  - DONE: `RoomEvent` discriminated union 32 event types; payload shapes mirror what FE reads today
    (unconsumed events `NEXT_QUESTION`/`SD_QUEUE_UPDATE`/`ROOM_STARTING`/`ERROR` keep `unknown` data).
    Canonical `PlayerScore`/`RoomQuestion`/`RoomDetails`/`RoomPlayer` moved here; `RoomOverlays.tsx`
    re-exports `PlayerScore` so existing imports (QuizEndScreen/Podium/tests) keep working.
  - Files: `src/types/room.ts`, `src/pages/room/RoomOverlays.tsx`
- [x] FMR-2 `useRoomChannel(roomId, handlers)` hook — gộp useStomp + reconnect rehydrate (fix F-web-4)
  - DONE: `src/hooks/useRoomChannel.ts` — typed `onEvent`, `onReconnect`, `onRehydrateQuestion`
    (GET `/api/rooms/{id}/current-question` on every reconnect, silent 204/error) + exported
    `fetchCurrentQuestion()` helper reused by mount rehydrates. Adopted in RoomQuiz (rehydrate:
    new question.id → full QUESTION_START flow; same id → re-anchor timer only), RoomQuizHost
    (overwrite only when question.id changed) and RoomLobby (onReconnect → fetchRoom; no question).
  - Files: `src/hooks/useRoomChannel.ts`, `src/pages/RoomQuiz.tsx`, `src/pages/room/RoomQuizHost.tsx`, `src/pages/RoomLobby.tsx`
- [x] FMR-3 Per-mode hooks — each owns its useState cluster + `handleEvent(RoomEvent)`
  - DONE: `src/pages/room/hooks/useBattleRoyale.ts` (+`spectate()`), `useTeamVsTeam.ts`
    (+`applyQuizEnd()` for the TvT QUIZ_END slice), `useSuddenDeath.ts` (+`dismissMatchResult()`),
    `useSequentialMode.ts`. Dispatcher routes EVERY event through all 4 hooks — same semantics as
    the pre-split single switch (mode events mutate their slice regardless of active mode).
- [x] FMR-4 Tách `RoomQuiz` → shell + per-mode views; core state → useReducer
  - DONE: `src/pages/room/roomQuizCore.ts` (pure `coreGameReducer` + `CoreGameState`;
    side effects stay in the page dispatcher), `src/pages/room/RoomQuizShell.tsx` (shared chrome —
    header/timer/answer grid/scoreboards/live feed/host-echo overlays; JSX moved verbatim,
    data-testids + CSS classes unchanged), `src/pages/room/views/{SpeedRace,BattleRoyale,
    TeamVsTeam,SuddenDeath,Sequential}View.tsx` (mode fragments; gating conditions stay in shell).
    `RoomQuiz.tsx` (1530 → ~470 LOC) is now the composition point: reducer + mode hooks +
    typed channel + effects + full-screen end/elimination overlays.
- [x] FMR-5 RoomQuizHost dùng chung typed dispatcher — bỏ parse trùng
  - DONE: switch narrows on `RoomEvent` (no per-case `as` casts); local `Question` aliased to
    shared `RoomQuestion` (legacy unused `correctAnswer?` dropped from the type — anti-spoiler);
    mount seed reuses `fetchCurrentQuestion()` (seed-if-empty semantics preserved).
- [x] FMR-6 modeMeta: `GROUP_LIVE_SEQUENTIAL` entry + `createdViaApi: true`; MODE_LIST giữ 4
  - DONE: new `AnyRoomModeId` union (`RoomModeId` stays the 4 selectable — `MODE_DEFAULTS`,
    `Multiplayer.MODE_DISPLAY_LABEL` etc. unaffected); `MODE_META` now `Record<AnyRoomModeId,…>`;
    additive i18n keys `room.modes.group_live_sequential` + `createRoom.modeDesc.group_live_sequential`
    (vi/en). Existing keys untouched.
  - Files: `src/pages/create-room/modeMeta.ts`, `src/i18n/vi.json`, `src/i18n/en.json`
- [x] FMR-7 Identity sweep — logic reads by `userId`/`viewerUserId` only
  - DONE (RoomLobby init): `myPlayer` + PlayerSlot `isMe` match by `viewerUserId`/`userId` only —
    username fallback removed; `myUsername()` helper deleted. RoomQuiz had no remaining userName
    *logic* reads; `localStorage.userName` survives only as display prop (QuizEndScreen /
    RoundScoreboard / SdArenaHeader / SequentialFinalView render "me" highlighting by username
    internally — changing their prop contracts would touch component tests' assertions → out of
    scope this sprint, noted as residual F-web-2 surface).
- [x] FMR-8 Run vitest + update `.test-baseline`
  - DONE: 1283 passed / 1 failed (same pre-existing `RoomQuizHost.test.tsx` "✓ ĐÁP ÁN" anti-spoiler
    expectation — untouched per instructions). No test assertions changed; no test imports needed
    updating (mocked module paths still resolve — `useRoomChannel` wraps the mocked `useStomp`).
    `.test-baseline` 1282 → 1283.

### Deferred (KHÔNG làm sprint này)
- STOMP ack/retransmit cho optimistic submit (F-web-3) — cần BE hợp tác.
- Countdown escape hatch (F-web-8).
- Zustand room store toàn cục — useReducer per-page đủ cho sprint này.

### Order: FMR-1 → FMR-2 → (FMR-3+FMR-5 parallel) → FMR-4 → FMR-6 → FMR-7 → FMR-8.

### Notes
- Commit nhỏ từng FMR-n, vitest pass trước mỗi commit (trừ 1 fail pre-existing BasicQuiz), English commit message.
- E2E W-M06-* specs là contract guard tốt — chạy smoke nếu môi trường lên sẵn.
