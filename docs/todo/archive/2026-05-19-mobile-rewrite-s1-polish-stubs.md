# 2026-05-19 — Mobile rewrite S1: polish 5 stubs + useStomp foundation

> **Source**: Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) Sprint 1
> **Scope**: Wire 4 multiplayer screens (RoomWaiting, MultiplayerQuiz, MultiplayerResults, TournamentBracket) + cleanup TryQuizScreen. Build foundational `useStomp` hook cho mobile. BL-4 đã closed trong S0-4 → skip.
> **Why now**: Sau S0 monorepo, mobile có thể dùng @biblequize/shared/types cho Room/Question/etc. S1 đóng các stub "looks broken" trước khi ship Expo Go internal beta ở S2. Full 5-mode multiplayer + Quản trò + RoomAnalytics defer S3.

> **BE infra confirmed (recon 2026-05-19)**: STOMP `/ws` với JWT trong CONNECT frame; topic `/topic/room/{id}`; 8 send dests `/app/room/{id}/{join,leave,ready,start,answer,advance,chat,reaction}`; 24 event types. REST `RoomController` đầy đủ create/join/start/leave/host-controls. Tournament `GET /api/tournaments/{id}/bracket` returns rounds×matches.

> **Sprint status (2026-05-19)**: ✅ DONE — 6 task wired + regression PASS.
> **Commits**: 261d125 (plan) · 8493f6d (S1-1 useStomp) · 364f81a (S1-2 TryQuiz type) · 535a73e (S1-3 RoomWaiting) · d6922ca (S1-4 MultiplayerQuiz) · 1b542a9 (S1-5 Results) · 9d32ac9 (S1-6 TournamentBracket).
> **Regression**: mobile jest 33/33 PASS · mobile tsc CLEAN · web untouched (no re-test needed).

### Tasks

- **S1-1 useStomp mobile hook (foundation)**
  - New `apps/mobile/src/hooks/useStomp.ts` — port từ [`apps/web/src/hooks/useStomp.ts`](../../../apps/web/src/hooks/useStomp.ts) sang RN (async token từ AsyncStorage, không `window.location`).
  - Export `getBaseURL` từ `apps/mobile/src/api/client.ts` để useStomp dùng.
  - Test: smoke jest unit — mock @stomp/stompjs Client, verify hook activate/deactivate.
  - Status: [x] DONE
  - Files: `apps/mobile/src/hooks/useStomp.ts`, `apps/mobile/src/api/client.ts` (export)
  - Spec impact: BL-15 progress (mobile chưa wire WS nên N/A trước, giờ có hook là chuẩn bị S3). Strategy: (c) `[no-spec-impact]`.

- **S1-2 TryQuizScreen — use shared Question type**
  - Replace inline `SAMPLE_QUESTIONS` shape với `Pick<Question, 'content' | 'options' | 'correctAnswer' | 'book'>` từ @biblequize/shared/types.
  - Keep 3 hardcoded samples (pre-auth onboarding, no BE call needed). Spec accepted-debt — onboarding sample.
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/onboarding/TryQuizScreen.tsx`
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S1-3 RoomWaitingScreen wire (REST + STOMP)**
  - REST `GET /api/rooms/{id}` on mount → set initial player list, room info.
  - useStomp subscribe `/topic/room/{id}` → listen PLAYER_JOINED/LEFT/READY/ROOM_STATE → update local players state.
  - Ready toggle button: `send('/app/room/{id}/ready', { ready: !ready })`.
  - Host start button: POST `/api/rooms/{id}/start` → navigate to MultiplayerQuiz.
  - Listen `ROOM_STARTING` → all players navigate.
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/multiplayer/RoomWaitingScreen.tsx`
  - Spec impact: BL-11 progress (multiplayer realtime stub → wired). Strategy: (c) `[no-spec-impact]`.

- **S1-4 MultiplayerQuizScreen minimal SPEED_RACE flow**
  - useStomp subscribe room topic → listen QUESTION_START (render question + options + countdown), ANSWER_SUBMITTED (show feedback), ROUND_END (show correct + leaderboard).
  - Send answer: `send('/app/room/{id}/answer', { questionId, selectedIndex, elapsedMs })`.
  - Listen QUIZ_END → navigate to MultiplayerResults với payload.
  - Skip mode-specific overlays (BR elimination, TVT team scores, SD match) — defer S3.
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/multiplayer/MultiplayerQuizScreen.tsx`
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S1-5 MultiplayerResultsScreen wire**
  - Accept results từ `route.params.results` (nav từ Quiz screen với QUIZ_END payload) HOẶC fallback fetch `GET /api/rooms/{id}/leaderboard` nếu params missing.
  - Render top 3 podium + full list scroll.
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/multiplayer/MultiplayerResultsScreen.tsx`
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S1-6 TournamentBracketScreen wire bracket endpoint**
  - Replace placeholder text với real `GET /api/tournaments/{id}/bracket` query.
  - Render rounds × matches grid (simple list per round, not visual tree).
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/multiplayer/TournamentBracketScreen.tsx`
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S1-7 Tầng 3 regression + mark sprint DONE**
  - `pnpm --filter mobile test` (jest, baseline 33)
  - `pnpm --filter mobile exec tsc --noEmit` clean
  - Web vitest baseline ≥ 1212 passing (S0 was 1253)
  - Update roadmap S1 → DONE, S1 file all tasks DONE, TODO.md index
  - Status: [x] DONE

### Common

- **Spec impact**: BL-11 progress note (multiplayer stub → wired baseline); BL-15 N/A (mobile fresh wiring, không có migration).
- **Spec strategy**: tất cả (c) `[no-spec-impact]` — pure FE wiring tới existing BE, không thay đổi spec.
- **Sensitive files**: KHÔNG đụng `apps/mobile/src/stores/authStore.ts`, `apps/mobile/src/api/client.ts` (chỉ export thêm).
- **Risk + rollback**:
  - useStomp mới — chưa có integration test với BE thật. E2E test S2 sẽ verify khi Expo Go beta.
  - MultiplayerQuiz/Waiting/Results không thể test full e2e mà không có BE running + 2+ player → smoke jest mock + manual QA defer S2 beta.
  - Nếu @stomp/stompjs incompatible RN/Expo, fallback: SockJS hoặc native WebSocket — defer S3 nếu phát sinh.

### Verification

- Sau S1-7: 5 stubs/partials đều render real data (RoomWaiting có player list thật, MultiplayerQuiz nhận QUESTION_START, Results render leaderboard, Tournament render bracket).
- Mobile test count ≥ baseline (sẽ ghi sau S1-7).
- Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) S1 → ✅ DONE.
