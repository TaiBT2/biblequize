# BibleQuiz — Prompt tiếp tục phát triển
> Dựa trên PROJECT_STATUS.md + CODEBASE_SCAN.md ngày 2026-03-28
> Copy từng block prompt vào Claude Code theo thứ tự

---

## BLOCK 1 — Dọn dẹp dead code (làm trước tiên)

```
Đọc CLAUDE.md trước.

Thực hiện các thay đổi sau, theo thứ tự:

### Bước 1: Xóa dead infrastructure classes (0 references, an toàn xóa)
Xóa các file sau:
- apps/api/src/main/java/com/biblequiz/infrastructure/circuit/CircuitBreakerService.java
- apps/api/src/main/java/com/biblequiz/infrastructure/consistency/DistributedTransactionManager.java
- apps/api/src/main/java/com/biblequiz/infrastructure/consistency/EventSourcingService.java
- apps/api/src/main/java/com/biblequiz/infrastructure/service/InterServiceCommunicationService.java
- apps/api/src/main/java/com/biblequiz/infrastructure/service/PerformanceMonitoringService.java
- apps/api/src/main/java/com/biblequiz/modules/business/BusinessRulesEngine.java

Sau mỗi xóa: chạy ./mvnw compile để đảm bảo không có compile error.

### Bước 2: Fix ServiceRegistry trong health response
File: infrastructure/discovery/ServiceRegistry.java
Vấn đề: HealthCheckController đang show serviceRegistry: {status: DOWN} gây nhầm lẫn.
Cách fix: Remove serviceRegistry khỏi health response, 
hoặc nếu ServiceRegistry không dùng ở đâu khác thì xóa luôn.

### Bước 3: Verify
- ./mvnw compile → phải pass
- ./mvnw test -Dtest="com.biblequiz.api.**" → phải pass
- Ghi vào DECISIONS.md: lý do xóa các class trên

Báo cáo: bao nhiêu lines đã xóa, compile có pass không.
```

---

## BLOCK 2 — Fix 3 placeholder methods (critical)

```
Đọc CLAUDE.md trước.

Fix 3 placeholder methods đang trả hardcode values:

### Fix 1: ChurchGroupService.getLeaderboard() — score luôn = 0
File: apps/api/src/main/java/com/biblequiz/modules/group/service/ChurchGroupService.java
Line: 158-160

Yêu cầu:
- Query UserDailyProgress theo userId để lấy điểm thật
- period = "weekly" → sum pointsCounted 7 ngày gần nhất
- period = "all_time" → lấy User.totalPoints
- period = "daily" → lấy UserDailyProgress.pointsCounted ngày hôm nay
- questionsAnswered = questionsCounted từ UserDailyProgress

### Fix 2: ChurchGroupService.getAnalytics() — activeToday luôn = 0
File: cùng file trên
Line: 177-178

Yêu cầu:
- activeToday = count GroupMembers có UserDailyProgress record 
  với date = today và questionsCounted > 0
- Dùng @Query JPQL hoặc native query

### Fix 3: ShareCardService — imageUrl trỏ endpoint không tồn tại
File: apps/api/src/main/java/com/biblequiz/modules/share/service/ShareCardService.java
Line: 33, 48

Yêu cầu:
- Implement GET /api/share/images/session/{id} endpoint
- Approach: client-side rendering
  + Endpoint trả về HTML template với data được inject
  + Frontend dùng html-to-image để render PNG từ template đó
  + KHÔNG dùng Puppeteer (quá nặng cho solo maintainer)
- imageUrl phải trỏ đến endpoint thật và accessible
- Trả đúng Content-Type header

Sau mỗi fix:
- Chạy test liên quan
- Nếu chưa có test → viết test mới
- Đảm bảo pass trước khi chuyển sang fix tiếp theo
```

---

## BLOCK 3 — Hoàn thiện Church Group (backend)

```
Đọc CLAUDE.md trước.

Implement các endpoint Church Group còn thiếu:

### 1. PATCH /groups/{id} — Update group info
- Chỉ leader mới được update
- Cho phép đổi: name, description, isPublic, maxMembers
- Validate: maxMembers không nhỏ hơn memberCount hiện tại

### 2. DELETE /groups/{id} — Xóa group
- Chỉ leader mới được xóa
- Soft delete: set deletedAt timestamp
- Cascade: remove tất cả GroupMember records
- Không xóa quiz sets (keep for history)

### 3. DELETE /groups/{id}/members/{userId} — Kick member
- Chỉ leader/mod mới được kick
- Không thể kick chính mình
- Không thể kick leader khác
- Broadcast notification cho member bị kick

### 4. POST /groups/{id}/announcements — Tạo thông báo
Request: { content: string }
- Chỉ leader/mod mới được tạo
- Lưu vào group_announcements table
- Max 500 ký tự

### 5. GET /groups/{id}/announcements — Lấy danh sách thông báo
- Pagination: limit=20, cursor-based
- Sort: mới nhất trước
- Tất cả member đều xem được

Với mỗi endpoint:
- Viết test trước (TDD)
- Implement
- Chạy test pass
- Cập nhật TODO.md
```

---

## BLOCK 4 — Các endpoint nhỏ còn thiếu

```
Đọc CLAUDE.md trước.

Implement các endpoint nhỏ còn thiếu theo thứ tự:

### 1. POST /sessions/{id}/retry
- Tạo session mới với config giống session gốc
- Session gốc phải thuộc user đang request (check ownership)
- Trả về { newSessionId }
- Test: TC-PRAC-003

### 2. POST /rooms/{id}/kick
- Host kick player ra khỏi room
- Chỉ hoạt động khi room đang ở trạng thái lobby
- Player bị kick không thể rejoin (lưu vào blacklist của room)
- Trả 403 nếu không phải host
- Test: TC-ROOM-005

### 3. GET /me/history
- Lấy lịch sử các QuizSession của user
- Pagination: limit=20, cursor-based
- Include: mode, score, questionsTotal, questionsCorrect, createdAt
- Sort: mới nhất trước

### 4. GET /admin/coverage
- Trả về pool size per book per difficulty
- Format:
  {
    books: [{
      book: "Genesis",
      easy: 45,
      medium: 30, 
      hard: 12,
      meetsMinimum: true,
      isActiveInRanked: true
    }]
  }
- meetsMinimum: easy>=30, medium>=20, hard>=10

Với mỗi endpoint:
- Viết test trước
- Implement
- Chạy test pass
- Cập nhật TODO.md
```

---

## BLOCK 5 — Frontend: Church Group pages

```
Đọc CLAUDE.md trước.

Tạo đầy đủ UI cho Church Group feature.
Backend API đã hoàn chỉnh, chỉ cần implement frontend.

### Pages cần tạo:

#### 1. /groups — Trang danh sách group của user
- Hiển thị các group user đang là thành viên
- Button "Tạo nhóm mới" → modal tạo group
- Button "Tham gia nhóm" → modal nhập code
- Mỗi group card: tên, số thành viên, role của user, weekly points

#### 2. /groups/{id} — Trang group detail
- Header: tên group, avatar, mô tả, số thành viên
- Tabs:
  + Leaderboard (weekly/all-time toggle)
  + Thành viên (list, search)
  + Thông báo (announcements)
  + Quiz Sets (nếu là leader)
- Leaderboard: rank, avatar, tên, điểm, badge tier

#### 3. /groups/{id}/analytics — Trang analytics (chỉ leader)
- Cards: tổng thành viên, hoạt động hôm nay, điểm tuần này
- Bảng thành viên: tên, câu hỏi hôm nay, điểm tuần, last active

#### 4. Modals cần có:
- CreateGroupModal: name, description, isPublic toggle
- JoinGroupModal: nhập code 6 ký tự
- CreateAnnouncementModal: textarea content

### Quy tắc UI:
- Dùng TanStack Query cho tất cả API calls
- Dùng Zustand nếu cần global state
- Loading skeleton khi fetch
- Error state với retry button
- Responsive (mobile-first)
- Style nhất quán với các trang hiện có

Sau khi xong: chạy npm test, kiểm tra không có TypeScript error.
```

---

## BLOCK 6 — Frontend: Tournament pages

```
Đọc CLAUDE.md trước.

Tạo đầy đủ UI cho Tournament feature.
Backend API đã hoàn chỉnh.

### Pages cần tạo:

#### 1. /tournaments — Trang danh sách tournament
- Tab: Đang diễn ra / Sắp diễn ra / Đã kết thúc
- Mỗi tournament card: tên, số người, trạng thái, host
- Button "Tạo tournament" (cho room host)

#### 2. /tournaments/{id} — Trang tournament detail
- Header: tên, trạng thái, số người tham gia
- Bracket view:
  + Hiển thị dạng cây elimination bracket
  + Mỗi match: tên 2 player, lives còn lại, kết quả
  + Match đang diễn ra: highlight
  + Match đã xong: hiển thị winner rõ ràng
- Button "Tham gia" (nếu đang lobby)
- Button "Bắt đầu" (nếu là host và đủ người)

#### 3. /tournaments/{id}/match/{matchId} — Màn chơi tournament
- Giống Room quiz nhưng thêm:
  + Hiển thị lives của 2 player real-time
  + Lives mất khi sai (animation)
  + Sudden death indicator
- Kết thúc: winner announcement overlay

### Bracket component:
- Dùng thuần CSS/SVG để vẽ bracket
- Không dùng thư viện ngoài (giữ bundle nhỏ)
- Responsive: horizontal scroll trên mobile

Sau khi xong: npm test, kiểm tra TypeScript.
```

---

## BLOCK 7 — Frontend: UI còn thiếu (Streak, Tier, Daily)

```
Đọc CLAUDE.md trước.

Hoàn thiện các UI component còn thiếu hoặc incomplete:

### 1. Streak UI — hiển thị rõ hơn
Vị trí: Header hoặc Profile page
- Streak count với icon lửa 🔥
- Tooltip: "X ngày liên tiếp"
- Nếu streak = 0: hiển thị "Bắt đầu streak hôm nay"
- Badge streak (7/30/100 ngày) nếu đã đạt

### 2. Tier progress bar — trong Profile page
Hiện tại: chỉ hiển thị tên tier
Cần thêm:
- Progress bar: điểm hiện tại / điểm cần để lên tier tiếp
- Text: "Còn X điểm nữa để đạt [tier name]"
- Màu sắc theo tier (xám/xanh/tím/vàng/đỏ)
- Animation khi tier up

### 3. Daily Challenge — complete flow
Vấn đề hiện tại: FE có page nhưng chưa có complete flow

Cần implement:
- Màn kết quả sau khi hoàn thành 5 câu:
  + Score: X/5 câu đúng
  + "Bạn giỏi hơn Y% người chơi hôm nay"
  + Share button → trigger html-to-image tạo share card
  + Leaderboard daily ngay bên dưới
- Nếu đã chơi hôm nay: hiển thị kết quả cũ + countdown đến ngày mai

### 4. Share Card — frontend render
Vì backend trả HTML template (theo BLOCK 2):
- Implement ShareCard component
- Dùng html-to-image để export PNG
- Share button: Web Share API (mobile) hoặc download PNG (desktop)

Sau khi xong: npm test, kiểm tra TypeScript.
```

---

## BLOCK 8 — Content: Seed câu hỏi

```
Đọc CLAUDE.md trước.

Tạo seed data câu hỏi ban đầu cho app.
Đây là bước quan trọng nhất trước khi deploy — app không dùng được nếu không có câu hỏi.

### Yêu cầu:
- Tổng: 500+ câu hỏi
- Cover 7 sách ưu tiên: Genesis, Exodus, Psalms, Matthew, John, Romans, Revelation
- Mỗi sách: ≥30 easy, ≥20 medium, ≥10 hard (đủ minimum pool cho Ranked mode)
- Ngôn ngữ: tiếng Việt
- Nguồn trích dẫn: Bản Truyền Thống 1926 (public domain)
- Mọi câu phải có explanation trích dẫn câu Kinh Thánh cụ thể

### Format mỗi câu (insert SQL):
INSERT INTO questions (
  id, book, chapter, verse_start, verse_end,
  difficulty, type, language, content, options,
  correct_answer, explanation, source, is_active,
  created_at, updated_at
) VALUES (
  UUID(), 'Genesis', 1, 1, 3,
  'easy', 'multiple_choice_single', 'vi',
  'Trong Sáng Thế Ký 1:1, Đức Chúa Trời đã làm gì đầu tiên?',
  '["Dựng nên trời và đất","Dựng nên con người","Tạo ra ánh sáng","Lập giao ước"]',
  '0',
  'Sáng Thế Ký 1:1 chép: "Ban đầu Đức Chúa Trời dựng nên trời đất"',
  'Kinh Thánh Bản Truyền Thống 1926',
  true, NOW(), NOW()
);

### Tạo các file:
scripts/seed/01_genesis.sql      — 70 câu
scripts/seed/02_exodus.sql       — 60 câu
scripts/seed/03_psalms.sql       — 60 câu
scripts/seed/04_matthew.sql      — 80 câu
scripts/seed/05_john.sql         — 80 câu
scripts/seed/06_romans.sql       — 60 câu
scripts/seed/07_revelation.sql   — 60 câu
scripts/seed/00_books.sql        — insert book records nếu chưa có

### Sau khi tạo xong:
1. Chạy scripts để import vào local DB
2. GET /admin/coverage → verify mỗi sách đủ minimum pool
3. Tạo 1 session practice thử để verify câu hỏi load được
4. Báo cáo: tổng câu đã import, coverage per book
```

---

## BLOCK 9 — Notification system (v1.5)

```
Đọc CLAUDE.md trước.

Implement Notification system từ đầu.
Đây là feature v1.5, làm sau khi BLOCK 1-8 đã xong.

### Bước 1: Database migration
Tạo V13__notifications.sql:
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL, 
  -- types: tier_up, streak_warning, friend_overtake, 
  --        group_invite, tournament_start, daily_reminder
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at);

### Bước 2: Backend
- NotificationEntity, NotificationRepository
- NotificationService:
  + createNotification(userId, type, title, body, metadata)
  + markAsRead(notificationId, userId)
  + markAllAsRead(userId)
  + getUnread(userId): List
- NotificationController:
  + GET /notifications?unread=true&limit=20
  + PATCH /notifications/{id}/read
  + PATCH /notifications/read-all
- Tự động tạo notification khi:
  + User lên tier → gọi từ ScoringService
  + Streak sắp gãy (cron mỗi giờ check user chưa chơi)
  + Daily challenge reminder (cron 8 giờ sáng)

### Bước 3: Frontend
- Notification bell icon ở header với badge count
- Dropdown panel khi click:
  + List notifications, mới nhất trước
  + Click → mark as read + navigate đến relevant page
  + "Đánh dấu tất cả đã đọc" button
- Real-time: poll mỗi 30s (không cần WebSocket cho notification)

### Test:
- Unit: NotificationService.createNotification()
- Integration: GET /notifications trả đúng data
- Integration: mark as read → unread count giảm

Cập nhật TODO.md sau khi xong.
```

---

## BLOCK 10 — Pre-deploy checklist

```
Đọc CLAUDE.md, TODO.md, DECISIONS.md trước.

Chạy full pre-deploy checklist:

### 1. Security scan
- Kiểm tra tất cả /admin/** endpoint có @PreAuthorize chưa:
  grep -r "RequestMapping.*admin\|GetMapping.*admin\|PostMapping.*admin" \
  apps/api/src/main/java --include="*.java" -l
  
  Với mỗi file tìm được → verify có @PreAuthorize("hasRole('ADMIN')")

- Kiểm tra không có hardcoded secrets:
  grep -r "password\|secret\|api.key\|apikey" \
  apps/api/src/main/java --include="*.java" | grep -v "//\|test\|Test"

### 2. Full test suite
- ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**"
- cd apps/web && npm test
- npx playwright test (cần app đang chạy)

### 3. DB migration clean run
- Drop và recreate local DB
- docker compose down -v && docker compose up -d mysql redis
- ./mvnw flyway:migrate
- Verify tất cả 13 migration chạy không lỗi

### 4. Build production
- cd apps/api && ./mvnw clean package -DskipTests
- cd apps/web && npm run build
- Verify không có TypeScript error, không có Java compile warning

### 5. Smoke test
- Start app: docker compose up -d
- POST /auth/login → nhận token
- POST /sessions (practice mode) → tạo session
- GET /daily-challenge → nhận 5 câu
- GET /leaderboard/daily → nhận data
- GET /health → status UP

### 6. Update documentation
- README.md: cập nhật feature list
- LOCAL_DEV.md: cập nhật nếu có thay đổi setup
- SPEC-v2.md: đánh dấu những gì đã implement

Báo cáo kết quả từng bước, dừng lại nếu có bước nào fail.
```

---

## Thứ tự chạy các BLOCK

```
BLOCK 1  →  BLOCK 2  →  BLOCK 3  →  BLOCK 4
(Dọn dẹp)  (Fix stub)  (Group BE)  (Endpoint nhỏ)
    ↓
BLOCK 5  →  BLOCK 6  →  BLOCK 7
(Group FE)  (Tourn FE)  (UI fixes)
    ↓
BLOCK 8          →       BLOCK 9      →    BLOCK 10
(Seed content)      (Notification)      (Pre-deploy)
```

**Ghi chú:**
- Mỗi BLOCK chạy độc lập — nếu BLOCK fail thì fix trước khi chạy BLOCK tiếp theo
- Sau mỗi BLOCK: cập nhật TODO.md
- Sau mỗi BLOCK có thay đổi design: ghi vào DECISIONS.md
- BLOCK 8 (seed content) có thể chạy song song với BLOCK 5-7 vì không đụng code
