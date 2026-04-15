# W-M06 — Multiplayer (Lobby only) (L1 Smoke)

**Routes:** `/rooms`, `/multiplayer`, `/room/create`, `/room/join`, `/room/:id/lobby`
**Spec ref:** SPEC_USER §6
**Note:** Gameplay (`/room/:id/quiz`) — `[DEFERRED - WEBSOCKET PHASE]`

---

### W-M06-L1-001 — Rooms list page render đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @multiplayer

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/multiplayer')`
2. `page.waitForSelector('[data-testid="multiplayer-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/multiplayer')`
- `expect(page.getByTestId('multiplayer-page')).toBeVisible()`
- `expect(page.getByTestId('multiplayer-create-btn')).toBeVisible()`
- `expect(page.getByTestId('multiplayer-join-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: multiplayer-page] — wrapper trang Multiplayer
- [NEEDS TESTID: multiplayer-create-btn] — nút "Tạo Phòng"
- [NEEDS TESTID: multiplayer-join-btn] — nút "Tham Gia Phòng"
- `/rooms` redirect sang `/multiplayer` (backward compat)

---

### W-M06-L1-002 — Navigate to Create Room page

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @multiplayer

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/room/create')`
2. `page.waitForSelector('[data-testid="create-room-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/room/create')`
- `expect(page.getByTestId('create-room-page')).toBeVisible()`
- `expect(page.getByTestId('create-room-mode-select')).toBeVisible()` ← chọn game mode
- `expect(page.getByTestId('create-room-submit-btn')).toBeVisible()`
- `expect(page.getByTestId('create-room-submit-btn')).toBeEnabled()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: create-room-page] — wrapper trang CreateRoom
- [NEEDS TESTID: create-room-mode-select] — selector loại game (CLASSIC, SURVIVAL, etc.)
- [NEEDS TESTID: create-room-submit-btn] — nút "Tạo Phòng"

---

### W-M06-L1-003 — Navigate to Join Room page

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @multiplayer

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/room/join')`
2. `page.waitForSelector('[data-testid="join-room-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/room/join')`
- `expect(page.getByTestId('join-room-page')).toBeVisible()`
- `expect(page.getByTestId('join-room-code-input')).toBeVisible()`
- `expect(page.getByTestId('join-room-submit-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: join-room-page] — wrapper trang JoinRoom
- [NEEDS TESTID: join-room-code-input] — input nhập mã phòng
- [NEEDS TESTID: join-room-submit-btn] — nút "Tham Gia"

---

### W-M06-L1-004 — Join room form: submit empty code → validation error

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @multiplayer

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/room/join')`
2. `page.waitForSelector('[data-testid="join-room-submit-btn"]')`
3. `page.getByTestId('join-room-submit-btn').click()` ← submit với code rỗng

**Assertions**:
- `expect(page).toHaveURL('/room/join')` ← không navigate
- `expect(page.getByTestId('join-room-error')).toBeVisible()` ← error message

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: join-room-error] — error message khi code rỗng hoặc không tìm thấy phòng

---

### W-M06-L1-005 — Room Lobby: room code hiển thị và có thể copy

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @smoke @multiplayer @critical

**Setup**:
- Tạo phòng test qua API: `POST /api/rooms` với body `{mode: "CLASSIC", maxPlayers: 4}` → lấy roomId và roomCode

**Preconditions**:
- Có room đang ở trạng thái WAITING (vừa tạo)

**Actions**:
1. `page.goto('/room/{roomId}/lobby')`
2. `page.waitForSelector('[data-testid="lobby-room-code"]')`

**Assertions**:
- `expect(page.getByTestId('lobby-room-code')).toBeVisible()`
- `expect(page.getByTestId('lobby-room-code')).toHaveText(/[A-Z0-9]{6}/)` ← mã 6 ký tự
- `expect(page.getByTestId('lobby-leave-btn')).toBeVisible()`
- `expect(page.getByTestId('lobby-player-grid')).toBeVisible()`

**Cleanup**:
- `DELETE /api/rooms/{roomId}` hoặc `POST /api/rooms/{roomId}/leave`

**Notes**:
- [NEEDS TESTID: lobby-room-code] — hiển thị mã phòng (6 ký tự)
- [NEEDS TESTID: lobby-leave-btn] — nút "Rời Phòng"
- [NEEDS TESTID: lobby-player-grid] — grid hiển thị players
- [DEFERRED - WEBSOCKET PHASE]: Ready state, host start button, real-time player join/leave

---

### W-M06-L1-006 — Room Lobby: nút "Sẵn Sàng" visible cho non-host

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier1
**Tags**: @smoke @multiplayer

**Setup**:
- Dùng admin tạo room, join bằng test1@dev.local (non-host)

**Preconditions**:
- User không phải host của room

**Actions**:
1. `page.goto('/room/{roomId}/lobby')`
2. `page.waitForSelector('[data-testid="lobby-ready-btn"]')`

**Assertions**:
- `expect(page.getByTestId('lobby-ready-btn')).toBeVisible()`
- `expect(page.getByTestId('lobby-start-btn')).not.toBeVisible()` ← non-host không có Start

**Cleanup**: leave room

**Notes**:
- [NEEDS TESTID: lobby-ready-btn] — nút "Sẵn Sàng" (non-host)
- [NEEDS TESTID: lobby-start-btn] — nút "Bắt Đầu" (host only)
- [DEFERRED - WEBSOCKET PHASE]: Actual ready state sync

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Multiplayer page | `multiplayer-page` | Multiplayer.tsx |
| Create button | `multiplayer-create-btn` | Multiplayer.tsx |
| Join button | `multiplayer-join-btn` | Multiplayer.tsx |
| Create room page | `create-room-page` | CreateRoom.tsx |
| Mode selector | `create-room-mode-select` | CreateRoom.tsx |
| Create submit | `create-room-submit-btn` | CreateRoom.tsx |
| Join room page | `join-room-page` | JoinRoom.tsx |
| Code input | `join-room-code-input` | JoinRoom.tsx |
| Join submit | `join-room-submit-btn` | JoinRoom.tsx |
| Join error | `join-room-error` | JoinRoom.tsx |
| Room code display | `lobby-room-code` | RoomLobby.tsx |
| Leave button | `lobby-leave-btn` | RoomLobby.tsx |
| Player grid | `lobby-player-grid` | RoomLobby.tsx |
| Ready button | `lobby-ready-btn` | RoomLobby.tsx |
| Start button (host) | `lobby-start-btn` | RoomLobby.tsx |

---

## DEFERRED Summary

| Feature | Tag |
|---------|-----|
| Gameplay `/room/:id/quiz` | `[DEFERRED - WEBSOCKET PHASE]` |
| Real-time player join/leave in lobby | `[DEFERRED - WEBSOCKET PHASE]` |
| Ready state sync across browsers | `[DEFERRED - WEBSOCKET PHASE]` |
