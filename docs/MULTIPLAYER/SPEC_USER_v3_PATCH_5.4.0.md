# SPEC_USER_v3 Patch — §5.4.0 Room Lifecycle Rules

> Patch document để update SPEC_USER_v3.md §5.4.0 với 5 lifecycle rules cụ thể.
> Replace: dòng "State: DB entities + Redis (TTL 2 giờ)" hiện tại (line 323) — quá mơ hồ.
> Reason: ROOM_LIFECYCLE_AUDIT_REPORT.md confirmed có 0/5 rules fully implemented; thấy bug live (1 row IN_PROGRESS stuck 3h, 95 ENDED rows >1 day) trong dev DB.

---

## Section §5.4.0 — Tổng quan (REPLACE existing)

```markdown
#### 5.4.0 Tổng quan

- Mã phòng: 6 ký tự auto-generate
- 2–20 người/phòng (tùy mode)
- Host config: mode, số câu, time/câu, difficulty, sách, visibility
- Realtime via WebSocket (STOMP)
- Lifecycle: `LOBBY → IN_PROGRESS → ENDED` hoặc auto-cleanup
- Redis cache: TTL 2 giờ cho question/round state (không phải toàn bộ room metadata)

##### Lifecycle Rules (canonical)

Mỗi rule định nghĩa rõ trigger, action, và side-effects:

| ID | Trigger | Action | Notification | Effort/Side-effect |
|----|---------|--------|--------------|--------------------|
| **R1** | Player cuối rời LOBBY (currentPlayers=0) | **Hard-delete ngay** | Broadcast `ROOM_ENDED` cho any straggler | Đã hoạt động (RoomService.leaveRoom) — cần thêm broadcast |
| **R2** | LOBBY không activity > `ROOM_IDLE_TIMEOUT_MIN` (default 30 phút) | Set status=ENDED → DELETE | Broadcast `ROOM_ENDED` + system chat | Scheduler 10 phút/lần. Activity = join/leave/chat/ready/start. |
| **R3** | Room ENDED > **24 giờ** | Hard-delete | — | Scheduler trong RoomCleanupScheduler. Cho phép user xem lại stats trong 24h. |
| **R4** | Host disconnect (STOMP session close) | Sau **60s grace period**: nếu chưa reconnect → promote member đầu thành host | Broadcast `HOST_CHANGED` event với `newHostId` | Apply khi LOBBY hoặc IN_PROGRESS. Nếu không còn member nào → end room. |
| **R5** | TẤT CẢ player disconnect > 60s trong IN_PROGRESS, hoặc IN_PROGRESS > N giờ không activity | Auto-end → ENDED | Broadcast `ROOM_ENDED` + reason | Bảo vệ stuck IN_PROGRESS từ JVM crash. Scheduler 5 phút/lần. |

##### Battle Royale absence-elimination (R5 specific)

Theo SPEC §5.4.5: Player disconnect > 60s trong Battle Royale → status `ELIMINATED` (không chỉ `LEFT`). Engine tiếp tục round mà không đợi response.

##### Config nguồn

- `ROOM_IDLE_TIMEOUT_MIN` từ `app_config` table (admin có thể chỉnh, default 30)
- `ROOM_ENDED_RETENTION_HOURS` (default 24, cho R3)
- `RECONNECT_GRACE_SECONDS` (default 60, cho R4 và R5)

Tất cả đọc qua `ConfigService` để admin thay đổi không cần redeploy.

##### State diagram

```
   [createRoom]
       │
       ▼
   ┌───────┐                    ┌─────────────┐
   │ LOBBY │──── startRoom ────▶│ IN_PROGRESS │
   └───┬───┘  (host, ≥2 ready)  └──────┬──────┘
       │                                │
       │ R1: empty lobby                │ runQuiz finishes
       │ R2: idle 30 min                │ R5: all DC > 60s
       │ R4: host gone, no successor    │     OR stuck > N hours
       ▼                                ▼
   [DELETE]                         ┌───────┐
                                    │ ENDED │
                                    └───┬───┘
                                        │ R3: > 24h
                                        ▼
                                    [DELETE]
```

CANCELLED enum value bị deprecated (audit G6) — KHÔNG dùng. Tất cả terminal paths đi qua ENDED → DELETE để đơn giản hóa state machine.
```

---

## Migration notes

1. **Drop CANCELLED enum value** trong code:
   - `Room.java:93` xóa `CANCELLED`
   - `RoomService.java:88` đơn giản check `ENDED` only
   
2. **Wire admin config** thay vì hardcoded constants:
   - `RoomService.STALE_LOBBY_HOURS = 1L` → đọc từ `ROOM_IDLE_TIMEOUT_MIN`
   - `RoomCleanupScheduler.ABANDONED_LOBBY_HOURS = 2L` → đọc từ `ROOM_IDLE_TIMEOUT_MIN`
   - 2 constants này phải đồng bộ (audit G8)

3. **WS events new:**
   - `ROOM_ENDED { reason: 'EMPTY_LOBBY' | 'IDLE_TIMEOUT' | 'HOST_GONE' | 'ALL_DISCONNECTED' | 'STUCK_GAME' }`
   - `HOST_CHANGED { newHostId, newHostName }`

4. **Frontend handlers needed:**
   - `RoomLobby.tsx`: handle `ROOM_ENDED` → toast localized message + redirect `/multiplayer`
   - `RoomQuiz.tsx`: handle `ROOM_ENDED` mid-game → save current results, redirect
   - `RoomLobby.tsx`: handle `HOST_CHANGED` → update UI badge, show toast "An đã trở thành host mới"

---

## Checklist apply patch vào SPEC_USER_v3.md

- [ ] Replace §5.4.0 (line 318-323) với content trên
- [ ] Update §5.4.5 Disconnect & Reconnect — cross-ref R4, R5
- [ ] Update §16.3 WebSocket Events — thêm `ROOM_ENDED`, `HOST_CHANGED` schemas
- [ ] Update §17.8 API endpoints — không cần endpoint mới (lifecycle là backend internal)
- [ ] SPEC_ADMIN_v3 §13.2 Config table — confirm `ROOM_IDLE_TIMEOUT_MIN` đã có (line 754); thêm `ROOM_ENDED_RETENTION_HOURS = 24` và `RECONNECT_GRACE_SECONDS = 60`
