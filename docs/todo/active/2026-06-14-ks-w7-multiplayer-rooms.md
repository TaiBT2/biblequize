# 2026-06-14 — KS W7: Multiplayer & Rooms

> **Source**: [Khung Sáng master plan](2026-06-14-khung-sang-migration-plan.md) · **Scope**: Phòng Chơi (lobby + 5 mode realtime + host + analytics). Jewel = emerald. Cần W0. Spec: SPEC_MULTIPLAYER (R1–R5).
> **Prefix**: `KS-W7`. ⚠️ Realtime gameplay — đổi visual KHÔNG đụng STOMP/logic. Có refactor MP gần đây (RMS/FMR DONE) — đọc trước.

### Tasks
- KS-W7-1 `/multiplayer` Multiplayer — Files: `pages/Multiplayer.tsx` + `pages/multiplayer/*` (RoomCard, QuickMatch*, EmptyState, JoinByCodeBar, WeeklyMultiplayerStatsWidget, AvatarStack)
- KS-W7-2 `/rooms` Rooms — Files: `pages/Rooms.tsx`
- KS-W7-3 `/room/create` CreateRoom — Files: `pages/CreateRoom.tsx` + `create-room/PreviewPanel.tsx`
- KS-W7-4 `/room/join` JoinRoom — Files: `pages/JoinRoom.tsx`
- KS-W7-5 `/room/:roomId/lobby` RoomLobby — Files: `pages/RoomLobby.tsx`
- KS-W7-6 `/room/:roomId/quiz` RoomQuiz — Files: `pages/RoomQuiz.tsx`, `room/RoomQuizShell.tsx`, `room/views/*` (BattleRoyale, Sequential, SpeedRace, SuddenDeath, TeamVsTeam) · gameplay focus, answer C5
- KS-W7-7 `/room/:roomId/host` RoomQuizHost — Files: `room/RoomQuizHost.tsx`, `room/RoomOverlays.tsx`, `room/Sequential{Lobby,Final}View.tsx` (Quản trò — vừa redesign QTR, phối hợp)
- KS-W7-8 `/room/:roomId/analytics` RoomAnalytics — Files: `pages/RoomAnalytics.tsx`
- KS-W7-9 Shared MP — `LiveFeed`, `ReactionBar`, `ShareCard`, `StarPopup`
  - Status [ ] TODO · Test: vitest + e2e quickmatch · **Spec impact** [ ] None [ ] SPEC_MULTIPLAYER §X · **Spec strategy** [ ] (c)
### Checklist: impl · Tầng 1+2+3 · KHÔNG đụng STOMP/lifecycle R1–R5 · commit (EN)
