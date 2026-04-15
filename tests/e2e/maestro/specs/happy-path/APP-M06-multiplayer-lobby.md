# APP-M06 — Multiplayer Lobby (L2 Happy Path)

**Screens:** MultiplayerLobbyScreen → CreateRoomScreen / RoomWaitingScreen
**Spec ref:** SPEC_USER §5.4 (mobile, lobby only)
**Module priority:** Tier 4 (gameplay ⏭️ Phase 5 WebSocket)

---

## ⏭️ Gameplay Deferred

Per Phase 4 scope: multiplayer round flow, answer submission, live sync → **Phase 5 WebSocket**.
L2 covers: create/join/leave rooms + waiting screen display.

---

## APP-M06-L2-001 — GET /api/rooms → lobby list với current rooms

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @multiplayer

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn: "Chơi Cùng"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "multiplayer-lobby-screen"
- assertVisible:
    id: "lobby-rooms-list"
```

**API Verification**:
- `GET /api/rooms` fired (or polled every 15s per code)
- Response array với room cards visible

---

## APP-M06-L2-002 — Create room → POST /api/rooms → navigate to waiting screen

**Priority**: P0
**Est. runtime**: ~15s
**Tags**: @happy-path @mobile @multiplayer @write

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "lobby-create-room-btn"
- waitForAnimationToEnd
- tapOn:
    id: "room-name-input"
- inputText: "E2E Test Room"
- tapOn: "Speed Race"  # select mode
- tapOn:
    id: "room-create-submit-btn"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "room-waiting-screen"
- assertVisible:
    id: "room-code-display"
```

**API Verification**:
- POST `/api/rooms` → 200 with `{ id, code, name, mode, maxPlayers, hostUserId }`
- Host auto-added to players list
- Room code 6 chars

**Cleanup**:
- DELETE room via shell

---

## APP-M06-L2-003 — Join room by code → member added

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @multiplayer @write

**Setup**:
- Another user (or API) creates room với code "M6TEST"

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn:
    id: "lobby-join-room-btn"
- tapOn:
    id: "room-code-input"
- inputText: "M6TEST"
- tapOn:
    id: "room-join-submit-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "room-waiting-screen"
```

**API Verification**:
- POST `/api/rooms/join` → 200
- `GET /api/rooms/{id}` → playerCount 2

---

## APP-M06-L2-004 — Leave room from waiting screen → return to lobby

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @multiplayer @write

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [in RoomWaitingScreen]
- tapOn:
    id: "room-leave-btn"
- assertVisible: "Rời phòng?"
- tapOn: "Rời"
- waitForAnimationToEnd
- assertVisible:
    id: "multiplayer-lobby-screen"
```

**API Verification**:
- DELETE `/api/rooms/{id}/leave` → 200
- If host left: room deleted OR ownership transferred
- User no longer in room's players list

---

## Summary
- **4 cases** (lobby only — gameplay deferred)
- **P0**: 2 | **P1**: 2
- Deferred: Ready state sync, round flow, player join/leave real-time → Phase 5
