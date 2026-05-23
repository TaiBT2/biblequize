# 2026-05-23 — MP audit P0: Lifecycle + Reconnect + Kick + Host Transfer

> **Source**: Lead-tester audit 2026-05-23 (multiplayer coverage gap analysis post Đấu Nhanh).
> **Scope**: 10 P0 case nhóm "production safety / data integrity". Prerequisite: shared `WSContext` multi-context WS helper.
> **Status**: TODO

### Code prefix: `MPL` (Multiplayer Lifecycle)

### Tasks

- MPL-0 Prerequisite: `WSContext` shared multi-context WS helper
  - Status: `[ ]` TODO · Files: `apps/web/tests/e2e/helpers/ws-context.ts` (new)
  - Detail: trừu tượng pattern từ `W-M06-survival-50p.spec.ts` — N browser contexts, STOMP connect, `subscribe('/topic/room/{id}')`, send `/app/room/{id}/ready`, listen for events with timeout + fan-out. API: `WSContext({ players, onEvent }).createQuickMatch(...).joinAll().readyAll().startBy(idx).expectEvent('QUESTION_START', n)`.
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- MPL-1 R1–R5 room lifecycle (5 separate cases)
  - Status: `[ ]` TODO · Spec: SPEC_MULTIPLAYER §4
  - Sub-cases:
    - R1 empty lobby: tất cả players leave → `currentPlayers=0` → room DELETED
    - R2 idle timeout: lobby idle >30 min → IDLE_TIMEOUT delete (test via time-shift hoặc admin trigger)
    - R4 HOST_GONE: host DC + no successor → delete (cần Sprint 4 host-organizer scenario riêng + legacy)
    - R5 STUCK_GAME: IN_PROGRESS >90 min → force end
    - R5 ALL_DISCONNECTED: mọi player DC >60s → end
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-lifecycle.spec.ts`

- MPL-2 Reconnect during 60s grace
  - Status: `[ ]` TODO · Spec: SPEC_MULTIPLAYER §6.1
  - Detail: mid-game DC → presence listener mark LEFT → reconnect <60s → status flip ACTIVE ([RoomService:120-121](apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java#L120-L121)); state rehydrate qua `GET /api/rooms/{id}/current-question`.
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-reconnect.spec.ts`

- MPL-3 Anti-cheat: double-submit + LEFT-player answer
  - Status: `[ ]` TODO · Spec: §3.1, [RoomWebSocketController:191](apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java#L191)
  - Detail: same `roundId+userId` POST 2x → reject lần 2; player status=LEFT → POST answer reject (status check line 199-202)
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-anti-cheat.spec.ts`

- MPL-4 Host kick + rejoin-after-kick
  - Status: `[ ]` TODO · Spec: §8 endpoint
  - Detail: host POST `/api/rooms/{id}/kick` (LOBBY only) → player removed; kicked user POST `/join` → expect blocked (verify BE actual rule; chưa rõ rule rejoin)
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-kick.spec.ts`

- MPL-5 Host transfer (Sprint 4 host-organizer R4)
  - Status: `[ ]` TODO · Spec: §6.x Sprint 4
  - Detail: Quản trò DC → grace 60s → next-host promoted; quản trò controls transfer (pause/skip/end-early khả dụng cho successor)
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-host-transfer.spec.ts`

### Order: MPL-0 trước (blocking), rồi MPL-1..5 parallel-able.

### Notes
- Test mid-game DC: dùng `page.context().close()` rồi reload tạo context mới + reconnect WS.
- Test idle timeout >30 min: cần BE expose admin endpoint hoặc time-shift (Redis TTL manipulation). Nếu không khả thi, mark `test.skip()` deferred.
