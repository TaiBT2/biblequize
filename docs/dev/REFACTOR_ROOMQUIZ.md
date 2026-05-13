# Refactor design: RoomQuiz.tsx → useGameMode strategy

**Date:** 2026-05-13 (CQ-11 investigation output)
**Source:** `chore/code-quality-improvements` branch · Code Quality Audit Phase 4
**Goal:** Split `apps/web/src/pages/RoomQuiz.tsx` (1508 LOC) into a `useGameMode(mode)` strategy hook + 5 mode-specific hooks. Target: <800 LOC orchestrator.

---

## 1. Mode detection

`gameMode` comes from route state ([RoomQuiz.tsx:54](apps/web/src/pages/RoomQuiz.tsx#L54)): `state?.mode ?? 'SPEED_RACE'`. Boolean flags derived at lines 57–60:

| Flag | `gameMode` value |
|---|---|
| `isBattleRoyale` | `'BATTLE_ROYALE'` |
| `isTeamVsTeam` | `'TEAM_VS_TEAM'` |
| `isSuddenDeath` | `'SUDDEN_DEATH'` |
| `isSequential` | `'GROUP_LIVE_SEQUENTIAL'` |
| (default fallback) | `'SPEED_RACE'` |

Type union: `apps/web/src/types/room.ts:1-6`.

## 2. Per-mode state shape

### Battle Royale (~220 LOC)
- **State** ([L85-93](apps/web/src/pages/RoomQuiz.tsx#L85)): `activeCount`, `totalCount`, `isEliminated`, `myRank`, `showEliminationScreen`, `isSpectator`, `toasts`
- **STOMP** ([L311-327](apps/web/src/pages/RoomQuiz.tsx#L311)): `PLAYER_ELIMINATED`, `BATTLE_ROYALE_UPDATE`
- **Render** ([L849-858](apps/web/src/pages/RoomQuiz.tsx#L849)): elimination toasts + header `{activeCount}/{totalCount}` badge

### Team vs Team (~190 LOC)
- **State** ([L96-103](apps/web/src/pages/RoomQuiz.tsx#L96)): `myTeam`, `teamScoreA/B`, `perfectA/B`, `teamWinner`, `teamWinScoreA/B`
- **STOMP** ([L330-346](apps/web/src/pages/RoomQuiz.tsx#L330)): `TEAM_ASSIGNMENT`, `TEAM_SCORE_UPDATE`, `PERFECT_ROUND`
- **Render** ([L1017-18](apps/web/src/pages/RoomQuiz.tsx#L1017) + [L1403-12](apps/web/src/pages/RoomQuiz.tsx#L1403)): TeamScoreBar header, team affiliation pill, perfect-round banner, TeamWinScreen end overlay

### Sudden Death / Survival (~220 LOC)
- **State** ([L106-114](apps/web/src/pages/RoomQuiz.tsx#L106)): `sdChampionName/Id/Streak`, `sdChallengerName/Id`, `sdQueueRemaining`, `sdMatchResult`, `sdSpectating`, `sdMyUserId`
- **STOMP** ([L350-369](apps/web/src/pages/RoomQuiz.tsx#L350)): `MATCH_START`, `MATCH_END`
- **Render** ([L1020-27](apps/web/src/pages/RoomQuiz.tsx#L1020) + [L861-69](apps/web/src/pages/RoomQuiz.tsx#L861) + [L953-58](apps/web/src/pages/RoomQuiz.tsx#L953)): SdArenaHeader, MatchResultOverlay, spectator badge

### Sequential / Group Live (~150 LOC)
- **State** ([L117-119](apps/web/src/pages/RoomQuiz.tsx#L117)): `seqAnswered`, `seqTotal`, `revealedData`
- **STOMP** ([L220-238](apps/web/src/pages/RoomQuiz.tsx#L220)): `SEQUENTIAL_PROGRESS`, `QUESTION_REVEALED`
- **Render** ([L1150-88](apps/web/src/pages/RoomQuiz.tsx#L1150) + [L1269-379](apps/web/src/pages/RoomQuiz.tsx#L1269)): purple timer ring, progress bar, dotted waiting strip, per-player answer grid, host advance button

### Speed Race / Quick Match (~80 LOC)
Fallback. No mode-specific state. Hook exists for symmetric API parity. Reacts to generic `ROUND_END` + `QUIZ_END` only.

## 3. Shared concerns (stay in parent orchestrator)

| Domain | Files / Lines |
|---|---|
| Core Q&A state | `question`, `selected`, `correctIndex`, `submitting`, `timeLeft`, `timeLimit`, `questionIndex`, `totalQuestions` ([L74-82](apps/web/src/pages/RoomQuiz.tsx#L74)) |
| Leaderboard | `scores: PlayerScore[]` ([L79](apps/web/src/pages/RoomQuiz.tsx#L79)) — all modes consume |
| Session identity | `myUsername`, `myUserId`, `roomId`, `isHost`, timing refs |
| Handlers | `submitAnswer` ([L588-616](apps/web/src/pages/RoomQuiz.tsx#L588)), `send` from useStomp |
| Effects | timer tick ([L487-98](apps/web/src/pages/RoomQuiz.tsx#L487)), mount rehydration ([L531-73](apps/web/src/pages/RoomQuiz.tsx#L531)), end-sound ([L503-09](apps/web/src/pages/RoomQuiz.tsx#L503)) |
| Global UI | pause overlay, skip toast, broadcast banner ([L459-78](apps/web/src/pages/RoomQuiz.tsx#L459)), combo banner ([L839-46](apps/web/src/pages/RoomQuiz.tsx#L839)), reaction bar ([L760-63](apps/web/src/pages/RoomQuiz.tsx#L760)), explanation panel ([L1255-67](apps/web/src/pages/RoomQuiz.tsx#L1255)), reveal stats ([L1245-53](apps/web/src/pages/RoomQuiz.tsx#L1245)), live feed ([L1420-55](apps/web/src/pages/RoomQuiz.tsx#L1420)), round-answered tracker ([L164](apps/web/src/pages/RoomQuiz.tsx#L164)) |
| End-screen | `showPodium`, `finalResults` (set by parent on QUIZ_END; modes may override overlay) |

## 4. Proposed `useGameMode` interface

```ts
// apps/web/src/hooks/gameModes/types.ts
export interface GameModeStrategy {
  /** Apply a STOMP frame to mode-local state. Parent calls for every msg. */
  onMessage: (msg: StompFrame) => void;
  /** Mode-specific end overlay (e.g. TeamWinScreen). null → use default QuizEndScreen. */
  endOverlay: ReactNode | null;
  /** Mode-specific header content (above question). */
  headerBar: ReactNode | null;
  /** Floating alerts/toasts (e.g. Battle Royale elimination, Sudden Death match result). */
  alerts: ReactNode | null;
  /** Scoreboard sidebar icon + label. */
  scoreboardLabel: { icon: string; label: string };
  /** False when player can't answer (spectator, eliminated). */
  canAnswer: boolean;
  /** Whether to show mobile waiting overlay between rounds. */
  showMobileWaiting: boolean;
}

export type UseGameMode = (deps: GameModeDeps) => GameModeStrategy;

export interface GameModeDeps {
  myUserId: string | null;
  myUsername: string;
  scores: PlayerScore[];
  send: StompSender;
  navigate: NavigateFn;
  finalResults: PlayerScore[] | null; // read-only, parent owns
}
```

**Opinionated decisions:**
- Mode hook owns its STOMP interpretation — parent never branches on mode inside the message handler.
- Mode hook returns derived React nodes; no callbacks upward.
- Parent owns `showPodium / finalResults` (shared end-screen state); modes only override via `endOverlay`.
- Data flow unidirectional: parent → mode (deps); mode → parent (rendered nodes only).

## 5. Per-mode file plan

```
apps/web/src/hooks/gameModes/
├── types.ts                  GameModeStrategy + GameModeDeps interfaces
├── useGameMode.ts            Factory: dispatch by mode string → return strategy
├── useBattleRoyale.ts        ~220 LOC
├── useTeamVsTeam.ts          ~190 LOC
├── useSurvivalMode.ts        ~220 LOC  (Sudden Death)
├── useSequentialMode.ts      ~150 LOC  (Group Live Sequential — not in original 5-mode list but exists in code)
└── useQuickMatch.ts          ~80 LOC   (Speed Race — null strategy / minimal)
```

## 6. Migration risk

| Risk | Mitigation |
|---|---|
| `finalResults` / `showPodium` shared but Team vs Team needs custom end overlay | Parent owns state; modes return `endOverlay: ReactNode \| null` via strategy |
| `roundAnswered` tracker used by mobile waiting overlay (cross-mode) | Stays in parent; modes signal `showMobileWaiting: boolean` |
| `scores` leaderboard updated by parent — modes read it | Pass via `GameModeDeps` (read-only) |
| Mode hooks need `useStomp.send` for ack/heartbeat | Pass via deps; modes call but don't manage subscription lifecycle |
| Old `if (isBattleRoyale) ... else if (isTeamVsTeam) ...` branches | Replaced by single `strategy.endOverlay`, `strategy.alerts`, etc. accessor in JSX |

## 7. LOC reduction estimate

| Hook | Extracted LOC |
|---|---|
| useBattleRoyale | 220 |
| useTeamVsTeam | 190 |
| useSurvivalMode | 220 |
| useSequentialMode | 150 |
| useQuickMatch | 80 |
| useGameMode + types | 60 |
| **Total extracted** | **~920** |

**Remaining in RoomQuiz.tsx:** ~580–600 LOC (1508 - 920 + interface adapters). Comfortably under 800 LOC target.

If any mode hook overshoots, carve out sub-utilities (e.g., `useBattleRoyaleToasts.ts`).

## 8. Implementation order (CQ-12..18)

| Step | Task | Scope |
|---|---|---|
| CQ-12 | Scaffolding | Create `types.ts`, `useGameMode.ts` factory, 5 stub hook files. RoomQuiz still inline — strategy returns nulls. Test: existing RoomQuiz tests pass unchanged. |
| CQ-13 | Battle Royale | Move state + STOMP handlers + render branches into `useBattleRoyale`. RoomQuiz calls strategy. |
| CQ-14 | Team vs Team | Same pattern. |
| CQ-15 | Sudden Death → useSurvivalMode | Same pattern. |
| CQ-16 | Sequential → useSequentialMode | Same pattern. |
| CQ-17 | Quick Match / Speed Race | Stub becomes real null-strategy. |
| CQ-18 | Cleanup | Final dead-code removal, RoomQuiz.tsx < 800 LOC verification. |

Each migration must pass existing RoomQuiz tests + add 1 unit test per hook for the move.
