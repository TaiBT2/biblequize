# PROMPT: Multiplayer Sprint 4 — Host-Organizer Separation

> **Mục tiêu:** Architectural change để Quản trò (host) **không chơi**, chỉ điều phối. Loại bỏ host advantage trong Group Quiz Set. Match Kahoot pattern.
>
> **Reference:**
> - `MOCKUP_HOST_ORGANIZER_FLOW.html` — mockup approved (3 states × 2 roles = 6 panels)
> - SPEC_USER_v3 §5.4 (Multiplayer Room) — cần cập nhật cuối sprint
> - `ROOM_LIFECYCLE_AUDIT_REPORT.md` (Sprint 2.5 đã done) — R4 host promote logic
>
> **Position trong roadmap:** Sprint 1 + 2.5 + 3 đã DONE. Sprint 4 song song hoặc trước Sprint 2 (cinematic ceremony). Sprint 4 là architectural change → có thể chạy độc lập với Sprint 2.

---

## Decisions đã chốt (trước khi push)

| # | Decision | Value |
|---|---|---|
| 1 | Apply scope | **Tất cả phòng multiplayer** (Q1 Option A) |
| 2 | Min players | **2 players** không tính host (Q2) |
| 3 | Host UI mode | **Spectator view** với 4 controls (Q3 Option A); TV mode defer v1.5 |
| 4 | Host controls | Pause + Skip + Broadcast + End early (Q4) |
| 5 | Tournament | **Giữ nguyên** organizer vẫn chơi (Q5) |
| 6 | Tên gọi tiếng Việt | **"Quản trò"** thay vì "Host" trong UI |
| 7 | Migration data cũ | Giữ nguyên rooms cũ; Sprint 4 chỉ apply rooms mới |
| 8 | Promote không muốn | Defer Sprint 5 |
| 9 | Host thấy đáp án | Có (như mockup); TV mode v1.5 sẽ có option ẩn |
| 10 | "Tổ chức trận mới" | Navigate CreateRoom pre-filled, không cần endpoint mới |

---

## Verification Protocol (BẮT BUỘC trước mỗi task)

1. **Read trước khi sửa** — code có thể đã thay đổi sau Sprint 1, 2.5, 3
2. **Quote line numbers** trong commit message
3. **Sprint 2.5 R4 logic (host promote on disconnect) đã có** — Sprint 4 phải compatible với nó
4. **Tests pre-existing fail** — KHÔNG treat là blocker
5. **Migration safety:** add backward compat field thay vì breaking changes

---

## Commit hygiene

- **Mỗi task = 1 commit riêng.** Format: `feat(host-organizer):` hoặc `refactor(host-organizer):`
- Sau mỗi commit: STOP, chạy test, báo cáo, đợi Bui confirm
- KHÔNG chạy 10 tasks liên tiếp một lèo

---

## Constraint rules (embed cho mọi task)

### Naming convention (CRITICAL)
- **Code/internal:** giữ `host` (đã có throughout codebase)
- **UI text tiếng Việt:** **"Quản trò"** thay "Host"
- **UI text English:** **"Game Host"** hoặc "Quizmaster" (không phải just "Host")
- i18n key: `room.host.organizer` → "Quản trò" / "Game Host"

### Font + design rules (rút từ mockup)
- Be Vietnam Pro 800/900 cho headings tiếng Việt ("Cảm ơn Quản trò!", "Hạng 1!")
- Sora chỉ cho số (timer, score, points)
- Hardcoded hex colors (`#e8a832 / #11131e`), không CSS variables
- SVG medals thay emoji 🥈🥉

### Backward compatibility
- Rooms cũ với `host_plays_game = true` (default) vẫn hoạt động như cũ
- Rooms mới mặc định `host_plays_game = false` (Sprint 4 default)
- KHÔNG drop column / breaking schema changes — additive only

---

## Phase 1: Backend Foundation (4 tasks, ~1.5 days)

---

### Task S4-1 — DB migration + Room entity field 🟡

**Goal:** Add `host_plays_game` field cho backward compat với rooms cũ.

**Files:**
- `apps/api/src/main/resources/db/migration/V{next}__add_host_plays_game.sql` (new)
- `apps/api/src/main/java/com/biblequiz/modules/room/entity/Room.java`

**Steps:**

1. **Tìm next migration version:**
   ```bash
   ls apps/api/src/main/resources/db/migration/ | tail -5
   ```

2. **Migration:**
   ```sql
   -- V{N}__add_host_plays_game.sql
   ALTER TABLE rooms 
   ADD COLUMN host_plays_game BOOLEAN NOT NULL DEFAULT TRUE;
   
   -- Existing rooms: host_plays_game=TRUE (giữ behavior cũ)
   -- New rooms (Sprint 4+) sẽ set FALSE
   COMMENT ON COLUMN rooms.host_plays_game IS 
     'TRUE = legacy mode (host plays); FALSE = Quản trò mode (Sprint 4+)';
   ```

3. **Room.java entity:**
   ```java
   @Column(name = "host_plays_game", nullable = false)
   private boolean hostPlaysGame = true; // default true cho legacy
   
   public boolean isHostPlaysGame() { return hostPlaysGame; }
   public void setHostPlaysGame(boolean hostPlaysGame) { this.hostPlaysGame = hostPlaysGame; }
   ```

4. **Tests:** RoomEntityTest verify default value, MigrationTest verify column exists.

**Test:**
- Backend test pass
- DB inspection: `SELECT host_plays_game, COUNT(*) FROM rooms GROUP BY host_plays_game;` — tất cả existing rows = TRUE

**Commit:** `feat(host-organizer): DB migration + Room.hostPlaysGame field`

---

### Task S4-2 — RoomService.createRoom default Quản trò mode 🔴

**Goal:** Rooms mới mặc định `hostPlaysGame=false`. Add validation logic.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` (~line 39-74 createRoom)
- `apps/api/src/main/java/com/biblequiz/api/RoomController.java` (~line 39-80 POST /api/rooms)
- `apps/api/src/main/java/com/biblequiz/modules/room/dto/CreateRoomRequest.java` (verify hoặc add)

**Steps:**

1. **CreateRoomRequest** — add optional field:
   ```java
   private Boolean hostPlaysGame; // null = use default (false for new rooms)
   ```

2. **RoomService.createRoom:**
   ```java
   public Room createRoom(CreateRoomRequest req, User host) {
     Room room = new Room();
     // ... existing fields
     // NEW: default false (Sprint 4+), allow override only for testing/legacy
     room.setHostPlaysGame(req.getHostPlaysGame() != null ? req.getHostPlaysGame() : false);
     // ... existing logic
     
     // NEW: chỉ add host as RoomPlayer nếu hostPlaysGame
     if (room.isHostPlaysGame()) {
       addPlayerToRoom(roomId, host);
     }
     // else: host không phải RoomPlayer, chỉ ở Room.host FK
     
     return room;
   }
   ```

3. **Verify joinRoom:** check user không phải host trước khi addPlayer (tránh edge case host nhấn join lại). Quote line 79-139:
   ```java
   // NEW guard:
   if (room.getHost().getId().equals(user.getId()) && !room.isHostPlaysGame()) {
     // Host không cần "join" — họ đã là Quản trò
     return room;
   }
   ```

4. **Tests:** 
   - createRoom default → hostPlaysGame=false, host không là RoomPlayer
   - createRoom với hostPlaysGame=true → behavior cũ
   - joinRoom by host trong Quản trò mode → no-op (không tạo RoomPlayer duplicate)

**Test:**
- Manual: tạo room mới → DB row có `host_plays_game=FALSE`, không có RoomPlayer cho host
- Manual: join room với hostPlaysGame=true → behavior cũ

**Commit:** `feat(host-organizer): default hostPlaysGame=false for new rooms (Sprint 4+)`

---

### Task S4-3 — RoomService.startRoom validation min 2 players (excluding host) 🔴

**Goal:** Validate min players KHÔNG TÍNH host khi `hostPlaysGame=false`.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` (~line 328-360 startRoom)
- `apps/api/src/main/java/com/biblequiz/modules/room/repository/RoomPlayerRepository.java`

**Steps:**

1. **RoomPlayerRepository:**
   ```java
   long countByRoomIdAndUserIdNot(String roomId, String userId);
   ```

2. **RoomService.startRoom:**
   ```java
   public void startRoom(String roomId, String hostUserId) {
     Room room = findById(roomId);
     // ... existing checks (host-only, status check)
     
     long playerCount;
     if (room.isHostPlaysGame()) {
       playerCount = room.getCurrentPlayers(); // includes host
     } else {
       // Quản trò mode: count players KHÔNG TÍNH host
       playerCount = roomPlayerRepository.countByRoomIdAndUserIdNot(roomId, hostUserId);
     }
     
     if (playerCount < 2) {
       throw new BadRequestException(
         room.isHostPlaysGame() 
           ? "Cần ít nhất 2 người chơi"
           : "Cần ít nhất 2 người chơi (không tính Quản trò)"
       );
     }
     
     // Validate all non-host players ready
     // ... existing ready check, but exclude host
   }
   ```

3. **Update ready check:** trong Quản trò mode, host không có ready toggle → exclude từ "all ready" validation.

4. **Tests:**
   - startRoom Quản trò mode với 2 players ready → success
   - startRoom Quản trò mode với 1 player → BadRequest
   - startRoom legacy mode với 2 players (1 host + 1 player) → success (giữ behavior cũ)
   - startRoom Quản trò mode với 2 players nhưng 1 chưa ready → BadRequest

**Test:**
- Backend test pass
- Manual: tạo room Quản trò mode, mời 1 người, bấm Start → error "Cần ít nhất 2 người chơi (không tính Quản trò)"

**Commit:** `feat(host-organizer): startRoom validation min 2 players excluding host`

---

### Task S4-4 — RoomQuizService skip host in gameplay 🔴

**Goal:** Khi Quản trò mode, host không nhận câu hỏi để trả lời, không tính score, không vào ranking.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomQuizService.java` (~line 60-489)
- `apps/api/src/main/java/com/biblequiz/modules/room/service/ScoringService.java` (verify exists)

**Steps:**

1. **Helper method trong RoomQuizService:**
   ```java
   private List<RoomPlayer> getActivePlayers(Room room) {
     List<RoomPlayer> all = roomPlayerRepository.findByRoomIdAndStatus(
       room.getId(), PlayerStatus.ACTIVE);
     if (room.isHostPlaysGame()) {
       return all;
     }
     // Quản trò mode: exclude host
     return all.stream()
       .filter(rp -> !rp.getUser().getId().equals(room.getHost().getId()))
       .toList();
   }
   ```

2. **Replace tất cả `roomPlayerRepository.findByRoomIdAndStatus(...)` calls** trong runQuiz, scoring, ranking với `getActivePlayers(room)`.

3. **Verify per-mode logic:**
   - **Speed Race:** scoring chỉ tính players, ranking chỉ players
   - **Battle Royale:** elimination check chỉ players (host không bị eliminate)
   - **Team vs Team:** team assignment skip host
   - **Sudden Death:** champion/challenger queue skip host

4. **WS broadcast adjustment:**
   - `QUESTION_START` event vẫn broadcast `/topic/room/{roomId}` (host nhận để hiển thị spectator view)
   - `ANSWER_SUBMIT` chỉ accept từ players (reject host)
   - `ROUND_END` payload có `rankings[]` chỉ players

5. **Reject host answer:**
   ```java
   public void submitAnswer(String roomId, String userId, AnswerRequest req) {
     Room room = findById(roomId);
     if (!room.isHostPlaysGame() && room.getHost().getId().equals(userId)) {
       throw new BadRequestException("Quản trò không trả lời câu hỏi");
     }
     // ... existing logic
   }
   ```

6. **Tests** — mỗi mode 1 test:
   - Speed Race Quản trò mode: 3 players + host → ranking 3 entries (no host)
   - Battle Royale Quản trò mode: host KHÔNG bị eliminate dù không trả lời
   - submitAnswer by host → BadRequest

**Test:**
- Backend test pass
- Manual: tạo room Quản trò 3 players, chạy game → host thấy câu hỏi nhưng không submit được, ranking cuối có 3 entries

**Commit:** `feat(host-organizer): RoomQuizService skip host in scoring + ranking`

---

## Phase 2: Backend Host Controls (1 task, ~0.5 day)

---

### Task S4-5 — Host control endpoints (Pause / Skip / Broadcast / End) 🟡

**Goal:** 4 endpoints mới cho Quản trò controls.

**Files:**
- `apps/api/src/main/java/com/biblequiz/api/RoomController.java` — add 4 endpoints
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomQuizService.java` — implement logic
- `apps/api/src/main/java/com/biblequiz/api/websocket/WebSocketMessage.java` — add event types
- `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java` — broadcast helpers

**Steps:**

1. **WebSocket events new:**
   ```java
   public static final String GAME_PAUSED = "GAME_PAUSED";
   public static final String GAME_RESUMED = "GAME_RESUMED";
   public static final String QUESTION_SKIPPED = "QUESTION_SKIPPED";
   public static final String HOST_BROADCAST = "HOST_BROADCAST";
   ```

2. **Endpoints:**
   ```java
   @PostMapping("/{id}/host/pause")
   public ResponseEntity<Void> pauseGame(@PathVariable String id, @AuthenticationPrincipal User user) {
     roomQuizService.pauseGame(id, user.getId());
     return ResponseEntity.ok().build();
   }
   
   @PostMapping("/{id}/host/resume")
   public ResponseEntity<Void> resumeGame(@PathVariable String id, @AuthenticationPrincipal User user) { ... }
   
   @PostMapping("/{id}/host/skip-question")
   public ResponseEntity<Void> skipQuestion(@PathVariable String id, @AuthenticationPrincipal User user) { ... }
   
   @PostMapping("/{id}/host/broadcast")
   public ResponseEntity<Void> broadcastMessage(
       @PathVariable String id, 
       @RequestBody Map<String, String> body,
       @AuthenticationPrincipal User user) {
     String message = body.get("message");
     if (message == null || message.length() > 200) {
       throw new BadRequestException("Tin nhắn tối đa 200 ký tự");
     }
     roomQuizService.broadcastHostMessage(id, user.getId(), message);
     return ResponseEntity.ok().build();
   }
   
   @PostMapping("/{id}/host/end-early")
   public ResponseEntity<Void> endGameEarly(@PathVariable String id, @AuthenticationPrincipal User user) { ... }
   ```

3. **Pause/Resume logic** — tricky vì runQuiz đang Thread.sleep:
   ```java
   // Trong RoomQuizService:
   private final Map<String, CountDownLatch> pauseLatches = new ConcurrentHashMap<>();
   
   public void pauseGame(String roomId, String hostUserId) {
     Room room = validateHostAction(roomId, hostUserId);
     pauseLatches.put(roomId, new CountDownLatch(1));
     webSocketController.broadcastGamePaused(roomId);
   }
   
   public void resumeGame(String roomId, String hostUserId) {
     Room room = validateHostAction(roomId, hostUserId);
     CountDownLatch latch = pauseLatches.remove(roomId);
     if (latch != null) latch.countDown();
     webSocketController.broadcastGameResumed(roomId);
   }
   
   // Trong runQuiz, giữa mỗi câu:
   private void waitIfPaused(String roomId) {
     CountDownLatch latch = pauseLatches.get(roomId);
     if (latch != null) {
       try {
         latch.await(5, TimeUnit.MINUTES); // max 5 min pause
       } catch (InterruptedException e) {
         Thread.currentThread().interrupt();
       }
     }
   }
   ```

4. **Skip question logic:** set flag, runQuiz check flag → skip current question, move next:
   ```java
   private final Set<String> skipFlags = ConcurrentHashMap.newKeySet();
   
   public void skipQuestion(String roomId, String hostUserId) {
     Room room = validateHostAction(roomId, hostUserId);
     skipFlags.add(roomId);
     webSocketController.broadcastQuestionSkipped(roomId);
   }
   ```

5. **Broadcast message:**
   ```java
   public void broadcastHostMessage(String roomId, String hostUserId, String message) {
     Room room = validateHostAction(roomId, hostUserId);
     HostBroadcastData data = new HostBroadcastData();
     data.setHostId(hostUserId);
     data.setMessage(message);
     data.setTimestamp(Instant.now());
     messagingTemplate.convertAndSend("/topic/room/" + roomId,
       new WebSocketMessage(MessageTypes.HOST_BROADCAST, data));
   }
   ```

6. **End early:** delegate to existing `roomService.endRoom(roomId)` + broadcast `ROOM_ENDED { reason: 'HOST_ENDED_EARLY' }`.

7. **`validateHostAction` helper:** check user là host AND `hostPlaysGame=false`.

8. **Tests:** mỗi endpoint 1 test, plus integration test pause+resume cycle.

**Test:**
- Backend test pass
- Manual: host bấm Pause → players thấy overlay "Quản trò đã tạm dừng"; bấm Resume → countdown 3-2-1 → tiếp tục

**Commit:** `feat(host-organizer): host control endpoints (pause/resume/skip/broadcast/end-early)`

---

## Phase 3: Frontend Lobby (2 tasks, ~1 day)

---

### Task S4-6 — RoomLobby differentiation (host vs player view) 🔴

**Goal:** Cùng 1 page `/room/:id/lobby` nhưng UI khác nhau dựa vào `isHost && !room.hostPlaysGame`.

**Files:**
- `apps/web/src/pages/RoomLobby.tsx` — major refactor
- `apps/web/src/api/types.ts` — add `hostPlaysGame: boolean` vào Room type
- `apps/web/src/i18n/vi.json`, `en.json` — strings mới
- `apps/web/src/pages/__tests__/RoomLobby.test.tsx`

**Steps:**

1. **Type updates:**
   ```typescript
   interface Room {
     // existing fields
     hostPlaysGame: boolean;
     hostId: string;
     hostName: string;
   }
   ```

2. **Conditional rendering trong RoomLobby:**
   ```typescript
   const isHost = room?.hostId === currentUser.id;
   const isOrganizerMode = isHost && !room?.hostPlaysGame;
   
   // Header role badge
   {isOrganizerMode && (
     <div className="bg-[#e8a832]/15 border border-[#e8a832]/30 ...">
       <span>👑</span><span>Bạn là Quản trò</span>
     </div>
   )}
   
   // Player list — show all RoomPlayers (host KHÔNG có ở đây trong organizer mode)
   // Add separate "Quản trò" card cho host info
   {!room.hostPlaysGame && (
     <HostInfoCard host={{ id: room.hostId, name: room.hostName }} />
   )}
   
   // Bottom CTA
   {isOrganizerMode ? (
     <button onClick={handleStart} disabled={!canStart}>
       BẮT ĐẦU TRẬN ĐẤU
     </button>
   ) : isHost ? (
     // Legacy host (hostPlaysGame=true) — both ready toggle AND start button
     <>
       <ReadyButton ... />
       <StartButton ... />
     </>
   ) : (
     <ReadyButton ... />
   )}
   ```

3. **Match mockup state ① cho host view** từ `MOCKUP_HOST_ORGANIZER_FLOW.html`:
   - Hero card với "bạn là Quản trò"
   - Info card "Bạn điều phối trận đấu, không trả lời câu hỏi để đảm bảo công bằng"
   - Player list with kick buttons (mỗi player có nút kick)
   - Player count: "X / max" + "Y / X sẵn sàng"
   - Bottom: invite buttons (copy / link / QR) + "BẮT ĐẦU TRẬN ĐẤU" button
   - Disabled hint: "⏳ Đợi {name} sẵn sàng (cần ≥2 player)"

4. **Match mockup state ① cho player view:**
   - Compact hero with "Quản trò: {hostName} 👑"
   - HostInfoCard separate ("👑 Quản trò" + name + "Không chơi")
   - Player list (highlight self with "(BẠN)")
   - Bottom: "✓ ĐÃ SẴN SÀNG" / "Sẵn sàng" toggle + hint "Quản trò sẽ bắt đầu khi tất cả sẵn sàng"

5. **i18n:**
   ```json
   "room.organizerBadge": "Bạn là Quản trò",
   "room.organizerHelp": "Bạn điều phối trận đấu, không trả lời câu hỏi để đảm bảo công bằng cho người chơi.",
   "room.startMatch": "BẮT ĐẦU TRẬN ĐẤU",
   "room.waitingForReady": "⏳ Đợi {{name}} sẵn sàng",
   "room.minPlayersHint": "Cần ≥2 người chơi",
   "room.hostLabel": "Quản trò",
   "room.hostNotPlaying": "Không chơi",
   "room.waitingHostStart": "Quản trò sẽ bắt đầu khi tất cả sẵn sàng"
   ```
   English equivalent.

6. **Tests:**
   - Render organizer view khi isHost && !hostPlaysGame
   - Render player view khi !isHost
   - Render legacy host view khi isHost && hostPlaysGame
   - Start button disabled khi <2 players ready

**Test:**
- Manual: tạo room mới → vào lobby thấy organizer view; share link → user khác vào thấy player view với host card riêng

**Commit:** `feat(host-organizer): RoomLobby differentiation by role`

---

### Task S4-7 — CreateRoom UX update + invite-focused flow 🟡

**Goal:** CreateRoom hiện rõ user sẽ là Quản trò, không phải player. Sau khi tạo phòng, focus vào invite flow.

**Files:**
- `apps/web/src/pages/CreateRoom.tsx`
- i18n strings

**Steps:**

1. **CreateRoom hint banner:**
   ```tsx
   <div className="rounded-xl p-3 border border-[#e8a832]/30 bg-[#e8a832]/5 mb-4">
     <div className="flex items-start gap-3">
       <span className="text-xl">👑</span>
       <div>
         <div className="text-sm font-semibold text-[#e8a832] mb-1">
           Bạn sẽ là Quản trò
         </div>
         <div className="text-xs text-gray-300">
           Quản trò điều phối trận đấu (bắt đầu, tạm dừng, bỏ câu, nhắn). 
           Bạn không trả lời câu hỏi để đảm bảo công bằng cho người chơi.
         </div>
       </div>
     </div>
   </div>
   ```

2. **Submit button text** — đổi từ "Tạo phòng" thành "Tạo phòng & bắt đầu điều phối"

3. **After-create redirect** — vẫn navigate `/room/{id}/lobby` (lobby tự render organizer view per Task S4-6).

4. **Tests:** verify banner render, button text correct.

**Test:**
- Manual: vào CreateRoom → thấy banner "Bạn sẽ là Quản trò" rõ ràng

**Commit:** `feat(host-organizer): CreateRoom hint banner about Quản trò role`

---

## Phase 4: Frontend Quiz Gameplay (2 tasks, ~1.5 days)

---

### Task S4-8 — RoomQuizHost component (spectator view + 4 controls) 🔴

**Goal:** Tách hẳn host quiz view khỏi player quiz view. Match mockup state ② host panel.

**Files:**
- `apps/web/src/pages/room/RoomQuizHost.tsx` (NEW)
- `apps/web/src/components/multiplayer/HostControls.tsx` (NEW)
- `apps/web/src/components/multiplayer/LiveAnswerStatus.tsx` (NEW)
- `apps/web/src/main.tsx` — add route `/room/:id/host`
- `apps/web/src/pages/RoomLobby.tsx` — navigate dựa vào role khi GAME_STARTING

**Steps:**

1. **Route logic:**
   ```typescript
   // Trong RoomLobby on GAME_STARTING:
   if (room.host.id === currentUser.id && !room.hostPlaysGame) {
     navigate(`/room/${roomId}/host`);
   } else {
     navigate(`/room/${roomId}/quiz`); // existing player view
   }
   ```

2. **RoomQuizHost.tsx structure** — match mockup state ② host panel:
   - **Header (compact):** "👑 Quản trò" badge + "Câu X/Y" + timer
   - **Question display section:**
     - 📖 scriptureRef
     - Question text (smaller than player view, since host doesn't need to focus)
     - Options grid 2×2 với **đáp án đúng highlighted ngay** (mockup decision #3)
   - **Live Answer Status section:**
     - "X/Y đã trả lời" counter
     - Per-player row: avatar + name + status:
       - "✓ ĐÚNG · 2.4s" (emerald)
       - "✗ SAI · 3.1s" (red)
       - "Đang chọn..." với spinner (yellow)
   - **Live Scoreboard:** compact ranking real-time
   - **Bottom: HostControls panel (4 buttons grid)**

3. **HostControls.tsx component:**
   ```typescript
   interface Props {
     roomId: string;
     isPaused: boolean;
     onPause: () => void;
     onResume: () => void;
     onSkip: () => void;
     onBroadcast: (msg: string) => void;
     onEnd: () => void;
   }
   
   export function HostControls({ ... }: Props) {
     const [showBroadcastModal, setShowBroadcastModal] = useState(false);
     const [showEndConfirm, setShowEndConfirm] = useState(false);
     
     return (
       <div className="grid grid-cols-4 gap-1.5">
         <button onClick={isPaused ? onResume : onPause} className="...">
           {isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng'}
         </button>
         <button onClick={onSkip} className="...">⏭️ Bỏ câu</button>
         <button onClick={() => setShowBroadcastModal(true)} className="...">💬 Nhắn</button>
         <button onClick={() => setShowEndConfirm(true)} className="...">🛑 Kết thúc</button>
         
         {showBroadcastModal && <BroadcastModal onSend={msg => { onBroadcast(msg); setShowBroadcastModal(false); }} onCancel={...} />}
         {showEndConfirm && <ConfirmModal title="Kết thúc trận đấu sớm?" onConfirm={...} onCancel={...} />}
       </div>
     );
   }
   ```

4. **LiveAnswerStatus.tsx component** — listen WS events `ANSWER_SUBMITTED`, render real-time list.

5. **WS events handlers trong RoomQuizHost:**
   - `QUESTION_START` → show new question + reset answer status
   - `ANSWER_SUBMITTED` (per player) → update LiveAnswerStatus
   - `ROUND_END` → show stats + auto-advance
   - `GAME_PAUSED`, `GAME_RESUMED` → update local pause state
   - `QUESTION_SKIPPED` → toast "Đã bỏ câu này"

6. **Pause overlay cho cả host và player** — full-screen overlay khi pause:
   ```tsx
   {isPaused && (
     <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
       <div className="text-center">
         <div className="text-6xl mb-3">⏸️</div>
         <div className="font-vn-display font-bold text-2xl text-white mb-2">Trận đấu đã tạm dừng</div>
         <div className="text-sm text-gray-400">{isHost ? "Bấm tiếp tục khi sẵn sàng" : "Quản trò sẽ tiếp tục trong giây lát"}</div>
       </div>
     </div>
   )}
   ```

7. **Broadcast banner cho player** — khi nhận `HOST_BROADCAST` event:
   ```tsx
   // Trong RoomQuizPlayer (player view):
   {hostBroadcast && (
     <div className="absolute top-16 left-4 right-4 z-40 fade-in">
       <div className="rounded-xl p-3 bg-[#e8a832]/15 border border-[#e8a832]/40 backdrop-blur">
         <div className="flex items-start gap-2">
           <span className="text-base">👑</span>
           <div>
             <div className="text-[10px] font-bold text-[#e8a832] uppercase">Quản trò</div>
             <div className="text-sm text-white">{hostBroadcast.message}</div>
           </div>
         </div>
       </div>
     </div>
   )}
   ```
   Auto-dismiss 5s.

8. **Tests:**
   - RoomQuizHost render với mock data
   - HostControls click handlers fire correct callbacks
   - LiveAnswerStatus updates on WS events
   - Pause overlay shows/hides

**Test:**
- Manual full flow: tạo room Quản trò 3 players → start → host vào RoomQuizHost với 4 controls, thấy đáp án đúng ngay; players vào RoomQuizPlayer như thường

**Commit:** `feat(host-organizer): RoomQuizHost component with spectator view + 4 controls`

---

### Task S4-9 — RoomQuizPlayer adjustments (no host in scoreboard) 🟡

**Goal:** Player view tự động không hiện host trong scoreboard/rankings.

**Files:**
- `apps/web/src/pages/room/RoomQuiz.tsx` → rename `RoomQuizPlayer.tsx` (hoặc giữ tên)
- `apps/web/src/components/multiplayer/Scoreboard.tsx`

**Steps:**

1. **Filter logic** — tất cả `players` array bỏ host khi `!hostPlaysGame`:
   ```typescript
   const visiblePlayers = useMemo(() => {
     if (room.hostPlaysGame) return players;
     return players.filter(p => p.id !== room.hostId);
   }, [players, room]);
   ```

2. **Hint pinned bottom** — match mockup state ② player:
   ```tsx
   {!room.hostPlaysGame && (
     <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
       <div className="glass rounded-full px-3 py-1 flex items-center gap-1.5">
         <span className="text-xs">👑</span>
         <span className="text-[10px] text-gray-400">
           Quản trò {room.hostName} đang theo dõi
         </span>
       </div>
     </div>
   )}
   ```

3. **Listen `HOST_BROADCAST`** event → show banner 5s.

4. **Listen `GAME_PAUSED`/`GAME_RESUMED`** → toggle pause overlay.

5. **Listen `QUESTION_SKIPPED`** → toast "Câu này đã được bỏ qua".

6. **Tests:** scoreboard không có host trong Quản trò mode; legacy mode thì có.

**Test:**
- Manual: 3 players + Quản trò → scoreboard chỉ 3 entries, không có host

**Commit:** `feat(host-organizer): RoomQuizPlayer hides host from scoreboard + listens host events`

---

## Phase 5: Frontend End Screen (1 task, ~0.5 day)

---

### Task S4-10 — QuizEndHost component (organizer wrap-up) 🟡

**Goal:** End screen riêng cho Quản trò — match mockup state ③ host panel.

**Files:**
- `apps/web/src/components/multiplayer/QuizEndHost.tsx` (NEW)
- `apps/web/src/pages/room/RoomQuizHost.tsx` — render end screen khi GAME_END
- `apps/web/src/components/multiplayer/QuizEndPlayer.tsx` (existing, từ Sprint 2 nếu đã merge)

**Steps:**

1. **QuizEndHost.tsx** match mockup state ③ host:
   - Title: "🎉 Cảm ơn Quản trò!" (Be Vietnam Pro 900, gold gradient)
   - Winner card với crown + winner avatar + score
   - Match stats grid 2×2: Tổng câu hỏi · Thời lượng · Người chơi · Tỷ lệ đúng TB
   - Compact rankings list tất cả players
   - Bottom actions:
     - "🔄 Tổ chức trận mới với cùng nhóm" (gold gradient primary) — navigate CreateRoom với pre-fill
     - "📊 Phân tích" — navigate `/room/{id}/analytics` (defer Sprint 5 nếu chưa có)
     - "📤 Xuất CSV" — call existing export endpoint nếu có
     - "🚪 Đóng" — navigate `/multiplayer`

2. **Pre-fill CreateRoom** — khi click "Tổ chức trận mới":
   ```typescript
   onReplayWithSamePlayers={() => {
     navigate('/multiplayer/create', {
       state: {
         prefill: {
           mode: room.mode,
           questionCount: room.questionCount,
           timePerQuestion: room.timePerQuestion,
           difficulty: room.difficulty,
           bookScope: room.bookScope,
           questionSetId: room.questionSetId,
           invitePlayerIds: visiblePlayers.map(p => p.id), // for invite shortcut
         }
       }
     });
   }}
   ```
   `CreateRoom.tsx` đọc `location.state.prefill` và pre-fill form.

3. **i18n strings:**
   ```json
   "room.thankYouHost": "Cảm ơn Quản trò!",
   "room.gameEnded": "Trận đấu kết thúc",
   "room.matchStats": "Thống kê trận đấu",
   "room.totalQuestions": "Tổng câu hỏi",
   "room.duration": "Thời lượng",
   "room.players": "Người chơi",
   "room.avgAccuracy": "Tỷ lệ đúng TB",
   "room.replayWithSameGroup": "Tổ chức trận mới với cùng nhóm",
   "room.analytics": "Phân tích",
   "room.exportCsv": "Xuất CSV"
   ```

4. **Tests:** render với mock data, click handlers fire navigation.

**Test:**
- Manual: end game → host thấy "Cảm ơn Quản trò!", click "Tổ chức trận mới" → CreateRoom mở với form đã pre-fill

**Commit:** `feat(host-organizer): QuizEndHost organizer wrap-up screen`

---

## Phase 6: SPEC update (Bonus — 1 commit)

---

### Task S4-DOCS — Update SPEC_USER_v3.md §5.4

**Goal:** Document architectural change.

**Files:**
- `SPEC_USER_v3.md` §5.4

**Changes:**

1. **§5.4.0 — Tổng quan** — thêm sub-section:
   ```markdown
   ##### Host Role (Sprint 4+)
   
   Mặc định cho rooms tạo sau Sprint 4: **host không tham gia chơi** (Quản trò mode).
   
   - Quản trò điều phối: tạo phòng, mời player, bắt đầu, pause/skip/broadcast/end
   - Quản trò KHÔNG trả lời câu hỏi, KHÔNG có ranking
   - Min players = 2 (không tính Quản trò) → tổng người trong phòng ≥3
   - Field DB: `Room.hostPlaysGame` (default false cho rooms mới)
   - Legacy rooms (trước Sprint 4) giữ behavior cũ với `hostPlaysGame=true`
   
   **Lý do thiết kế:**
   - Loại bỏ host advantage (đặc biệt khi dùng Group Quiz Set tự tạo)
   - Match Kahoot pattern (mục sư đã quen)
   - Phù hợp văn hóa hội thánh Việt — vai trò "người dẫn"
   - Setup TV Host Mode v1.5
   ```

2. **§5.4 thêm sub-section "Host Controls":**
   ```markdown
   #### 5.4.7 Host Controls (Quản trò)
   
   Quản trò có 4 controls trong khi game chạy:
   
   | Control | Action | WS Event |
   |---|---|---|
   | ⏸️ Tạm dừng | Freeze timer + overlay cho tất cả player | GAME_PAUSED |
   | ⏭️ Bỏ câu | Skip current question, không tính điểm | QUESTION_SKIPPED |
   | 💬 Nhắn cả phòng | Broadcast message 5s lên màn hình | HOST_BROADCAST |
   | 🛑 Kết thúc sớm | End game ngay với rankings hiện tại | ROOM_ENDED reason=HOST_ENDED_EARLY |
   
   API endpoints:
   - `POST /api/rooms/{id}/host/pause`
   - `POST /api/rooms/{id}/host/resume`
   - `POST /api/rooms/{id}/host/skip-question`
   - `POST /api/rooms/{id}/host/broadcast` { message }
   - `POST /api/rooms/{id}/host/end-early`
   ```

3. **§16.3 WebSocket Events** — thêm events mới (`GAME_PAUSED`, `GAME_RESUMED`, `QUESTION_SKIPPED`, `HOST_BROADCAST`).

**Commit:** `docs(spec): document Host-Organizer mode (Sprint 4) in §5.4`

---

## Final regression (sau khi 10 tasks DONE)

1. **Backend tests:** baseline + ~30 new tests pass
2. **Frontend tests:** baseline + ~20 new tests pass
3. **Manual smoke test (mandatory):**
   - [ ] Tạo room mới → DB row có `host_plays_game=FALSE`
   - [ ] Vào lobby → host thấy "Bạn là Quản trò" + nút "BẮT ĐẦU TRẬN ĐẤU"
   - [ ] Player join → thấy host card "Không chơi" + nút Sẵn sàng
   - [ ] 1 player ready → start button vẫn disabled
   - [ ] 2 players ready → host bấm Start → cả 3 thấy game start
   - [ ] Host route `/room/{id}/host` — spectator view với 4 controls
   - [ ] Player route `/room/{id}/quiz` — gameplay bình thường, scoreboard không có host
   - [ ] Host bấm Pause → overlay cho cả host + players → host bấm Resume → game tiếp tục
   - [ ] Host bấm Skip → câu hiện tại bỏ qua, sang câu kế
   - [ ] Host bấm Nhắn → modal input → player thấy banner 5s
   - [ ] Host bấm End early → confirm → game end với rankings
   - [ ] End screen host: "Cảm ơn Quản trò!" + 4 actions
   - [ ] Click "Tổ chức trận mới" → CreateRoom pre-filled
   - [ ] End screen player: hạng cá nhân + rankings không có host
   - [ ] Legacy room (host_plays_game=TRUE) vẫn hoạt động như cũ
4. **DB inspection:**
   ```sql
   SELECT host_plays_game, COUNT(*) FROM rooms WHERE created_at > NOW() - INTERVAL 1 DAY GROUP BY host_plays_game;
   -- Phải có cả TRUE (legacy) và FALSE (Sprint 4 new) tùy timing
   ```
5. **Update TODO.md:** Section "Multiplayer Sprint 4 [DONE]" với 10 tasks

---

## Rules cho Claude Code

1. **Verification-first** — đọc code trước khi sửa, code đã thay đổi sau Sprint 1, 2.5, 3
2. **Separate commits** — 10 tasks = 10 commits + 1 docs commit
3. **Stop sau mỗi commit** — chạy tests, báo cáo, đợi confirm
4. **Backward compat** — legacy rooms (hostPlaysGame=true) phải tiếp tục work
5. **Match mockup pixel-perfect** — reference `MOCKUP_HOST_ORGANIZER_FLOW.html` cho UI
6. **i18n complete** — vi.json AND en.json cho mọi string mới
7. **Constraint rules** font/emoji/color/animation — apply cho mọi component mới
8. **Sprint 2.5 R4 compatibility** — host promote logic must work với hostPlaysGame field

---

## Out of scope (Sprint 5 hoặc defer)

- TV Host Mode v1.5 (defer per memory)
- Promote-không-muốn handle (defer Sprint 5)
- Migration script chuyển legacy rooms sang Quản trò mode (manual migration nếu cần)
- Analytics endpoint `/room/{id}/analytics` (button có nhưng có thể defer)
- Export CSV endpoint mới (dùng existing nếu có)
- Tournament organizer separation (Q5 đã quyết: giữ nguyên)

---

## Effort estimate

| Phase | Tasks | Effort |
|---|---|---|
| Phase 1: Backend Foundation | S4-1 → S4-4 | 1.5 days |
| Phase 2: Host Controls API | S4-5 | 0.5 day |
| Phase 3: Frontend Lobby | S4-6, S4-7 | 1 day |
| Phase 4: Frontend Quiz | S4-8, S4-9 | 1.5 days |
| Phase 5: End Screen | S4-10 | 0.5 day |
| Phase 6: Docs | S4-DOCS | 0.25 day |
| **Total** | **11 commits** | **~5.25 days** |

LOC change estimate: ~2000-2500 lines (new components, refactor, migrations).

---

**Bắt đầu bằng Phase 1 (S4-1 migration). Stop sau mỗi commit. Confirm với Bui trước khi sang task tiếp theo.**
