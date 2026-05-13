# PROMPT: Multiplayer Sprint 2.5 — Room Lifecycle Fixes

> **Mục tiêu:** Wire up 5 lifecycle rules để loại bỏ stuck rooms, phòng zombie, host-disconnect lock. Confirmed bug live trong dev DB từ `ROOM_LIFECYCLE_AUDIT_REPORT.md`: 1 row IN_PROGRESS stuck 3 giờ + 95 ENDED rows >1 day chưa cleanup.
>
> **Reference:**
> - `ROOM_LIFECYCLE_AUDIT_REPORT.md` — audit gốc với DB inspection thật
> - `SPEC_USER_v3_PATCH_5.4.0.md` — 5 rules canonical
> - SPEC_USER_v3 §5.4.0 (cần update theo patch), §5.4.5 (disconnect & reconnect)
>
> **Position trong roadmap:** Chèn giữa Sprint 1 (DONE) và Sprint 2 (cinematic ceremony). Sprint 2.5 phải xong trước Sprint 2 vì cinematic countdown bắn vào phòng đã chết là negative UX.

---

## Verification Protocol (BẮT BUỘC trước mỗi task)

1. **Read trước khi sửa** — line numbers từ audit có thể đã shift
2. **Quote line numbers** trong commit message khi sửa
3. **Nếu function đã refactor sau Sprint 1** — note rõ
4. **Tests pre-existing fail** (per memory) — KHÔNG treat là blocker
5. **DB inspection** — sau mỗi task có ảnh hưởng cleanup, chạy lại query để confirm:
   ```sql
   SELECT status, COUNT(*) FROM rooms GROUP BY status;
   SELECT id, room_code, status, started_at, TIMESTAMPDIFF(HOUR, started_at, NOW()) AS hours
   FROM rooms WHERE status='IN_PROGRESS';
   ```

---

## Commit hygiene

- **Mỗi task = 1 commit riêng.** Không gộp.
- Format: `fix(multiplayer):` hoặc `feat(multiplayer):` tùy task
- Sau mỗi commit: STOP, chạy test, báo cáo, đợi Bui confirm.

---

## Task L-1 — Wire `deleteExpiredRooms` cho ENDED retention 24h 🔴

**Audit ref:** G2 (98 ENDED rows trong dev, 95 cái >1 day, never purged), Recommendation #2.

**Decision:** ENDED retention = **24 giờ** (per Bui quyết định).

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/room/repository/RoomRepository.java` — verify method `deleteExpiredRooms` exists
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomCleanupScheduler.java` (~line 34-42) — add new sweep call
- `apps/api/src/main/resources/application.yml` (or shared config) — thêm `room.ended-retention-hours: 24`

**Steps:**

1. **Verify** `RoomRepository.deleteExpiredRooms` method tại line ~42-43 — đọc signature, hiểu nó nhận tham số gì (likely `Instant cutoff`).

2. **Add config:**
   ```yaml
   # application.yml
   biblequiz:
     room:
       ended-retention-hours: 24
       idle-timeout-minutes: 30  # for Task L-3
   ```

3. **Update RoomCleanupScheduler:**
   ```java
   @Component
   @RequiredArgsConstructor
   @Slf4j
   public class RoomCleanupScheduler {
     private final RoomService roomService;
     private final RoomRepository roomRepository;
     
     @Value("${biblequiz.room.ended-retention-hours:24}")
     private long endedRetentionHours;
     
     @Scheduled(fixedRate = 10 * 60 * 1000L)  // every 10 min
     public void sweepRooms() {
       sweepAbandonedLobbies();
       purgeExpiredEndedRooms();  // NEW
     }
     
     private void purgeExpiredEndedRooms() {
       Instant cutoff = Instant.now().minus(endedRetentionHours, ChronoUnit.HOURS);
       int deleted = roomRepository.deleteExpiredRooms(cutoff);
       // ALWAYS log, even when 0, để verify scheduler đang chạy (G10)
       log.info("RoomCleanupScheduler: purged {} ENDED rooms older than {}h", deleted, endedRetentionHours);
     }
   }
   ```

4. **CASCADE check:** verify `room_player` table có `ON DELETE CASCADE` cho `room_id` FK. Nếu không → migration thêm cascade hoặc explicit delete trong service. Đọc V3__rooms.sql migration.

5. **Tests:** `RoomCleanupSchedulerTest`:
   - Test `purgeExpiredEndedRooms` xóa rooms >24h ENDED
   - Test không xóa rooms <24h
   - Test không xóa LOBBY/IN_PROGRESS rooms

**Test:**
- Backend test pass
- Manual SQL: `INSERT INTO rooms ... status='ENDED', ended_at = NOW() - INTERVAL 25 HOUR;` → đợi scheduler chạy hoặc trigger thủ công → row biến mất
- DB inspection sau 10 phút: `SELECT COUNT(*) FROM rooms WHERE status='ENDED'` giảm

**Commit:** `feat(multiplayer): purge ENDED rooms older than 24h (R3)`

---

## Task L-2 — RoomAbandonmentScheduler cho stuck IN_PROGRESS 🔴

**Audit ref:** G1 (confirmed 1 row stuck 3h trong dev DB), Recommendation #1.

**Root cause:** `RoomQuizService.runQuiz` là path duy nhất set IN_PROGRESS → ENDED. Nếu JVM crash giữa quiz, row stuck mãi. Player của room đó bị "1 active room per user" rule → không tạo phòng mới được (line 56-59 RoomPlayerRepository).

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/room/repository/RoomRepository.java` — thêm query method
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomAbandonmentScheduler.java` (NEW)
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` — verify `endRoom` idempotent

**Steps:**

1. **Repository method:**
   ```java
   @Query("SELECT r FROM Room r WHERE r.status = 'IN_PROGRESS' " +
          "AND r.startedAt < :cutoff")
   List<Room> findStuckInProgressRooms(@Param("cutoff") Instant cutoff);
   ```

2. **New scheduler:**
   ```java
   @Component
   @RequiredArgsConstructor
   @Slf4j
   public class RoomAbandonmentScheduler {
     private final RoomRepository roomRepository;
     private final RoomService roomService;
     private final RoomWebSocketController webSocketController;
     
     // Stuck threshold: max question count × max time/question + buffer
     // Worst case: 50 câu × 60s = 50 phút. Add 30 min safety = 80 phút
     // Default 90 phút.
     private static final long STUCK_THRESHOLD_MINUTES = 90;
     
     @Scheduled(fixedRate = 5 * 60 * 1000L)  // every 5 min
     public void sweepStuckGames() {
       Instant cutoff = Instant.now().minus(STUCK_THRESHOLD_MINUTES, ChronoUnit.MINUTES);
       List<Room> stuck = roomRepository.findStuckInProgressRooms(cutoff);
       
       if (stuck.isEmpty()) {
         log.debug("RoomAbandonmentScheduler: no stuck rooms");
         return;
       }
       
       log.warn("RoomAbandonmentScheduler: found {} stuck IN_PROGRESS rooms", stuck.size());
       for (Room room : stuck) {
         try {
           roomService.endRoom(room.getId());
           // Broadcast ROOM_ENDED with reason — fed into Task L-4
           webSocketController.broadcastRoomEnded(room.getId(), "STUCK_GAME");
           log.warn("Recovered stuck room {} (started {})", room.getRoomCode(), room.getStartedAt());
         } catch (Exception e) {
           log.error("Failed to recover stuck room {}", room.getId(), e);
         }
       }
     }
   }
   ```

3. **Verify endRoom idempotent** — `RoomService.endRoom` (line 363-368): nếu room đã ENDED, gọi lại không throw, chỉ no-op. Add guard nếu cần:
   ```java
   public void endRoom(String roomId) {
     Room room = findById(roomId);
     if (room.getStatus() == Room.RoomStatus.ENDED) {
       return; // already ended
     }
     room.setStatus(Room.RoomStatus.ENDED);
     room.setEndedAt(Instant.now());
     roomRepository.save(room);
   }
   ```

4. **Tests:** `RoomAbandonmentSchedulerTest`:
   - Stuck IN_PROGRESS room (started 100 phút ago) → recovered to ENDED
   - Recent IN_PROGRESS room (started 30 phút ago) → untouched
   - LOBBY/ENDED rooms → untouched

**Test:**
- Backend test pass
- Manual: tạo IN_PROGRESS row trong DB với started_at=NOW()-INTERVAL 2 HOUR → đợi scheduler → confirm row đã ENDED
- DB sau 1 lần scheduler chạy: stuck row trong audit (3h IN_PROGRESS) phải biến mất

**Commit:** `feat(multiplayer): RoomAbandonmentScheduler recovers stuck IN_PROGRESS rooms (R5, G1)`

---

## Task L-3 — Wire `ROOM_IDLE_TIMEOUT_MIN` admin config + đồng bộ constants 🟠

**Audit ref:** G4 (admin config DEAD), G8 (2 constants không sync, không honor admin config).

**Goal:**
- `RoomService.STALE_LOBBY_HOURS` (1h) và `RoomCleanupScheduler.ABANDONED_LOBBY_HOURS` (2h) → cùng đọc từ admin config `ROOM_IDLE_TIMEOUT_MIN` (default 30 phút).
- Admin chỉnh trong `/admin/config` → effect ngay không cần redeploy.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/admin/service/ConfigService.java` (verify exist, hoặc tạo nếu cần)
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` (~line 142, 155-172)
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomCleanupScheduler.java` (~line 26)

**Steps:**

1. **Verify ConfigService** — grep tìm cách backend đọc `app_config` table. Thường có pattern:
   ```java
   @Service
   public class ConfigService {
     @Cacheable("config")
     public int getInt(String key, int defaultValue) {
       return appConfigRepository.findByKey(key)
         .map(AppConfig::getIntValue)
         .orElse(defaultValue);
     }
   }
   ```
   Nếu chưa có → tạo. Nếu có → reuse.

2. **Update RoomService:**
   ```java
   // Xóa: private static final long STALE_LOBBY_HOURS = 1L;
   private final ConfigService configService;
   
   private Duration getIdleTimeout() {
     int minutes = configService.getInt("ROOM_IDLE_TIMEOUT_MIN", 30);
     return Duration.ofMinutes(minutes);
   }
   
   public void cleanupStaleLobbyForUser(...) {
     Instant cutoff = Instant.now().minus(getIdleTimeout());
     // ... existing logic with cutoff
   }
   ```

3. **Update RoomCleanupScheduler:**
   ```java
   // Xóa: private static final long ABANDONED_LOBBY_HOURS = 2L;
   
   private void sweepAbandonedLobbies() {
     int minutes = configService.getInt("ROOM_IDLE_TIMEOUT_MIN", 30);
     Instant cutoff = Instant.now().minus(minutes, ChronoUnit.MINUTES);
     int closed = roomService.endLobbyRoomsOlderThan(cutoff);
     log.info("RoomCleanupScheduler: closed {} idle lobbies (cutoff {} min)", closed, minutes);
   }
   ```

4. **Cache invalidation:** nếu ConfigService cache, ensure admin update endpoint clear cache.

5. **Tests:** ConfigServiceTest verify default fallback; RoomCleanupSchedulerTest dùng mock ConfigService.

**Test:**
- Manual: admin chỉnh `ROOM_IDLE_TIMEOUT_MIN` từ 30 → 5 trong `/admin/config` → tạo lobby, đợi 6 phút → scheduler end nó (thay vì 30 phút)
- Unit: 2 schedulers cùng dùng cutoff giống nhau khi đọc cùng config

**Commit:** `fix(multiplayer): wire ROOM_IDLE_TIMEOUT_MIN admin config + sync stale-lobby constants (G4, G8)`

---

## Task L-4 — Broadcast `ROOM_ENDED` từ cleanup paths + FE handler 🟠

**Audit ref:** G5 (frame defined nhưng never sent/handled), Recommendation #5.

**Goal:** Mọi path end room (R1, R2, R5) đều broadcast `ROOM_ENDED { reason }`. FE handler toast + redirect.

**Files:**
- `apps/api/src/main/java/com/biblequiz/api/websocket/WebSocketMessage.java` — thêm `RoomEndedData` DTO
- `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java` — thêm `broadcastRoomEnded(roomId, reason)`
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` — call broadcast trong cleanup paths
- `apps/web/src/pages/RoomLobby.tsx` — handler
- `apps/web/src/pages/room/RoomQuiz.tsx` — handler
- `apps/web/src/i18n/vi.json`, `en.json` — localized reasons

**Steps:**

1. **Backend DTO:**
   ```java
   public static class RoomEndedData {
     private String roomId;
     private String reason; // EMPTY_LOBBY | IDLE_TIMEOUT | HOST_GONE | ALL_DISCONNECTED | STUCK_GAME
     private String message;  // optional human-readable
     // getters + setters
   }
   ```

2. **Helper method in RoomWebSocketController:**
   ```java
   public void broadcastRoomEnded(String roomId, String reason) {
     RoomEndedData data = new RoomEndedData();
     data.setRoomId(roomId);
     data.setReason(reason);
     messagingTemplate.convertAndSend("/topic/room/" + roomId,
       new WebSocketMessage(MessageTypes.ROOM_ENDED, data));
   }
   ```

3. **Trigger points** — gọi broadcast TRƯỚC khi delete (vì sau delete, topic không còn subscribers nhận):
   - `RoomService.leaveRoom` (R1 — empty lobby): trước `roomRepository.delete(room)` → broadcast với reason `EMPTY_LOBBY`
   - `RoomService.cleanupStaleLobbyForUser` (line 163-166, R2): broadcast `IDLE_TIMEOUT`
   - `RoomService.endLobbyRoomsOlderThan` (R2 từ scheduler): broadcast `IDLE_TIMEOUT` cho từng room
   - `RoomAbandonmentScheduler` (R5, từ Task L-2): broadcast `STUCK_GAME`
   - `RoomPresenceListener` (Task L-5): broadcast `HOST_GONE` hoặc `ALL_DISCONNECTED`

4. **Frontend handlers:**
   ```typescript
   // RoomLobby.tsx và RoomQuiz.tsx
   case 'ROOM_ENDED':
     const reasonKey = `room.ended.${data.reason.toLowerCase()}`;
     toast.info(t(reasonKey, { defaultValue: t('room.ended.generic') }));
     navigate('/multiplayer');
     break;
   ```

5. **i18n strings:**
   ```json
   // vi.json
   "room.ended.empty_lobby": "Phòng đã đóng vì hết người chơi",
   "room.ended.idle_timeout": "Phòng đã đóng do không hoạt động",
   "room.ended.host_gone": "Phòng đã đóng vì host rời đi",
   "room.ended.all_disconnected": "Phòng đã đóng vì tất cả mất kết nối",
   "room.ended.stuck_game": "Phòng đã đóng do lỗi hệ thống",
   "room.ended.generic": "Phòng đã đóng"
   ```
   English equivalent.

6. **Tests:**
   - Backend: verify broadcast được gọi cho mỗi cleanup path
   - Frontend: handler dispatches toast + navigate

**Test:**
- Manual: 2 người trong lobby, 1 leave (đầy đủ), người thứ 2 cũng leave → người thứ 2 thấy toast (nhưng đã navigate đi rồi nên không thấy được — đây là R1 case acceptable)
- Manual mạnh hơn: tạo idle lobby 31 phút → scheduler trigger → user vẫn ngồi trong lobby thấy toast "Phòng đã đóng do không hoạt động" + redirect

**Commit:** `feat(multiplayer): broadcast ROOM_ENDED with reason from all cleanup paths (G5)`

---

## Task L-5 — `SessionDisconnectEvent` listener + 60s grace + host promote 🔴

**Audit ref:** G3 (host disconnect lock), G9 (Battle Royale absence-elimination), Recommendation #3. Lớn nhất sprint.

**Goal:**
- Listen STOMP `SessionDisconnectEvent`
- Map session ID → user ID → room ID(s)
- Sau 60s grace period, nếu user chưa reconnect:
  - Mark `RoomPlayer.status = LEFT` (hoặc `ELIMINATED` trong Battle Royale)
  - Nếu là host → promote next-joined active member (HOST_CHANGED event)
  - Nếu không còn member → end room (ROOM_ENDED reason=ALL_DISCONNECTED)

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomPresenceListener.java` (NEW)
- `apps/api/src/main/java/com/biblequiz/modules/room/service/PresenceTracker.java` (NEW — Redis-backed map session→user→rooms)
- `apps/api/src/main/java/com/biblequiz/api/websocket/WebSocketMessage.java` — thêm `HOST_CHANGED` constant
- `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java` — broadcast `HOST_CHANGED`
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` — `promoteHost` method
- `apps/api/src/main/java/com/biblequiz/modules/room/engine/BattleRoyaleEngine.java` — extend với absence handling
- `apps/web/src/pages/RoomLobby.tsx` — handle HOST_CHANGED
- `apps/web/src/pages/room/RoomQuiz.tsx` — handle HOST_CHANGED

**Steps:**

1. **PresenceTracker** (Redis sets):
   ```java
   @Service
   @RequiredArgsConstructor
   public class PresenceTracker {
     private final StringRedisTemplate redis;
     
     // Key: presence:session:{sessionId} → userId
     // Key: presence:user:{userId}:rooms → set of roomId
     // Key: presence:room:{roomId}:users → set of userId
     
     public void track(String sessionId, String userId, String roomId) { ... }
     public String getUserBySession(String sessionId) { ... }
     public Set<String> getRoomsByUser(String userId) { ... }
     public void untrackSession(String sessionId) { ... }
   }
   ```

2. **STOMP CONNECT/SUBSCRIBE handler** — track session khi user subscribe `/topic/room/{roomId}`:
   ```java
   @EventListener
   public void onSubscribe(SessionSubscribeEvent event) {
     // Extract sessionId, userId from auth, roomId from destination
     presenceTracker.track(sessionId, userId, roomId);
   }
   ```

3. **DisconnectListener:**
   ```java
   @Component
   @RequiredArgsConstructor
   @Slf4j
   public class RoomPresenceListener {
     private final PresenceTracker presenceTracker;
     private final RoomService roomService;
     private final RoomWebSocketController webSocketController;
     private final TaskScheduler taskScheduler;
     
     @Value("${biblequiz.room.reconnect-grace-seconds:60}")
     private int graceSeconds;
     
     @EventListener
     public void onDisconnect(SessionDisconnectEvent event) {
       String sessionId = event.getSessionId();
       String userId = presenceTracker.getUserBySession(sessionId);
       if (userId == null) return;
       
       Set<String> rooms = presenceTracker.getRoomsByUser(userId);
       presenceTracker.untrackSession(sessionId);
       
       // Schedule grace check after 60s
       taskScheduler.schedule(() -> {
         handleGracePeriodEnd(userId, rooms);
       }, Instant.now().plusSeconds(graceSeconds));
     }
     
     private void handleGracePeriodEnd(String userId, Set<String> rooms) {
       // Check if user reconnected (presence has new session for userId)
       if (presenceTracker.userHasActiveSession(userId)) {
         log.debug("User {} reconnected before grace period end", userId);
         return;
       }
       
       for (String roomId : rooms) {
         try {
           Room room = roomService.findById(roomId);
           if (room.getStatus() == Room.RoomStatus.ENDED) continue;
           
           // Mark player LEFT (or ELIMINATED in Battle Royale)
           boolean isBattleRoyale = room.getMode() == GameMode.BATTLE_ROYALE 
             && room.getStatus() == Room.RoomStatus.IN_PROGRESS;
           PlayerStatus newStatus = isBattleRoyale 
             ? PlayerStatus.ELIMINATED 
             : PlayerStatus.LEFT;
           roomService.updatePlayerStatus(roomId, userId, newStatus);
           
           // If host → promote
           if (room.getHost().getId().equals(userId)) {
             User newHost = roomService.promoteNextHost(roomId);
             if (newHost == null) {
               // No remaining members → end room
               webSocketController.broadcastRoomEnded(roomId, "HOST_GONE");
               roomService.endRoom(roomId);
             } else {
               webSocketController.broadcastHostChanged(roomId, newHost);
             }
           }
           
           // Battle Royale: if all DC → end (R5)
           if (isBattleRoyale && roomService.countActivePlayers(roomId) == 0) {
             webSocketController.broadcastRoomEnded(roomId, "ALL_DISCONNECTED");
             roomService.endRoom(roomId);
           }
         } catch (Exception e) {
           log.error("Error handling grace end for user {} in room {}", userId, roomId, e);
         }
       }
     }
   }
   ```

4. **RoomService.promoteNextHost:**
   ```java
   @Transactional
   public User promoteNextHost(String roomId) {
     Room room = findById(roomId);
     // Find next active player joined earliest (excluding current host)
     Optional<RoomPlayer> next = roomPlayerRepository
       .findFirstByRoomIdAndStatusAndUserIdNotOrderByJoinedAtAsc(
         roomId, PlayerStatus.ACTIVE, room.getHost().getId());
     
     if (next.isEmpty()) return null;
     
     User newHost = next.get().getUser();
     room.setHost(newHost);
     roomRepository.save(room);
     log.info("Promoted user {} to host of room {}", newHost.getId(), roomId);
     return newHost;
   }
   ```

5. **HOST_CHANGED constant + broadcast:**
   ```java
   public static final String HOST_CHANGED = "HOST_CHANGED";
   
   public static class HostChangedData {
     private String roomId;
     private String newHostId;
     private String newHostName;
     // getters + setters
   }
   
   public void broadcastHostChanged(String roomId, User newHost) {
     HostChangedData data = new HostChangedData();
     data.setRoomId(roomId);
     data.setNewHostId(newHost.getId());
     data.setNewHostName(newHost.getName());
     messagingTemplate.convertAndSend("/topic/room/" + roomId,
       new WebSocketMessage(MessageTypes.HOST_CHANGED, data));
   }
   ```

6. **TaskScheduler bean** — config Spring để có TaskScheduler injectable. Có thể đã có; nếu chưa, add:
   ```java
   @Configuration
   @EnableScheduling
   public class SchedulingConfig {
     @Bean
     public TaskScheduler taskScheduler() {
       ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
       scheduler.setPoolSize(5);
       scheduler.setThreadNamePrefix("room-grace-");
       return scheduler;
     }
   }
   ```

7. **Frontend handlers** trong RoomLobby.tsx + RoomQuiz.tsx:
   ```typescript
   case 'HOST_CHANGED':
     // Update local room state
     setRoom(prev => prev ? { ...prev, hostId: data.newHostId, hostName: data.newHostName } : prev);
     // Toast cho mọi người
     toast.info(t('room.hostChanged', { name: data.newHostName }));
     // Nếu user là new host → toast khác
     if (data.newHostId === currentUser.id) {
       toast.success(t('room.youAreNowHost'));
     }
     break;
   ```

8. **i18n strings:**
   ```json
   "room.hostChanged": "{{name}} đã trở thành host mới",
   "room.youAreNowHost": "Bạn đã trở thành host của phòng này"
   ```

9. **Tests** — đây là task có nhiều paths:
   - Disconnect → grace → reconnect: no action
   - Disconnect → grace → no reconnect → status LEFT
   - Disconnect host → grace → no reconnect → next member promoted
   - Disconnect host → grace → no reconnect → no remaining → ROOM_ENDED
   - Battle Royale disconnect → grace → no reconnect → status ELIMINATED
   - Battle Royale all disconnect → grace → ROOM_ENDED reason=ALL_DISCONNECTED

**Test:**
- Backend test pass (mock TaskScheduler hoặc fast-forward time)
- Manual: 2 người trong lobby, host đóng tab → đợi 60s → người còn lại thấy "An đã trở thành host mới" toast + có thể start phòng được
- Manual Battle Royale: 4 người chơi, 1 đóng tab giữa câu → đợi 60s → engine eliminate, round tiếp tục bình thường

**Commit:** `feat(multiplayer): STOMP disconnect listener with 60s grace, host promote, BR elimination (R4, R5, G3, G9)`

---

## Task L-6 — `joinable` field + FE gate "Tiếp tục" button 🟠

**Audit ref:** G7 (public list lừa user click vào IN_PROGRESS rooms họ không thể join), Recommendation #7.

**Goal:** Public rooms list chỉ hiện nút join cho rooms thực sự joinable.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/room/dto/PublicRoomDTO.java` (verify path)
- `apps/api/src/main/java/com/biblequiz/api/RoomController.java` — endpoint serving public list (~line 240-247)
- `apps/web/src/pages/Multiplayer.tsx` — gate button (~line 382-392)

**Steps:**

1. **Add `joinable` field** trong DTO:
   ```java
   public class PublicRoomDTO {
     // existing fields
     private boolean joinable;
   }
   ```

2. **Compute joinable** trong service/controller — viewer-aware:
   ```java
   // RoomController.getPublicRooms or RoomService method
   public List<PublicRoomDTO> getPublicRoomsForViewer(String viewerUserId) {
     List<Room> rooms = roomRepository.findPublicLobbyRooms();
     return rooms.stream().map(room -> {
       PublicRoomDTO dto = mapToDTO(room);
       boolean isMember = roomPlayerRepository.existsByRoomIdAndUserId(room.getId(), viewerUserId);
       
       if (room.getStatus() == Room.RoomStatus.LOBBY) {
         dto.setJoinable(room.getCurrentPlayers() < room.getMaxPlayers());
       } else if (room.getStatus() == Room.RoomStatus.IN_PROGRESS) {
         // Only existing members can rejoin in-progress
         dto.setJoinable(isMember);
       } else {
         dto.setJoinable(false);
       }
       return dto;
     }).toList();
   }
   ```

3. **Frontend gate** trong Multiplayer.tsx ~line 382-392:
   ```tsx
   {room.status === 'IN_PROGRESS' ? (
     room.joinable ? (
       <button onClick={() => handleJoin(room.id)} className="...">
         Tiếp tục →
       </button>
     ) : (
       <span className="text-xs text-gray-500">Đang chơi · không thể tham gia</span>
     )
   ) : (
     <button onClick={() => handleJoin(room.id)} className="...">
       Tham gia
     </button>
   )}
   ```

4. **Tests:**
   - Backend: PublicRoomDTO joinable correct cho LOBBY/IN_PROGRESS với member/non-member viewer
   - Frontend: button render conditionally

**Test:**
- Manual: tạo room IN_PROGRESS với 2 thành viên → user thứ 3 (non-member) mở Multiplayer page → thấy "Đang chơi · không thể tham gia" thay vì button "Tiếp tục →"
- Manual: 1 trong 2 thành viên đóng tab → mở lại Multiplayer → thấy "Tiếp tục →" button (vì là member)

**Commit:** `feat(multiplayer): joinable field + FE gate Tiếp tục button for non-members (G7)`

---

## Bonus task (cùng commit OK) — Apply SPEC patch §5.4.0

**Goal:** Apply `SPEC_USER_v3_PATCH_5.4.0.md` content vào `SPEC_USER_v3.md`.

**Steps:**
1. Read `SPEC_USER_v3_PATCH_5.4.0.md`
2. Read current `SPEC_USER_v3.md` §5.4.0 (line ~318-323)
3. Replace existing với patch content
4. Update §5.4.5 cross-ref R4, R5
5. Update §16.3 thêm `ROOM_ENDED`, `HOST_CHANGED` schemas
6. Confirm SPEC_ADMIN_v3 §13.2 có `ROOM_IDLE_TIMEOUT_MIN`, thêm `ROOM_ENDED_RETENTION_HOURS = 24`, `RECONNECT_GRACE_SECONDS = 60`

**Commit:** `docs(spec): canonical room lifecycle rules in §5.4.0`

---

## Final regression (sau khi 6 tasks DONE)

1. **Backend tests:** baseline + new tests pass (estimate ~30+ new tests across 6 tasks)
2. **Frontend tests:** baseline + new tests
3. **DB inspection sau 1 sprint deployment:**
   ```sql
   SELECT status, COUNT(*) FROM rooms GROUP BY status;
   -- ENDED rows count phải giảm dần (24h purge)
   -- IN_PROGRESS không có row nào > 90 phút
   ```
4. **Manual smoke test:**
   - [ ] Tạo lobby, đợi `ROOM_IDLE_TIMEOUT_MIN` phút → broadcast ROOM_ENDED + redirect
   - [ ] Tạo lobby 2 người, host đóng tab → 60s sau player còn lại được promote thành host
   - [ ] Battle Royale 4 người, 1 đóng tab giữa câu → 60s eliminate, không freeze game
   - [ ] Multiplayer page: room IN_PROGRESS user không phải member → không có button join
   - [ ] Sau 24h, ENDED rooms cũ tự xóa
   - [ ] Tạo 1 row IN_PROGRESS giả với started_at=2h ago → scheduler recover sau 5 phút
5. **Update TODO.md:** Section "Multiplayer Sprint 2.5 [DONE]" với 6 tasks

---

## Rules cho Claude Code

1. **Verification-first** — đọc code trước khi sửa, line numbers từ audit có thể đã shift
2. **Separate commits** — 6 tasks = 6 commits + 1 docs commit
3. **Stop sau mỗi commit** — chạy tests, báo cáo, đợi confirm
4. **DB inspection** sau task L-1, L-2 để verify cleanup work
5. **Tests required** cho mọi task — đặc biệt L-2, L-5 (lifecycle critical)
6. **Logging required** — mỗi scheduler ALWAYS log (kể cả count=0) để verify đang chạy (G10)
7. **Idempotent endRoom** — guard `if status == ENDED return` để tránh race
8. **Match memory rules:** hardcoded hex colors, no CSS variables, Be Vietnam Pro fonts cho Vietnamese text

---

## Out of scope (Sprint 3 hoặc defer)

- CANCELLED enum cleanup (G6) — sẽ xóa trong refactor riêng, low priority
- `refetchOnWindowFocus` cho Multiplayer page (G10 quick win) — defer Sprint 3
- Spectate mode implementation — Sprint 3
- Tier gating Battle Royale tier 3 / Sudden Death tier 5 — Sprint 3
- Atomic addPlayerToRoom race fix — Sprint 3
- Chat rate-limit error frame — Sprint 3
- TV Host Mode v1.5

---

## Effort estimate

| Task | Effort | Severity |
|---|---|---|
| L-1 ENDED purge 24h | XS (~1h) | 🔴 |
| L-2 RoomAbandonmentScheduler | M (~3h) | 🔴 |
| L-3 Wire admin config | S (~2h) | 🟠 |
| L-4 ROOM_ENDED broadcast + FE | S (~2h) | 🟠 |
| L-5 Disconnect listener + grace + promote + BR | L (~6-8h) | 🔴 |
| L-6 joinable field + FE gate | S (~2h) | 🟠 |
| Bonus: SPEC patch | XS (~30min) | docs |
| **Total** | **~16-18h (~2-2.5 days)** | |

LOC change estimate: ~800-1200 lines (new schedulers, listener, test files).

---

**Bắt đầu bằng L-1 (XS, smoke test scheduler infrastructure). Stop sau commit. Confirm với Bui trước khi sang L-2.**
