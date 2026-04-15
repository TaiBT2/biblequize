# W-M06 — Multiplayer Lobby (L2 Happy Path)

**Routes:** `/rooms`, `/multiplayer`, `/room/create`, `/room/join`, `/room/:id/lobby`
**Spec ref:** SPEC_USER §5.4
**Module priority:** Tier 4 (lobby only — gameplay ⏭️ Phase 5 WebSocket)

---

## ⏭️ DEFERRED Scope

Per CONVENTIONS: gameplay multiplayer (round flow, answer submission, elimination) → **Phase 5**.

L2 cover: lobby UI + create/join rooms + player list (1 context).

---

## W-M06-L2-001 — Create room: POST /api/rooms → returns room with join code

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @multiplayer @write @serial

**Actions**:
1. `POST /api/rooms` với body:
   ```json
   { "name": "E2E Test Room", "mode": "SPEED_RACE", "maxPlayers": 4 }
   ```

**API Verification**:
- Response 200 với:
  - `id`, `code` (6-char), `name`, `mode`, `maxPlayers`, `hostUserId` = test3
  - `players: [{ userId, name, isReady: false }]` (host auto-added)
  - `status: "WAITING"`

**Cleanup**:
- `DELETE /api/rooms/{id}`

---

## W-M06-L2-002 — UI create room flow: fill form → submit → redirect to lobby

**Priority**: P0
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @multiplayer @write @serial

**Actions**:
1. `page.goto('/room/create')`
2. Fill name, select mode, select maxPlayers
3. Click create

**Assertions**:
- URL redirects to `/room/{id}/lobby`
- Room code visible on lobby page
- Host (test3) visible trong player list

**Cleanup**:
- DELETE room

---

## W-M06-L2-003 — Join room by code: POST /api/rooms/join

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: test3 creates room, test4 joins
**Tags**: @happy-path @multiplayer @write @serial

**Setup**:
- test3 creates room → get code

**Actions** (test4):
1. Login test4
2. `POST /api/rooms/join` với `{ code: "<test3_roomCode>" }`

**API Verification**:
- Response: room info
- `GET /api/rooms/{id}` → players count 2

**Cleanup**:
- DELETE room

---

## W-M06-L2-004 — Join invalid code → 404

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @multiplayer @write @serial

**Actions**:
1. `POST /api/rooms/join` với `{ code: "XXXXXX" }`

**API Verification**:
- Response 404

---

## W-M06-L2-005 — Join full room → 409

**Priority**: P1
**Est. runtime**: ~8s
**Auth**: multi-user
**Tags**: @happy-path @multiplayer @write @serial

**Setup**:
- Create room với maxPlayers=2
- Fill with 2 users (test3 host + test4 join)

**Actions**:
1. test5 tries `POST /api/rooms/join` với same code

**API Verification**:
- Response 409 Conflict

**Cleanup**:
- DELETE room

---

## W-M06-L2-006 — Room list: GET /api/rooms → waiting rooms visible

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @multiplayer @parallel-safe

**Actions**:
1. `GET /api/rooms?status=WAITING`

**API Verification**:
- Response array với status=WAITING rooms
- Mỗi room có players count, maxPlayers, host info

---

## W-M06-L2-007 — Leave room: host leaves → room deleted hoặc ownership transferred

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @multiplayer @write @serial

**Setup**:
- test3 creates room
- test4 joins

**Actions**:
1. test3 `DELETE /api/rooms/{id}/leave`

**API Verification**:
- Either:
  - Room deleted → `GET /api/rooms/{id}` → 404
  - Ownership transferred → new hostUserId = test4

**Notes**:
- [NEEDS CODE CHECK]: ownership transfer rules

**Cleanup**:
- DELETE room if still exists

---

## W-M06-L2-008 — Deferred: gameplay flow → Phase 5 WebSocket

**Priority**: —
**Tags**: @deferred @websocket

**Deferred cases**:
- Player ready state sync (WebSocket broadcast)
- Game start signal
- Round-by-round answer submission
- Player elimination (Battle Royale)
- Live leaderboard updates

**Notes**:
- Requires 2+ browser contexts + STOMP client — defer to Phase 5

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 5s |
| L2-002 | 8s |
| L2-003 | 6s |
| L2-004 | 3s |
| L2-005 | 8s |
| L2-006 | 5s |
| L2-007 | 6s |
| **Total** | **~41s** |

---

## Summary
- **7 runnable cases** (4 P0/P1 lobby, 5 deferred)
- **P0**: 3 | **P1**: 4
- **Runtime**: ~41s
- **Deferred**: Gameplay → Phase 5
