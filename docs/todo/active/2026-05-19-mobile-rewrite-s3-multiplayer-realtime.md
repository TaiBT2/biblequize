# 2026-05-19 — Mobile rewrite S3: multiplayer realtime full

> **Source**: Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) Sprint 3
> **Scope**: 5-mode overlay parity, chat + reactions, Quản trò host screen, RoomAnalytics. Build trên S1 minimal SPEED_RACE flow. **Defer sound** (cần expo-av assets — net-new, không block beta).
> **Why now**: S2 beta đã ship-ready, S3 đóng full multiplayer parity → unblock M2 milestone (full feature parity).

> **Recon (2026-05-19)**: Mobile QuizScreen single-player đã có timer ring + useHaptic + POS_RGB → reusable. Web có EliminationScreen/TeamScoreBar/MatchResultOverlay/ReactionBar patterns → port mobile. BE chat dest `/app/room/{id}/chat` + reaction `/app/room/{id}/reaction`. RoomAnalytics `GET /api/rooms/{id}/analytics` returns per-round breakdown.

### Tasks

- **S3-1 Extract CountdownTimer component (reusable)**
  - Pull SVG ring + 4-colour state logic từ [QuizScreen.tsx](../../../apps/mobile/src/screens/quiz/QuizScreen.tsx) ra `apps/mobile/src/components/quiz/CountdownTimer.tsx`. Props: `{ timeLeft, timeLimit, size? }`.
  - Replace inline impl trong QuizScreen với `<CountdownTimer />`.
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/quiz/CountdownTimer.tsx` (new), `apps/mobile/src/screens/quiz/QuizScreen.tsx`
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S3-2 MultiplayerQuizScreen — timer + haptic + combo**
  - Add `<CountdownTimer />` từ S3-1, tick down từ QUESTION_START timeLimit
  - useHaptic trigger 'success' khi answer correct, 'error' khi wrong (detect từ ROUND_END correctIndex vs selected)
  - Combo state: increment khi correct, reset khi wrong, display "🔥 N" badge
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/multiplayer/MultiplayerQuizScreen.tsx`
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S3-3 ChatOverlay component + STOMP wire**
  - New `apps/mobile/src/components/multiplayer/ChatOverlay.tsx` — modal bottom-sheet: list messages (sender + text + time) + input + send button
  - Listen CHAT_MESSAGE event → append to messages state
  - Send `/app/room/{roomId}/chat` { text } — 500 char limit (BE enforces)
  - Add toggle button "Chat" trong MultiplayerQuizScreen + RoomWaitingScreen
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/multiplayer/ChatOverlay.tsx` (new), `apps/mobile/src/screens/multiplayer/MultiplayerQuizScreen.tsx`, `apps/mobile/src/screens/multiplayer/RoomWaitingScreen.tsx`
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S3-4 ReactionBar component (6 emojis + cooldown)**
  - New `apps/mobile/src/components/multiplayer/ReactionBar.tsx` — 6 emoji buttons `['👏','😂','😱','🔥','💪','🙏']`, 1.5s cooldown
  - Floating incoming reaction animation (slide up + fade, 2s)
  - Listen REACTION event → enqueue, render max 6 simultaneously
  - Send `/app/room/{roomId}/reaction` { reaction } — BE rate limits 3/10s
  - Wire trong MultiplayerQuizScreen
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/multiplayer/ReactionBar.tsx` (new), `apps/mobile/src/screens/multiplayer/MultiplayerQuizScreen.tsx`
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S3-5 BATTLE_ROYALE EliminationScreen overlay**
  - New `apps/mobile/src/components/multiplayer/EliminationOverlay.tsx` — full-screen modal khi user bị eliminate. Props: `{ rank, totalPlayers, onContinueSpectate }`. Error-red theme + skull icon + "Hạng #N/Tổng" + "Xem tiếp" button.
  - Listen PLAYER_ELIMINATED event với matchUserId === me → show overlay, set spectator mode
  - activeCount status text "X người còn lại" trên QuizScreen header
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/multiplayer/EliminationOverlay.tsx` (new), `apps/mobile/src/screens/multiplayer/MultiplayerQuizScreen.tsx`
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S3-6 TEAM_VS_TEAM TeamScoreBar component**
  - New `apps/mobile/src/components/multiplayer/TeamScoreBar.tsx` — horizontal bar Team A (blue) vs Team B (red) proportional fills + score numbers + "Perfect!" badge khi cả team correct round
  - Listen TEAM_SCORE_UPDATE event → update scoreA/scoreB
  - Wire trên top MultiplayerQuizScreen khi mode === TEAM_VS_TEAM
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/multiplayer/TeamScoreBar.tsx` (new), `apps/mobile/src/screens/multiplayer/MultiplayerQuizScreen.tsx`
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S3-7 SUDDEN_DEATH MatchResultOverlay**
  - New `apps/mobile/src/components/multiplayer/MatchResultOverlay.tsx` — modal 3s auto-dismiss showing winner/loser names + next match countdown. Props: `{ winnerName, loserName, iWon }`.
  - Listen MATCH_RESULT event với mode === SUDDEN_DEATH → show overlay
  - Status: [ ] TODO
  - Files: `apps/mobile/src/components/multiplayer/MatchResultOverlay.tsx` (new), `apps/mobile/src/screens/multiplayer/MultiplayerQuizScreen.tsx`
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S3-8 Quản trò (RoomQuizHostScreen) — basic host controls**
  - New `apps/mobile/src/screens/multiplayer/RoomQuizHostScreen.tsx` — render khi user is host AND room.hostPlaysGame === false
  - Display real-time player list + scores (live leaderboard từ STOMP events)
  - 5 host action buttons: Pause / Resume / Skip Question / Broadcast / End Early
  - Each calls `POST /api/rooms/{id}/host/{pause|resume|skip-question|broadcast|end-early}`
  - Navigate from RoomWaitingScreen khi host start AND !hostPlaysGame
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/multiplayer/RoomQuizHostScreen.tsx` (new), `apps/mobile/src/screens/multiplayer/RoomWaitingScreen.tsx` (nav logic), `apps/mobile/src/navigation/types.ts` + `MainTabNavigator.tsx`/RootNavigator (route reg)
  - Spec impact: BL-11 progress + SPEC_MULTIPLAYER Sprint 4 Host-Organizer separation. Strategy: (c) `[no-spec-impact]`.

- **S3-9 RoomAnalyticsScreen — post-game per-question breakdown**
  - New `apps/mobile/src/screens/multiplayer/RoomAnalyticsScreen.tsx` — fetch `GET /api/rooms/{id}/analytics`, render per-round Card:
    - Question content + correct option highlight
    - Distribution bars (4 options với count + %)
    - Avg response time
    - Top player rankings
  - Add "Xem chi tiết" button trên MultiplayerResultsScreen → navigate Analytics
  - Status: [ ] TODO
  - Files: `apps/mobile/src/screens/multiplayer/RoomAnalyticsScreen.tsx` (new), `apps/mobile/src/screens/multiplayer/MultiplayerResultsScreen.tsx`, navigation route reg
  - Spec impact: BL-11 progress. Strategy: (c) `[no-spec-impact]`.

- **S3-10 Tầng 3 regression + mark sprint DONE + close BL-11**
  - mobile jest ≥ 33 baseline
  - mobile tsc clean
  - Web không touched (skip vitest)
  - Update roadmap S3 → DONE, BL-11 → close (5-mode + Quản trò + RoomAnalytics đã done; chat + reactions wired; Cosmetics + SetEditor + Scheduled defer S4-S6)
  - Status: [ ] TODO

### Common

- **Spec impact**: BL-11 mostly closed (multiplayer realtime + Quản trò + RoomAnalytics ✅; Cosmetics + SetEditor + Scheduled + Help defer S4-S6). SPEC_MULTIPLAYER §3 mode behavior reflected trong overlays.
- **Spec strategy**: tất cả (c) `[no-spec-impact]` — FE wiring tới existing BE behavior.
- **Sensitive files**: `App.tsx` không touched. `apps/mobile/src/screens/quiz/QuizScreen.tsx` touched ở S3-1 (extract component, no behavior change).
- **Out of scope S3 (defer)**:
  - **Sound integration** (cần expo-av audio assets + manager — net-new, defer S6 polish)
  - Real-time chat moderation (BE handles 500 char + rate limit)
  - Push notifications cho chat
  - SPEAKER_PERMISSION mode toggles
  - Sequential mode per-player reveal animation (defer S4 nếu Group features touch)

### Verification

- Sau S3: 5 mode overlays mobile parity với web (BR/TVT/SD + SPEED_RACE inherited + GROUP_LIVE pending S4).
- Chat + reactions hoạt động end-to-end giữa 2+ devices (verify manual S2 beta build).
- Quản trò screen độc lập, host có thể pause/skip/broadcast.
- RoomAnalytics render full per-question breakdown.
- BL-11 multiplayer realtime row marked CLOSED.
- Master roadmap S3 → ✅ DONE.
