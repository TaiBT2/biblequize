# APP-M06 — Multiplayer Lobby (L1 Smoke)

**Screens:** MultiplayerLobbyScreen → CreateRoomScreen / RoomWaitingScreen
**Spec ref:** Multiplayer lobby (WebSocket gameplay deferred)
**Auth required:** Yes

---

## APP-M06-L1-001 — MultiplayerLobbyScreen render đúng với room list

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @multiplayer @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Chơi Cùng"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "multiplayer-lobby-screen"
- assertVisible:
    id: "lobby-create-room-btn"
- assertVisible:
    id: "lobby-rooms-list"
```

**Assertions**:
- MultiplayerLobbyScreen visible
- "Tạo Phòng" / Create Room button visible
- Rooms list section visible (có thể empty)

**Notes**:
- [NEEDS TESTID: multiplayer-lobby-screen] — root SafeScreen wrapper
- [NEEDS TESTID: lobby-create-room-btn] — Button "Tạo Phòng" (CREATE)
- [NEEDS TESTID: lobby-rooms-list] — ScrollView chứa room cards
- Screen polls `/api/rooms` every 15s — test chỉ cần assert initial render

---

## APP-M06-L1-002 — Room list loading state → spinner visible

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @multiplayer

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Chơi Cùng"
- waitForAnimationToEnd
- assertVisible:
    id: "multiplayer-lobby-screen"
```

**Assertions**:
- Loading spinner visible khi đang fetch `/api/rooms`
- Sau khi load: room list hoặc empty state visible

**Notes**:
- Spinner = `ActivityIndicator` với text "Loading rooms..." (text-based assert)
- Empty state: nếu không có room → không cần testID (hardcoded text check)

---

## APP-M06-L1-003 — Tap Create Room → CreateRoomScreen

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @multiplayer

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Chơi Cùng"
- waitForAnimationToEnd:
    timeout: 5000
- tapOn:
    id: "lobby-create-room-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "create-room-screen"
- assertVisible:
    id: "room-name-input"
- assertVisible:
    id: "room-mode-selector"
- assertVisible:
    id: "room-create-submit-btn"
```

**Assertions**:
- Tap Create → navigate to CreateRoomScreen
- Room name input visible
- Game mode selector visible
- Submit button visible

**Notes**:
- [NEEDS TESTID: create-room-screen] — root View CreateRoomScreen
- [NEEDS TESTID: room-name-input] — TextInput tên phòng
- [NEEDS TESTID: room-mode-selector] — mode selector (Speed Race / Battle Royale / Team Battle / Co-op)
- [NEEDS TESTID: room-create-submit-btn] — "Tạo Phòng" submit button

---

## APP-M06-L1-004 — Tạo phòng thành công → vào RoomWaitingScreen

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @smoke @mobile @multiplayer

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Chơi Cùng"
- waitForAnimationToEnd:
    timeout: 5000
- tapOn:
    id: "lobby-create-room-btn"
- waitForAnimationToEnd
- tapOn:
    id: "room-name-input"
- inputText: "E2E Test Room"
- tapOn:
    id: "room-create-submit-btn"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "room-waiting-screen"
- assertVisible:
    id: "room-code-display"
```

**Assertions**:
- Fill room name "E2E Test Room"
- Tap Submit → POST `/api/rooms` → navigate to RoomWaitingScreen
- Room code display visible (5-char code)

**Notes**:
- [NEEDS TESTID: room-waiting-screen] — root View RoomWaitingScreen
- [NEEDS TESTID: room-code-display] — Text hiển thị room code
- [DEFERRED - WEBSOCKET: Real-time player join/leave trong RoomWaitingScreen]

---

## NEEDS TESTID Summary (APP-M06)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Lobby screen | `multiplayer-lobby-screen` | screens/multiplayer/MultiplayerLobbyScreen.tsx |
| Create room btn | `lobby-create-room-btn` | screens/multiplayer/MultiplayerLobbyScreen.tsx |
| Rooms list | `lobby-rooms-list` | screens/multiplayer/MultiplayerLobbyScreen.tsx |
| Create room screen | `create-room-screen` | screens/multiplayer/CreateRoomScreen.tsx |
| Room name input | `room-name-input` | screens/multiplayer/CreateRoomScreen.tsx |
| Mode selector | `room-mode-selector` | screens/multiplayer/CreateRoomScreen.tsx |
| Submit btn | `room-create-submit-btn` | screens/multiplayer/CreateRoomScreen.tsx |
| Waiting screen | `room-waiting-screen` | screens/multiplayer/RoomWaitingScreen.tsx |
| Room code | `room-code-display` | screens/multiplayer/RoomWaitingScreen.tsx |

## DEFERRED Summary

| Feature | Notes |
|---------|-------|
| Multiplayer quiz gameplay | STOMP WebSocket — `apps/mobile/src/ws/` empty, implement riêng |
| Real-time player sync | RoomWaitingScreen player list updates — WebSocket phase |
