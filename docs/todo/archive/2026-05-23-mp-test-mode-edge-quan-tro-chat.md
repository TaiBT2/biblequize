# 2026-05-23 — MP audit P0+P1: Mode edge cases + Quản trò + Chat

> **Source**: Lead-tester audit 2026-05-23 (multiplayer coverage gap analysis).
> **Scope**: P0 #6–#10 mode-specific edge + P1 #11–#14 Sprint 4 Quản trò controls + chat + TVT auto-balance.
> **Status**: TODO
> **Depends**: `WSContext` helper từ MPL-0.

### Code prefix: `MPM` (Multiplayer Mode-edge)

### Tasks

- MPM-1 Group room scope (groupId-only join)
  - Status: `[ ]` TODO · Spec: SPEC_GROUP §10, BL-2
  - Detail: room với `groupId != null` → member POST `/join` OK; non-member → 403/422; group leaderboard contribution rule (Q-A locked group-play-only, BL-2 backend chưa fix nhưng test viết theo spec để baseline).
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-group-room.spec.ts`

- MPM-2 BR all-wrong amnesty round
  - Status: `[x]` DONE — commit 166eed20. Deterministic strategy: all players timeout → empty correctAnswerers → amnesty fires; 0 PLAYER_ELIMINATED across 5 rounds.
  - Detail: 3+ ACTIVE players, tất cả sai 1 câu → KHÔNG `PLAYER_ELIMINATED` broadcast; BR_UPDATE.activeCount unchanged; round kế tiếp tiếp tục.
  - Files: bổ sung vào `W-M06-quickmatch-battle-royale.spec.ts` (BR-L3-002 stub đã có)

- MPM-3 SD queue advance + spectator state
  - Status: `[~]` PARTIAL — commit f20bd916 (1 case): 3 players queue init + matchups → 1 champion, ≥1 MATCH_END, no rank ties. Specific tie-break + spectator-can't-answer cases defer.
  - Sub-cases:
    - Queue rỗng + 1 champion → `MATCH_END` final + game terminal, `finalRank=1` cho champion
    - Loser → SPECTATOR (POST answer reject); winningStreak++; next challenger ACTIVE
    - Close threshold 200ms tie-break: cùng đúng ≤200ms khác biệt → continue cùng matchup; MAX_CONTINUES=3 force loss theo `averageReactionTime` cao hơn
  - Files: bổ sung vào `W-M06-quickmatch-sudden-death.spec.ts` (SD-L3-002/003/004 stub đã có)

- MPM-4 TVT team switch IN_PROGRESS rejected + auto-balance
  - Status: `[~]` PARTIAL — LOBBY auto-balance + switch-team done (commit 9df3e1df, 2 cases). IN_PROGRESS reject case needs WS to start game → deferred.
  - Sub-cases:
    - LOBBY: POST `/switch-team` OK; IN_PROGRESS: 422 với message rõ ràng
    - Join sequential 4 players → team A=2, B=2 (balanced); 5th player → team với fewer
    - Odd-out 5v4 accepted; FE warning rendered
  - Files: bổ sung vào `W-M06-quickmatch-team-vs-team.spec.ts`

- MPM-5 Anti-spoiler Quick Match (lazy server-side)
  - Status: `[x]` DONE — commit 5b85914d (3 REST cases): leak scan on POST + GET responses, /current-question 204 in LOBBY.
  - Detail: GET `/api/rooms/{id}` của QM room trước `QUESTION_START` → response KHÔNG chứa text câu hỏi/đáp án (server lazy-select). So sánh response payload thô vs sau QUESTION_START.
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-anti-spoiler.spec.ts`

- MPM-6 Quản trò Sprint 4 controls (5 endpoints)
  - Status: `[~]` PARTIAL — negatives done (commit 477a1d0d, 3 cases): all-5-reject-on-QM + all-5-reject-non-host + broadcast-length. Happy paths defer (need WS to flip IN_PROGRESS).
  - 5 endpoint × 2 case (happy + unauthorized non-host = 422):
    - `/host/pause` → broadcast GAME_PAUSED, latch chờ ≤5 phút
    - `/host/resume` → broadcast GAME_RESUMED, latch countDown
    - `/host/skip-question` → no points awarded, broadcast QUESTION_SKIPPED, advance
    - `/host/broadcast` body `{ message }` ≤200 chars → HOST_BROADCAST
    - `/host/end-early` → broadcast ROOM_ENDED reason=HOST_ENDED_EARLY
  - Negative: từng endpoint gọi bởi non-host → 422 (chỉ chủ phòng) hoặc 403
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-quan-tro-controls.spec.ts`

- MPM-7 Sequential mode (GROUP_LIVE_SEQUENTIAL)
  - Status: `[ ]` TODO · Spec: §3.5
  - Sub-cases:
    - `broadcastIsCorrect=false` trong ANSWER_SUBMITTED (anti-spoiler giữa câu)
    - Host emit `/app/room/{id}/advance` → next question; non-host emit → reject
    - 10-min idle timeout (`LEADER_ADVANCE_MAX_WAIT_SECONDS=600`) auto-release latch
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-sequential.spec.ts`

- MPM-8 Chat over STOMP
  - Status: `[x]` DONE — pending commit (3 cases): broadcast contract, empty/whitespace drop, >500-char trim.
  - Sub-cases: send → broadcast tới mọi subscriber; rate limit (TBD); max chars; chat trong IN_PROGRESS OK; history fetch khi rejoin
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-chat.spec.ts`

### Notes
- Hầu hết task ở đây cần `WSContext` (MPL-0). Có thể chạy parallel sau khi helper sẵn.
- MPM-6 negative cases (non-host) là REST-only → có thể làm sớm không cần WS helper.
