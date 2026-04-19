# Feature Prompt — Church Group real-time updates (WebSocket)

> **Status**: Deferred. Copy nội dung phần "PROMPT FOR CLAUDE CODE" bên dưới
> vào Claude Code khi sẵn sàng triển khai.
>
> **Context reference**: đã được product owner approve là Phase 1 trong roadmap
> mở rộng Nhóm Giáo Xứ (xem phân tích "đánh giá độ phức tạp 3 hướng mở rộng"
> — option "WebSocket real-time" có ROI cao nhất, leverage infra sẵn có 90%).

## Background (cho người đọc)

Tính năng Nhóm Giáo Xứ (`ChurchGroup` entity) hiện chỉ update khi user
refresh page. Khi:
- Leader post announcement mới
- Thành viên join/leave
- Leaderboard nhóm đổi thứ hạng

→ các member khác đang online KHÔNG thấy update cho đến khi họ tự refresh.

Infra WebSocket đã có sẵn trong codebase (dùng cho RoomQuiz multiplayer):
- `apps/api/src/main/java/com/biblequiz/infrastructure/WebSocketConfig.java`
- `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java`
- `apps/web/src/hooks/useStomp.ts`

Feature này **tái sử dụng** hạ tầng trên, không thêm dependency mới.

## Acceptance tests (thủ công)

Mở 2 browser tab với 2 user khác nhau, cùng là member của nhóm X:

1. Tab A (leader): post announcement mới → Tab B (member) thấy announcement
   xuất hiện ở đầu danh sách trong vòng **< 2 giây**, không cần refresh.
2. Tab A (leader): remove member M → Tab B nếu là M thì thấy "Bạn đã bị
   xóa khỏi nhóm" modal + redirect về `/groups`. Các tab khác thấy member
   count giảm.
3. Tab A chơi Ranked xong, XP tăng → Tab B thấy leaderboard nhóm cập nhật
   thứ hạng A trong **< 5 giây**.
4. Tab A mất mạng → tab hiện "Đang kết nối lại..." banner. Khi có mạng lại,
   auto-reconnect + refetch state. Không crash.
5. Tab A ở background/idle 5 phút → WS vẫn giữ kết nối (hoặc reconnect mượt
   khi user quay lại).

---

# PROMPT FOR CLAUDE CODE

```
# Feature: WebSocket real-time updates cho Nhóm Giáo Xứ

## Mục tiêu

Khi member online trong GroupDetail page, các sự kiện sau phải tự động
cập nhật UI mà không cần refresh:
1. Announcement mới (leader post)
2. Member join/leave
3. Leaderboard đổi thứ hạng

Tái sử dụng STOMP/WebSocket infra có sẵn (dùng cho multiplayer rooms),
KHÔNG thêm dependency mới, KHÔNG thay đổi entity/migration.

## Files PHẢI đọc TRƯỚC khi code (Think Before Code)

Order of reading:
1. apps/api/src/main/java/com/biblequiz/infrastructure/WebSocketConfig.java
   — hiểu broker config, message mapping, auth inbound
2. apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java
   — pattern mẫu: controller, @MessageMapping, SimpMessagingTemplate broadcast
3. apps/api/src/main/java/com/biblequiz/api/websocket/WebSocketMessage.java
   — DTO chuẩn cho mọi message
4. apps/api/src/main/java/com/biblequiz/modules/group/service/ChurchGroupService.java
   — chỗ sẽ inject SimpMessagingTemplate và gọi broadcast
5. apps/api/src/main/java/com/biblequiz/modules/group/entity/ChurchGroup.java,
   GroupMember.java, GroupAnnouncement.java — DTO shape
6. apps/web/src/hooks/useStomp.ts — hiểu API hook, reconnection, auth
7. apps/web/src/pages/GroupDetail.tsx — chỗ subscribe + merge state
8. apps/web/src/pages/RoomLobby.tsx hoặc RoomQuiz.tsx — pattern mẫu FE dùng useStomp

## Kiến trúc

### Topic namespace
Dùng prefix `/topic/group/{groupId}/*`:
- `/topic/group/{groupId}/announcements` — new announcement payload
- `/topic/group/{groupId}/members` — member_joined / member_left events
- `/topic/group/{groupId}/leaderboard` — leaderboard delta hoặc "invalidate" signal

### Message format
Tái sử dụng `WebSocketMessage` nếu đã đủ generic. Payload:
```json
{
  "type": "ANNOUNCEMENT_CREATED" | "MEMBER_JOINED" | "MEMBER_LEFT" 
        | "MEMBER_REMOVED" | "LEADERBOARD_CHANGED",
  "groupId": "uuid",
  "data": { ... payload theo type ... },
  "timestamp": "2026-04-19T12:34:56Z"
}
```

### Security
- Chỉ members của group mới subscribe được topic của group đó.
- Implement inbound channel interceptor hoặc filter subscribe request —
  verify user ∈ group_members trước khi cho phép subscribe.
- Xem WebSocketRateLimitInterceptor làm reference cho cách hook vào inbound.

## Tasks (1 task = 1 commit)

### Task 1: BE — GroupWebSocketController (subscription auth)
- Tạo file: apps/api/src/main/java/com/biblequiz/api/websocket/GroupWebSocketController.java
- @Controller với @MessageMapping("/group/{groupId}/ping") trả lại pong 
  (keepalive, không bắt buộc nhưng giúp debug)
- Thêm `StompHeaderAccessor` check để verify principal
- Security: trong inbound channel, verify user là member của group trước
  khi cho phép SUBSCRIBE topic `/topic/group/{groupId}/**`. Implement trong
  WebSocketConfig.configureClientInboundChannel hoặc interceptor riêng.
- Tests: 2 cases (member được subscribe, non-member bị reject).

### Task 2: BE — Broadcast on announcement create
- Trong ChurchGroupService.java, inject SimpMessagingTemplate.
- Method createAnnouncement(...) sau khi save DB → gọi:
  ```java
  messagingTemplate.convertAndSend(
    "/topic/group/" + groupId + "/announcements",
    new WebSocketMessage("ANNOUNCEMENT_CREATED", groupId, announcementDto, Instant.now())
  );
  ```
- Tests: mock SimpMessagingTemplate, verify convertAndSend được gọi với
  topic đúng + payload đúng structure.

### Task 3: BE — Broadcast on member join/leave/remove
- joinGroup(...) → broadcast MEMBER_JOINED với user info + new memberCount.
- leaveGroup(...) → broadcast MEMBER_LEFT.
- removeMember(...) (nếu có) → broadcast MEMBER_REMOVED với removedUserId
  để FE của user đó có thể redirect.
- Tests: verify cả 3 trường hợp.

### Task 4: BE — Broadcast on leaderboard change
- Leaderboard thay đổi khi user trong group kiếm XP (qua Ranked).
- Hook point: khi RankedController viết UserDailyProgress.pointsCounted →
  trigger broadcast cho TẤT CẢ groups user đó là member.
- KEEP IT SIMPLE: chỉ broadcast payload `{ type: "LEADERBOARD_CHANGED",
  groupId }` (không gửi full leaderboard) — FE nhận signal → invalidate
  TanStack Query để refetch endpoint leaderboard nhóm.
- Lý do: tránh N+1 khi 1 user join nhiều groups; payload nhỏ, fetch lại đơn giản.
- Thêm helper method trong ChurchGroupService: 
  `notifyLeaderboardChangeForUser(String userId)` — find all groups user is in,
  broadcast signal cho từng group.
- Tests: 1 case.

### Task 5: FE — useGroupChannel hook
- Tạo file: apps/web/src/hooks/useGroupChannel.ts
- Wrap useStomp với 3 subscription (announcements, members, leaderboard).
- Props: `{ groupId: string | undefined }`.
- Return: `{ lastAnnouncement, lastMemberEvent, lastLeaderboardSignal, connected }`.
- Handle graceful unmount (unsubscribe).
- Tests: 4 cases (subscribe on mount, handle message, unsubscribe on unmount,
  reconnect scenario).

### Task 6: FE — Wire into GroupDetail.tsx
- Import useGroupChannel({ groupId }).
- Effect: khi lastAnnouncement change → queryClient.invalidateQueries(['group-announcements', groupId]).
- Effect: khi lastMemberEvent change → invalidate ['group-members', groupId] + ['group-detail', groupId].
  - Nếu event type = MEMBER_REMOVED và removedUserId === current user → 
    navigate('/groups') + show toast "Bạn đã bị xóa khỏi nhóm này".
- Effect: khi lastLeaderboardSignal change → invalidate ['group-leaderboard', groupId].
- Tests: 4 cases (announcement flow, member join flow, member removed → 
  redirect, leaderboard refetch).

### Task 7: FE — Connection status UI
- Nếu connected === false trong > 3s, hiển thị banner "Mất kết nối real-time,
  đang kết nối lại..." ở top của GroupDetail (sticky).
- Khi reconnect thành công, refetch tất cả group queries 1 lần để sync state
  mà có thể đã miss trong downtime.
- Tests: 2 cases (disconnect shows banner, reconnect refetches).

### Task 8: E2E test (Playwright, nếu đã setup)
- File: apps/web/tests/e2e/happy-path/web-user/group-realtime.spec.ts
- Scenario: 2 browser contexts (leader + member), leader post announcement,
  member thấy trong < 2s.
- Skip task này nếu Playwright chưa setup (xem PLAYWRIGHT_CODE_CONVENTIONS.md).

### Task 9: Full regression + i18n
- Thêm i18n keys:
  - `group.realtime.disconnected`: "Mất kết nối real-time, đang kết nối lại..."
  - `group.realtime.removedFromGroup`: "Bạn đã bị xóa khỏi nhóm này."
  - (vi + en)
- Chạy:
  - `cd apps/web && npx vitest run` — FE unit
  - `cd apps/web && npm run validate:i18n` — phải 0 missing keys
  - `cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**"` — BE
- Baseline trước task: ghi số test hiện tại. Sau task: phải >= baseline + số
  test mới thêm (khoảng +15-20).

## Edge cases BẮT BUỘC handle

1. **User subscribe topic của group không phải member**: BE reject, FE không 
   crash. Test case riêng.
2. **2 tab cùng user**: cả 2 đều nhận message, TanStack Query invalidate 
   cùng lúc → OK vì dedupe tự nhiên.
3. **Leader remove chính mình**: edge case, chuyển leadership trước (hoặc 
   reject nếu chưa có co-leader). KHÔNG thuộc scope task này nếu chưa có 
   business rule — TẠO TODO riêng nếu gặp.
4. **Group bị admin lock giữa session**: broadcast GROUP_LOCKED signal 
   trên topic `/topic/group/{id}/system` → FE hiển thị modal đọc-only. 
   Có thể đẩy sang task sau nếu scope lớn.
5. **Broadcast queue khi user offline**: STOMP không có replay offline — 
   chấp nhận behavior "FE refetch khi reconnect lấy state mới" thay vì 
   replay. Đã handled trong Task 7.
6. **Rate limit**: nếu 1 leader spam announcement 10 lần/giây, không flood 
   WS. Leverage WebSocketRateLimitInterceptor hiện có, adjust threshold 
   cho message send channel nếu cần.

## Quy trình theo CLAUDE.md (BẮT BUỘC)

1. Đọc TODO.md trước tiên — có task dở không?
2. Ghi 9 tasks trên vào TODO.md với format [ ]/[x]/[!].
3. Từng task: code → Tầng 1 test → commit.
4. Sau mỗi task: check "file nhạy cảm" (xem CLAUDE.md §Known Issues) — 
   nếu chạm file nhạy cảm → Tầng 3 full regression ngay lập tức.
5. Cuối cùng: full regression phải pass trước khi coi là DONE.

## DECISIONS.md entry cần thêm sau khi xong

```markdown
## YYYY-MM-DD — WebSocket real-time cho Church Group

- Quyết định: Leverage STOMP infra có sẵn (dùng cho multiplayer rooms) để 
  broadcast 3 loại event nhóm: announcements, members, leaderboard-signal.
- Lý do: ROI cao, 0 dependency mới, 0 migration. Retention hook: member 
  thấy announcement/leaderboard update sống động.
- Topic namespace: /topic/group/{groupId}/{announcements|members|leaderboard}.
- Security: inbound channel interceptor verify user là member trước khi 
  cho SUBSCRIBE. Non-member subscribe bị reject.
- Leaderboard broadcast dùng "signal" pattern (payload chỉ có groupId) 
  thay vì full payload — FE refetch endpoint leaderboard → tránh N+1 và 
  payload lớn.
- Offline behavior: STOMP không replay missed messages. FE refetch tất cả 
  group queries khi reconnect để sync state.
- Trade-off: 2 tab cùng user sẽ nhận message 2 lần → TanStack Query dedupe 
  tự nhiên, acceptable.
- KHÔNG thay đổi khi refactor trừ khi chuyển sang platform khác (SSE, 
  WebRTC, etc.).
```

## Acceptance criteria

1. Manual test 5 scenario ở phần "Acceptance tests" của prompt.md pass.
2. Tất cả BE + FE tests pass (full regression).
3. Test count >= baseline + 15 (tối thiểu 15 cases mới từ 9 tasks trên).
4. i18n validator 0 missing keys.
5. Không có dependency mới trong pom.xml hoặc package.json.
6. Không có migration mới (V31, V32...).
7. Không có @SuppressWarnings mới.
8. GroupDetail.tsx tăng < 100 LOC (nếu vượt, tách ra hooks).

## Output expected từ Claude Code

Sau khi hoàn thành, gửi report ngắn (< 400 từ):
- Files thay đổi (BE + FE count).
- Test count before/after.
- Edge case nào phát hiện thêm không trong 6 case trên?
- Commit messages đã follow pattern "feat(group): ..." chưa?
- Có blocker nào phải skip task không (Task 4 leaderboard hook có thể tricky)?
```

---

## Ghi chú thêm (cho bạn khi đọc lại)

- Prompt này đặt scope **rõ ràng tối thiểu** cho Phase 1. KHÔNG kết hợp
  Phase 2 (reactions) hay Phase 3 (push notification) vào đây.
- Nếu Claude Code hỏi "có nên thêm reactions không khi đang làm WS" → 
  **trả lời KHÔNG**, stay scope. Reactions là task riêng.
- Nếu quá trình làm phát hiện entity cần thay đổi (migration mới), DỪNG 
  và review với product owner trước — có thể có giải pháp không cần DB.
- Thời gian ước tính 2-3 ngày làm việc tập trung. Nếu quá 4 ngày → 
  scope cut Task 4 hoặc Task 7.
