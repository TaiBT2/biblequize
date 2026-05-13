# PROMPT: Multiplayer Sprint 1 — Stop the Bleeding

> **Mục tiêu:** Fix 6 bug P0 từ `MULTIPLAYER_AUDIT_REPORT.md` thành **6 separate commits** để rollback an toàn. Đa số là 1-2 line changes hoặc small additions. Không có scope creep — Sprint 2 (cinematic countdown) sẽ làm sau.
>
> **Reference:** `MULTIPLAYER_AUDIT_REPORT.md` — quote line numbers từ đó, nhưng **VERIFY** lại trước khi sửa (line numbers có thể đã shift).

---

## Verification Protocol (BẮT BUỘC trước mỗi task)

Trước khi sửa file nào:

1. **Grep tên function/variable** mà audit nhắc → confirm vẫn tồn tại
2. **Read current state của lines** quanh chỗ sửa (±10 lines context)
3. **Nếu line numbers đã shift** so với audit — adjust, đừng assume
4. **Nếu function đã được refactor** — note lại trong commit message, KHÔNG fabricate fix

Nếu task nào discovery ra fact mới (vd: line đã thay đổi behavior, thêm logic mới) — STOP và confirm với Bui trước khi tiếp tục.

---

## Commit hygiene

- **Mỗi task = 1 commit riêng.** Không gộp.
- Commit message format: `fix(multiplayer): [task title]`
- Sau mỗi commit: STOP, chạy test relevant, báo cáo cho Bui kết quả → đợi confirm trước khi tiếp tục task tiếp theo.
- KHÔNG chạy 6 tasks liên tiếp một lèo.

---

## Task 1 — Fix race condition GAME_STARTING vs ROOM_STARTING 🔴

**Audit ref:** Issue #1 trong Executive Summary, Phase 4 finding line 222–223, Quick Win #3

**Root cause:** Lobby gửi 2 events đồng thời:
- REST `POST /api/rooms/{id}/start` → `runQuiz` (async) broadcasts `GAME_STARTING {countdown:3}`
- STOMP `send('/app/room/{id}/start')` → `RoomWebSocketController` broadcasts `ROOM_STARTING` (no countdown)

Hai events không guarantee thứ tự. Nếu `ROOM_STARTING` về trước → user bị navigate thẳng vào quiz, không thấy countdown.

**Fix:** Xóa STOMP send. REST endpoint đã đủ.

**Files:**
- `apps/web/src/pages/RoomLobby.tsx` ~ line 226–227 (verify trước)

**Steps:**

1. Read RoomLobby.tsx around line 220–235. Tìm `handleStart` function và 2 calls:
   - `await api.post('/rooms/' + roomId + '/start')` (REST)
   - `send('/app/room/' + roomId + '/start', {})` (STOMP)
2. Xóa dòng STOMP send.
3. Cũng cần xác nhận xem có handler nào trong RoomLobby đang listen `ROOM_STARTING` event:
   - Nếu có (audit nói line 158–166) — xóa luôn handler đó vì giờ chỉ dựa vào `GAME_STARTING`
   - Nếu không — bỏ qua
4. Verify `GAME_STARTING` handler (audit line 147–156) vẫn navigate đúng sau countdown.

**Test:**
- Manual: tạo phòng 2 người, host bấm Start → cả 2 thấy countdown 3-2-1 → vào quiz cùng lúc
- Unit test: nếu có `RoomLobby.test.tsx` test cho start flow — chạy lại
- Backend: không cần đụng — REST endpoint đã có

**Commit:** `fix(multiplayer): remove redundant ROOM_STARTING stomp send to fix countdown race`

---

## Task 2 — Broadcast PLAYER_KICKED + PLAYER_LEFT từ REST endpoints 🔴

**Audit ref:** Issue #4, #5 trong Frontend↔Backend table, Phase 6 case #4, Quick Win #4

**Root cause:**
- `RoomController.kickPlayer` (line ~201–219) gọi `RoomService.kickPlayer` nhưng KHÔNG broadcast WS event
- `RoomController.leaveRoom` (line ~172–181) tương tự
- → Người bị kick ngồi trong lobby không biết, người khác không thấy update real-time

**Fix:** Sau khi service call thành công, broadcast event.

**Files:**
- `apps/api/src/main/java/com/biblequiz/api/RoomController.java`
- (Có thể cần) `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java` — check helper method `sendToRoom`

**Steps:**

1. Read `RoomController.java` lines 170–220 — confirm 2 endpoints `/leave` và `/kick`
2. Tìm cách broadcast trong codebase: grep `convertAndSend` hoặc `messagingTemplate` trong package `room` để hiểu pattern hiện tại
3. Inject `SimpMessagingTemplate` (hoặc helper) vào `RoomController` nếu chưa có
4. Trong `kickPlayer` endpoint, sau khi `roomService.kickPlayer(...)` thành công:
   ```java
   messagingTemplate.convertAndSend("/topic/room/" + roomId,
     new WebSocketMessage(MessageTypes.PLAYER_KICKED, Map.of(
       "userId", kickedUserId,
       "kickedBy", hostUserId
     ))
   );
   ```
5. Tương tự cho `leaveRoom` với `PLAYER_LEFT`
6. Verify `MessageTypes.PLAYER_KICKED` và `PLAYER_LEFT` đã tồn tại trong `WebSocketMessage.java` (audit nói có)

**Frontend follow-up (cùng commit hoặc commit riêng — chọn riêng nếu thay đổi nhiều):**

Nếu frontend `RoomLobby.tsx` chưa handle `PLAYER_KICKED` cho **kicked user**:
- Add handler: nếu `data.userId === currentUser.id` → toast "Bạn đã bị host kick" → navigate `/multiplayer`

**Test:**
- Backend: viết test `RoomControllerTest.kickPlayer_shouldBroadcastEvent` (mock messagingTemplate, verify `convertAndSend` được gọi)
- Manual: 3 người trong lobby, host kick 1 người → người bị kick auto-redirect, 2 người còn lại thấy update ngay (không cần fetchRoom polling)

**Commit:** `fix(multiplayer): broadcast PLAYER_KICKED and PLAYER_LEFT from REST endpoints`

---

## Task 3 — Mode-aware defaults trong CreateRoom 🔴

**Audit ref:** Phase 2 finding line 83–94, Quick Win #2

**Root cause:** `CreateRoom.tsx:47–58` set `timePerQuestion: 15` và `maxPlayers: 8` cho TẤT CẢ modes. Mode change handler (line ~151–158) chỉ update `mode` và `questionCount`, không update time/max.

SPEC §5.4 quy định:
| Mode | questionCount | timePerQuestion | maxPlayers |
|---|---|---|---|
| Speed Race | 15 | **30** | **4** |
| Battle Royale | 20 | **20** | 8 |
| Team vs Team | 15 | **30** | 8 |
| Sudden Death | 20 | 15 | 8 |

**Fix:** Mở rộng MODE_DEFAULTS table để cover cả 3 fields, mode change handler set hết.

**Files:**
- `apps/web/src/pages/CreateRoom.tsx`

**Steps:**

1. Find `MODE_QUESTION_DEFAULTS` (audit nói line 19–24). Refactor thành 1 object thống nhất:
   ```typescript
   const MODE_DEFAULTS = {
     SPEED_RACE: { questionCount: 15, timePerQuestion: 30, maxPlayers: 4 },
     BATTLE_ROYALE: { questionCount: 20, timePerQuestion: 20, maxPlayers: 8 },
     TEAM_VS_TEAM: { questionCount: 15, timePerQuestion: 30, maxPlayers: 8 },
     SUDDEN_DEATH: { questionCount: 20, timePerQuestion: 15, maxPlayers: 8 },
   };
   ```
2. Update initial state (line 47–58) dùng defaults từ SPEED_RACE
3. Update mode click handler (line 151–158) set cả 3 fields:
   ```typescript
   onClick={() => {
     const defaults = MODE_DEFAULTS[mode];
     setForm({
       ...form,
       mode,
       questionCount: defaults.questionCount,
       timePerQuestion: defaults.timePerQuestion,
       maxPlayers: defaults.maxPlayers,
     });
   }}
   ```
4. Cẩn thận: nếu user đã edit time/maxPlayers manually rồi đổi mode — fix này sẽ override. Đó là behavior đúng (defaults reset theo mode), nhưng confirm với pattern hiện tại nếu cần.

**Backend bonus check:**
- `RoomController.java:51–53` defaults Speed Race là `4/10/30` (audit). Nếu fix FE rồi, BE defaults vẫn để fallback — OK, không cần đụng.

**Test:**
- Update existing `CreateRoom.test.tsx` — add test "switching mode resets time and maxPlayers to mode defaults"
- Manual: chọn từng mode → confirm time/max đúng SPEC

**Commit:** `fix(multiplayer): mode-aware defaults for time and maxPlayers per SPEC §5.4`

---

## Task 4 — Hide spectate button (route chưa tồn tại) 🔴

**Audit ref:** Issue #1 trong Executive Summary, Phase 6 case #11, Quick Win #1

**Root cause:** `Multiplayer.tsx:266,381` navigate `/room/:id/spectate` nhưng route không tồn tại trong `main.tsx:155–177`. Click → SPA NotFound.

**Fix:** Tạm thời disable/hide button cho đến khi spectate mode được implement (Sprint 3 hoặc defer).

**Files:**
- `apps/web/src/pages/Multiplayer.tsx`

**Steps:**

1. Read lines 250–280 và 370–395 — tìm 2 chỗ render "Xem →" button hoặc click handler navigate spectate
2. **Option A (simpler):** Hide button hoàn toàn khi `room.status === 'IN_PROGRESS'`:
   ```tsx
   {/* Tạm thời ẩn cho đến khi spectate mode được implement (Sprint 3) */}
   {/* {isPlaying && <button>Xem →</button>} */}
   ```
3. **Option B (better UX):** Disable button + tooltip:
   ```tsx
   {isPlaying && (
     <button disabled title="Tính năng xem trận đấu sắp ra mắt" className="opacity-50 cursor-not-allowed">
       Xem →
     </button>
   )}
   ```
4. Chọn Option B nếu không phá layout, Option A nếu phá. Document trong commit message.

**Optional — sau khi disable, có thể xóa luôn handler `onClick={() => navigate('/spectate')}`** để tránh dead code lurking.

**Test:**
- Manual: tạo room, có người đang chơi → click "Đang chơi" card → không bị NotFound
- Update test nếu có

**Commit:** `fix(multiplayer): hide spectate button until route is implemented`

---

## Task 5 — Xóa fake buttons (Lọc + settings cog) 🟡

**Audit ref:** Phase 1 finding line 46, Phase 3 finding line 136, Quick Win #19

**Root cause:**
- `Multiplayer.tsx:569–585` có `<button>Lọc</button>` không có onClick
- `RoomLobby.tsx:389–395` có settings cog không có onClick

User bấm thử → không gì xảy ra → mất tin tưởng.

**Fix:** Xóa cả 2 buttons. Nếu Bui muốn giữ filter UI cho tương lai — comment out với TODO note.

**Files:**
- `apps/web/src/pages/Multiplayer.tsx` ~ line 569–585
- `apps/web/src/pages/RoomLobby.tsx` ~ line 389–395

**Steps:**

1. Read context quanh cả 2 chỗ
2. Multiplayer "Lọc" button:
   - Nếu có `removeFilter` logic và filter state đang được dùng nơi khác → giữ state, chỉ xóa button (commented với TODO)
   - Nếu không dùng đâu cả → xóa luôn cả state + button
3. RoomLobby settings cog:
   - Nếu là decorative thuần → xóa
   - Nếu có ý định dùng cho "edit room settings after create" (Phase 3 finding 162) → comment với `// TODO: implement edit room settings (Sprint 3)`

**Test:**
- Manual: vào Multiplayer page và RoomLobby → không thấy button lừa
- Visual regression: layout không bị vỡ

**Commit:** `chore(multiplayer): remove dead filter button and settings cog`

---

## Task 6 — Render error state ở Multiplayer page 🟡

**Audit ref:** Phase 1 finding line 45, Quick Win #11

**Root cause:** `Multiplayer.tsx:421–427` `useQuery` chỉ destructure `{data, isLoading, refetch, isFetching}`. Nếu API 500, user thấy như "0 phòng" thay vì error.

**Fix:** Add `isError` + `error` rendering.

**Files:**
- `apps/web/src/pages/Multiplayer.tsx`

**Steps:**

1. Read line 420–470 — tìm useQuery + render logic
2. Destructure thêm `isError, error`:
   ```typescript
   const { data, isLoading, isError, error, refetch, isFetching } = useQuery({...});
   ```
3. Add error state UI (tương tự empty state pattern):
   ```tsx
   {isError && (
     <div className="glass rounded-2xl p-6 text-center">
       <div className="text-4xl mb-3">⚠️</div>
       <h3 className="font-bold text-white mb-1">Không thể tải danh sách phòng</h3>
       <p className="text-sm text-gray-400 mb-4">
         Hệ thống đang gặp sự cố. Vui lòng thử lại.
       </p>
       <button onClick={() => refetch()} className="px-4 py-2 rounded-lg gold-grad font-semibold">
         Thử lại
       </button>
     </div>
   )}
   ```
4. Render trước `isLoading` check, hoặc thay thế empty state khi isError true.

**Test:**
- Update `Multiplayer.test.tsx` — add test "renders error state when query fails"
- Manual: tạm thời ngắt BE → reload Multiplayer → thấy error state thay vì "0 phòng"

**Commit:** `feat(multiplayer): render error state when public rooms fetch fails`

---

## Final regression (sau khi 6 tasks DONE)

1. **Backend tests:** `cd apps/api && ./mvnw test` — đảm bảo không có regression. Note baseline test count, expect ≥ baseline.
2. **Frontend tests:** `cd apps/web && npx vitest run` — same.
3. **Manual smoke test (mandatory):**
   - [ ] Tạo phòng Speed Race → confirm time=30s, max=4
   - [ ] Tạo phòng Battle Royale → confirm time=20s, max=8
   - [ ] 2 người join lobby → host bấm Start → cả 2 thấy countdown 3-2-1
   - [ ] Host kick 1 người → người bị kick auto-redirect, người còn lại thấy update ngay
   - [ ] Người chơi tự leave → host thấy update ngay
   - [ ] Reload Multiplayer page với BE down → thấy error state
   - [ ] Click "Đang chơi" room → KHÔNG bị NotFound
4. **Update TODO.md:** Thêm section "Multiplayer Sprint 1 [DONE]" với 6 tasks.

---

## Rules cho Claude Code

1. **Verification-first:** Không fabricate. Read trước khi sửa. Audit line numbers có thể đã shift.
2. **Separate commits:** 6 tasks = 6 commits. Không gộp.
3. **Stop sau mỗi commit:** chạy test, báo cáo, đợi Bui confirm.
4. **Nếu discovery ra issue mới ngoài scope** (vd: tìm thấy bug khác trong khi đọc) — note vào file `MULTIPLAYER_SPRINT1_FINDINGS.md` ở repo root, KHÔNG tự fix.
5. **Nếu fix yêu cầu thay đổi >50 lines** trong 1 file — STOP và hỏi Bui (có thể cần redesign).
6. **Test files:** chạy lại tests liên quan sau mỗi commit. Nếu fail tests pre-existing thì note rõ "không phải regression".
7. **Style:** match existing code style (TypeScript strict, Tailwind hardcoded hex per memory rule, no CSS variables).

---

## Out of scope (KHÔNG làm trong Sprint 1)

Để tránh scope creep, KHÔNG đụng vào trong sprint này (sẽ là Sprint 2/3):

- Cinematic countdown 5s với sound (Sprint 2 — đã có mockup `MOCKUP_GAME_START_CEREMONY.html`)
- Server-authoritative timer (`startedAtMs` trong QuestionStartData) (Sprint 2)
- Tier gating Battle Royale/Sudden Death (Sprint 3)
- 60s reconnect grace UI countdown (Sprint 3)
- Host promote on disconnect (Sprint 3)
- Spectate mode implementation (Sprint 3)
- Atomic addPlayerToRoom race fix (Sprint 3)
- Chat rate-limit error frame (Sprint 3)
- Replace per-event fetchRoom với ROOM_STATE push (Sprint 2)
- Player join chat system messages (Sprint 2)
- Sound effects trong RoomQuiz (Sprint 2)
- Delete dead useWebSocket.ts (defer — chore khi refactor)

Nếu trong lúc sửa, gặp 1 trong các điểm trên cản trở — STOP và confirm với Bui có nên đẩy lên Sprint 1 không.

---

**Bắt đầu bằng Task 1. Stop sau commit. Confirm với Bui trước khi sang Task 2.**
