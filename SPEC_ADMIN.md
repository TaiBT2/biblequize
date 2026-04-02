# BibleQuiz Admin — Spec Tính Năng
> Version: 1.0
> Date: 2026-04-02
> Bổ sung cho SPEC-v2.md — tập trung chi tiết admin section

---

## Mục lục
1. Tổng quan & vai trò
2. Admin Dashboard
3. Quản lý người dùng
4. Quản lý câu hỏi
5. AI Question Generator
6. Review Queue
7. Feedback & Moderation
8. Seasons & Rankings
9. Events & Tournaments
10. Church Groups Admin
11. Notifications
12. Configuration
13. Export Center
14. Question Quality
15. Audit Log
16. Bảng tổng hợp API
17. Bảng tổng hợp Pages

---

## 1. Tổng quan & vai trò

### 1.1 Mục đích
Admin panel cho phép quản trị viên điều hành toàn bộ hệ thống BibleQuiz: nội dung câu hỏi, người dùng, nhóm hội thánh, giải đấu, thông báo, cấu hình game, và theo dõi chất lượng.

### 1.2 Vai trò admin

| Vai trò | Quyền | Truy cập |
|---------|-------|----------|
| **Admin** | Toàn quyền | Tất cả 13 trang admin |
| **Content Moderator** | Duyệt câu hỏi + xem feedback | Dashboard (read-only), Review Queue, Feedback (read-only) |

### 1.3 Truy cập admin
- URL: `/admin` (trang Dashboard mặc định)
- Guard: `RequireAdmin` — redirect về `/` nếu không phải admin/content_mod
- Entry point: nút "Admin Panel" trong sidebar AppLayout (chỉ hiện cho admin/content_mod)
- Content mod thấy nút "Moderation" thay vì "Admin Panel"

### 1.4 Admin Layout
- Sidebar trái (240px): 13 nav items + link "Về trang chính" + user info
- Top bar: page title + search + notification bell + avatar dropdown
- Content area: scrollable, full-width cho tables
- Responsive: tablet → sidebar icons only, mobile → hamburger menu

---

## 2. Admin Dashboard

> Trang mặc định `/admin`. Tổng quan toàn hệ thống.

### 2.1 KPI Cards (2 rows × 4)

| Card | Dữ liệu | Nguồn |
|------|----------|-------|
| Người dùng | Total + active today + new this week | User table count |
| Sessions hôm nay | Count + avg per user | QuizSession table |
| Câu hỏi | Total active + pending review | Question table |
| AI hôm nay | Quota used/200 + cost/$10 | AIGenerationJob table |
| Feedback | Open count | Feedback table |
| Coverage | Books with min pool / 66 | Question per book count |
| Season | Current name + days remaining | Season table |
| Streak avg | Average streak all active users | User table |

### 2.2 Coverage Map
- 66 sách Kinh Thánh, grouped Old Testament / New Testament
- Mỗi sách: bar chart (Easy/Medium/Hard vs minimum pool)
- Color: green (đủ), yellow (gần đủ), red (thiếu)

### 2.3 Action Items
- Danh sách items cần xử lý: feedback mở, câu chờ duyệt, groups bị report, users bị flag
- Click → navigate tới page tương ứng

### 2.4 Recent Activity
- 10 dòng audit log gần nhất (admin actions)

### 2.5 Charts
- Sessions 7 ngày: line chart
- User registrations 30 ngày: bar chart

### API
```
GET /api/admin/dashboard → { users, questions, sessions, ai, feedback, coverage, seasons }
```

---

## 3. Quản lý người dùng

> Page: `/admin/users`

### 3.1 Danh sách users
- Table: avatar, tên, email, role, tier, streak, last active, actions
- Search: theo tên hoặc email (debounce 300ms)
- Filter: role (All/Admin/User/Group Leader/Content Mod), status (All/Active/Banned)
- Pagination: 20 users/page, cursor-based
- Export CSV button

### 3.2 User Detail Modal
Click user → modal hiện:

**Thông tin:**
- Avatar + name + email + role badge + tier badge
- Stats: tổng điểm, streak, số phiên, độ chính xác, ngày gia nhập
- Tabs: Sessions (mode + book + score + accuracy + date), Achievements (badge grid), Groups (group + role)

**Admin actions:**
- Thay đổi role: dropdown → "Lưu thay đổi" (chỉ hiện khi khác current)
- Warning khi promote Admin: "Quyền admin cho phép truy cập toàn bộ hệ thống"
- Khóa tài khoản: toggle + lý do bắt buộc (min 10 ký tự)
- Nút BAN disabled khi lý do trống
- Confirmation popup trước khi ban
- Ban history: danh sách vi phạm trước đó

**Banned user:**
- Red banner top modal: "🔒 Tài khoản đã bị khóa — Lý do: ..."
- Avatar border đỏ
- "Mở khóa" button

### 3.3 Quy tắc
- Admin không thể tự ban chính mình
- Admin không thể hạ role admin khác (chỉ super admin)
- Mọi action ghi audit log

### API
```
GET    /api/admin/users              → paginated list, filters
GET    /api/admin/users/{id}         → detail + stats
PATCH  /api/admin/users/{id}/role    → { role }
PATCH  /api/admin/users/{id}/ban     → { banned: true/false, reason? }
GET    /api/admin/users/{id}/sessions    → recent sessions
GET    /api/admin/users/{id}/achievements → badges
```

---

## 4. Quản lý câu hỏi

> Page: `/admin/questions`

### 4.1 Danh sách câu hỏi
- Table: checkbox, ID, content (truncated 60 chars), book, chapter, difficulty, type, quality score, times used, status, actions
- Filters: book, difficulty (Easy/Medium/Hard), type (MCQ/True-False/Fill-in), status (Active/Inactive/Pending), search text
- Bulk actions: xóa, đổi difficulty, toggle active
- Pagination: 20/page

### 4.2 CRUD
- **Create**: form modal — book, chapter, verse range, difficulty, type, content, 4 options, correct answer, explanation (bắt buộc), context note, tags
- **Edit**: same form, pre-filled
- **Delete**: confirm modal, soft delete
- **Duplicate**: copy câu hỏi → edit

### 4.3 Import
- Format: CSV hoặc JSON
- Drag & drop upload
- Dry-run trước (default ON): preview + validation errors highlight
- Confirm: import X câu hỏi

### 4.4 Coverage Map
- Panel bên phải (collapsible): bar chart per book
- Click book → filter table theo book đó
- Color: green (đủ min pool), red (thiếu)

### 4.5 Quality Score
- 0-100, tính từ: accuracy rate, user feedback ratings, report count
- Color: green >70, yellow 40-70, red <40

### API
```
GET    /api/admin/questions          → paginated, filterable
POST   /api/admin/questions          → create
PUT    /api/admin/questions/{id}     → update
DELETE /api/admin/questions/{id}     → soft delete
POST   /api/admin/questions/import   → { file, format, dryRun }
GET    /api/admin/questions/coverage → per book per difficulty counts
```

---

## 5. AI Question Generator

> Page: `/admin/ai-generator`

### 5.1 Configuration
- Scripture selector: book → chapter range → verse range (optional)
- Model: Gemini hoặc Claude (tab selector)
- Difficulty: Easy/Medium/Hard/Mixed
- Question type: MCQ/True-False/Mixed
- Count: 1-20 (default 10)
- Language: Tiếng Việt (default), English

### 5.2 Quota & Cost
- Daily quota: 200 câu/admin
- Cost alert: $10/ngày
- Hiển thị: "45/200 câu hôm nay" + "$3.42/$10.00"
- Generate disabled khi vượt quota
- Warning khi cost > $8

### 5.3 Draft Management
- Generate → danh sách drafts
- Mỗi draft: preview, difficulty/type badge, validation status (✅ Valid / ❌ Invalid + error)
- Inline edit: click draft → mở editor → sửa content, options, answer, explanation
- Approve: duyệt đưa vào question pool (createdBy="ai-generated", reviewedBy=adminId)
- Bulk: "Duyệt tất cả hợp lệ" + "Xóa tất cả"

### 5.4 Validation tự động
- Format check: đủ fields, correctAnswer hợp lệ
- Explanation check: có trích dẫn Kinh Thánh
- Duplicate check: so sánh content với existing questions

### API
```
POST   /api/admin/ai/generate       → { scripture, model, count, difficulty, type, language }
GET    /api/admin/ai/info            → { models, quotaToday, costToday }
GET    /api/admin/ai/jobs/{id}       → { status, drafts[], costUSD }
POST   /api/admin/ai/drafts/{id}/approve → { questionId }
PUT    /api/admin/ai/drafts/{id}     → update draft
DELETE /api/admin/ai/drafts/{id}     → delete draft
```

---

## 6. Review Queue

> Page: `/admin/review-queue`

### 6.1 Quy trình duyệt
- Câu hỏi mới (AI generated hoặc imported) → status "pending"
- Cần **2 admin duyệt** → status "approved" → active
- 1 admin reject → status "rejected"
- Admin có thể sửa trước khi duyệt

### 6.2 Giao diện
- Stats pills: chờ duyệt (yellow), đã duyệt hôm nay (green), đã từ chối (red)
- Queue cards: question ID, difficulty badge, book reference, full question text, options (correct highlighted), explanation, source
- Approval progress: "1/2 đã duyệt (Admin B)"
- Actions: Duyệt (green), Sửa trước duyệt (outline), Từ chối + lý do (red)
- Filters: sort (cũ nhất/mới nhất/AI/imported), filter by book

### 6.3 Quy tắc
- Admin không duyệt câu mình tạo (nếu AI generated by chính mình → cần admin khác)
- Reject phải có lý do (min 10 ký tự)
- Mọi action ghi audit log

### API
```
GET    /api/admin/review/pending         → list pending questions
POST   /api/admin/review/{id}/approve    → approve
POST   /api/admin/review/{id}/reject     → { reason }
GET    /api/admin/review/stats           → counts
```

---

## 7. Feedback & Moderation

> Page: `/admin/feedback`

### 7.1 Feedback types

| Type | Mô tả | Ví dụ |
|------|--------|-------|
| report | Báo cáo nội dung | "Câu hỏi này sai" |
| question | Hỏi về câu hỏi | "Giải thích chưa rõ" |
| general | Góp ý chung | "Thêm chế độ chơi mới" |
| content_error | Lỗi nội dung | "Sai chapter reference" |

### 7.2 Status flow
```
open → in_review → resolved
                 → dismissed
```

### 7.3 Giao diện
- Stats cards: Open (red), In Review (yellow), Resolved this week (green), Dismissed (gray)
- Table: user, type badge, content preview, linked question, status, date, actions
- Detail modal: full content, linked question, admin notes (textarea + save), status buttons, change history

### 7.4 Content Moderation Queue (mở rộng)
- Feedback có nội dung không phù hợp → flag
- Group announcements cần moderate → flag
- Admin review + dismiss hoặc take action

### API
```
GET    /api/admin/feedback           → paginated, filter by type + status
PATCH  /api/admin/feedback/{id}      → { status, note? }
```

---

## 8. Seasons & Rankings

> Page: `/admin/rankings`

### 8.1 Season Management
- Danh sách seasons: name, status (upcoming/active/ended), dates, participants
- Create season: name, description, start date, end date
- Validation: không overlap với season khác
- End season sớm: confirm → trigger badge distribution cho top 3 mỗi tier
- Active season detail: participants, avg score, tier distribution, top 10

### 8.2 Season Config
- Duration: 3 tháng (configurable)
- Badge format: "Sứ Đồ Mùa [N] 🏆" cho top 3
- Auto-create next season: toggle

### 8.3 Leaderboard Controls
- Manual recompute: trigger Redis ZSET recalculation
- Health check: phát hiện stale entries
- Last recompute timestamp

### API
```
GET    /api/admin/seasons              → list all
POST   /api/admin/seasons              → create { name, startAt, endAt }
PATCH  /api/admin/seasons/{id}         → update
POST   /api/admin/seasons/{id}/end     → force end + distribute badges
GET    /api/admin/seasons/{id}/stats   → { participants, avgScore, tierDistribution, top10 }
POST   /api/admin/leaderboard/reset    → manual recompute
```

---

## 9. Events & Tournaments

> Page: `/admin/events`

### 9.1 Tournament Management
- Danh sách: name, status, group (if any), players, rounds, winner, dates
- Filters: status (All/Lobby/In Progress/Completed/Cancelled), group, date range
- Detail: bracket (read-only), participants + seeds, match details (all answers + timing)

### 9.2 Admin Actions
- Cancel tournament: input reason → notify participants
- Force end: emergency — auto-determine winner dựa trên current bracket state
- DQ player: disqualify → auto-advance opponent
- Delete: chỉ cho cancelled tournaments

### 9.3 Stats
- Active tournaments count
- Avg participants per tournament
- Most active groups (tournament count)
- Recent completions

### API
```
GET    /api/admin/tournaments             → list all
GET    /api/admin/tournaments/{id}        → detail + participants + matches
PATCH  /api/admin/tournaments/{id}        → update
DELETE /api/admin/tournaments/{id}        → cancel with reason
POST   /api/admin/tournaments/{id}/force-end → emergency end
GET    /api/admin/tournaments/stats       → global stats
```

---

## 10. Church Groups Admin

> Page: `/admin/groups`

### 10.1 Tại sao cần admin quản lý groups?
Church Group là differentiator chính của BibleQuiz. Groups phát triển tự nhiên (mục sư mời cả nhóm) nhưng cần admin can thiệp khi: group vi phạm, leader inactive, nội dung không phù hợp, conflicts giữa members.

### 10.2 Danh sách groups
- Table: avatar, name, leader, members (X/200), weekly points, status, created, actions
- Filters: status (All/Active/Inactive/Locked), size range, public/private

### 10.3 Flagged Groups (priority section)
- Groups bị report bởi users
- Report reason + reporter info
- Quick actions: dismiss report, lock group, contact leader (email)

### 10.4 Group Detail
- Header: avatar + name + description + leader info
- Stats: members, weekly activity, avg accuracy, group streak
- Tabs:
  - Members: table (name, role, activity, last active)
  - Analytics: charts (same as GroupAnalytics user page)
  - Announcements: list, admin có thể xóa nội dung không phù hợp
  - Quiz Sets: list, admin có thể review/delete

### 10.5 Admin Actions
- Lock group: input reason → notification gửi đến leader → members thấy "Nhóm đang bị khóa"
- Unlock group: remove lock
- Transfer leadership: chọn member khác làm leader
- Delete group: soft delete + reason + notify leader
- Adjust max members: override default 200

### 10.6 Group States

| Status | Điều kiện | Hiển thị |
|--------|-----------|----------|
| Active | Có activity trong 30 ngày | Green dot |
| Inactive | Không activity > 30 ngày | Yellow dot + "Không hoạt động" |
| Locked | Admin khóa | Red dot + "🔒 Đã khóa" + reason |

### API
```
GET    /api/admin/groups                     → paginated, filters
GET    /api/admin/groups/{id}                → detail + members + stats
PATCH  /api/admin/groups/{id}/lock           → { locked: true, reason }
PATCH  /api/admin/groups/{id}/unlock         → unlock
DELETE /api/admin/groups/{id}                → soft delete with reason
PATCH  /api/admin/groups/{id}/transfer-leader → { newLeaderId }
GET    /api/admin/groups/flagged             → reported groups
GET    /api/admin/groups/stats               → global stats
```

---

## 11. Notifications

> Page: `/admin/notifications`

### 11.1 Broadcast
- Compose: title, content, target audience, schedule
- Target audience:
  - Tất cả users
  - Theo tier (multi-select: Tân Tín Hữu, Người Tìm Kiếm, ...)
  - Theo role (admin, user, group_leader)
  - Theo group (chọn group cụ thể)
  - Custom list (paste user IDs hoặc emails)
- Schedule: gửi ngay hoặc hẹn giờ (date + time picker)
- Preview: "Sẽ gửi đến ~1,247 người"

### 11.2 Sent History
- Table: title, target, sent to count, opened count (%), date, status
- Status: Sent (green), Scheduled (blue), Failed (red), Draft (gray)
- Click → detail: delivery stats, open rate chart

### 11.3 Automated Notifications
Hệ thống tự động đã có (v1.5), admin quản lý on/off + schedule:

| Notification | Schedule | Default |
|-------------|----------|---------|
| Nhắc streak sắp gãy | Hourly check | ✅ On |
| Nhắc daily challenge | 8:00 AM daily | ✅ On |
| Tóm tắt tuần | Monday 9:00 AM | ❌ Off |
| Welcome new user | On signup | ✅ On |
| Tier up celebration | On tier change | ✅ On |

- Toggle on/off per notification
- Edit schedule (giờ, ngày)
- View last sent stats

### API
```
POST   /api/admin/notifications/broadcast       → { title, content, targetType, targetIds?, scheduledAt? }
GET    /api/admin/notifications/history          → sent list, paginated
GET    /api/admin/notifications/history/{id}/stats → delivery stats
GET    /api/admin/notifications/scheduled        → automated list
PATCH  /api/admin/notifications/scheduled/{id}   → toggle + update schedule
DELETE /api/admin/notifications/broadcast/{id}   → cancel scheduled
```

---

## 12. Configuration

> Page: `/admin/config`

### 12.1 Mục đích
Admin thay đổi game parameters mà không cần redeploy. Thay đổi ảnh hưởng tất cả users ngay lập tức.

### 12.2 Config categories

**Game:**
| Key | Default | Mô tả |
|-----|---------|-------|
| DAILY_ENERGY | 100 | Năng lượng mỗi ngày |
| ENERGY_REGEN_PER_HOUR | 20 | Phục hồi năng lượng/giờ |
| DAILY_QUESTION_CAP | 100 | Giới hạn câu ranked/ngày |
| STREAK_FREEZE_PER_WEEK | 1 | Streak freeze/tuần |

**Scoring:**
| Key | Default | Mô tả |
|-----|---------|-------|
| BASE_POINTS_EASY | 8 | Điểm cơ bản Easy |
| BASE_POINTS_MEDIUM | 12 | Điểm cơ bản Medium |
| BASE_POINTS_HARD | 18 | Điểm cơ bản Hard |
| COMBO_THRESHOLD_1 | 5 | Combo level 1 (x1.2) |
| COMBO_THRESHOLD_2 | 10 | Combo level 2 (x1.5) |
| DAILY_BONUS_MULTIPLIER | 2 | Bonus câu đầu ngày |

**AI:**
| Key | Default | Mô tả |
|-----|---------|-------|
| AI_DAILY_QUOTA | 200 | Câu/ngày/admin |
| AI_COST_ALERT_USD | 10.00 | Alert threshold |
| AI_DEFAULT_MODEL | gemini | Model mặc định |

**Season:**
| Key | Default | Mô tả |
|-----|---------|-------|
| SEASON_DURATION_MONTHS | 3 | Thời gian mỗi mùa |
| AUTO_CREATE_NEXT_SEASON | true | Tự tạo mùa kế |

**Room:**
| Key | Default | Mô tả |
|-----|---------|-------|
| ROOM_MAX_PLAYERS | 20 | Max players/phòng |
| ROOM_CODE_LENGTH | 6 | Độ dài mã phòng |
| ROOM_IDLE_TIMEOUT_MIN | 30 | Timeout phòng không hoạt động |

### 12.3 Giao diện
- Cards per category, collapsible
- Inline edit → "Lưu" button xuất hiện
- Warning banner: "⚠️ Thay đổi ảnh hưởng tất cả người dùng ngay lập tức"
- "Khôi phục mặc định" button (danger, confirm required)
- Change history: ai đổi gì, khi nào

### 12.4 Storage
- Database table `app_config`: key, value, default_value, description, category
- Backend đọc từ DB (có cache, invalidate on update)
- Fallback: nếu key không có trong DB → dùng default

### API
```
GET    /api/admin/config             → all config pairs by category
PATCH  /api/admin/config             → { configs: [{ key, value }] }
POST   /api/admin/config/reset       → reset to defaults
GET    /api/admin/config/history      → change audit log
```

---

## 13. Export Center

> Page: `/admin/export`

### 13.1 Export types

| Type | Format | Filters | Dữ liệu |
|------|--------|---------|----------|
| Câu hỏi | CSV, JSON, Excel | Book, difficulty, status, date | content, options, answer, explanation, stats |
| Người dùng | CSV, Excel | Role, tier, active/inactive | name, email, role, tier, points, streak, join date |
| Bảng xếp hạng | CSV, PDF | Season, period | rank, name, score, tier |
| Groups | CSV, Excel | Specific/all groups | members, activity, analytics |
| Analytics | CSV, JSON | Date range | sessions, user activity, retention |

### 13.2 Quy trình
1. Admin chọn type + format + filters
2. Preview: "~3,420 câu hỏi sẽ được xuất"
3. Click "Xuất" → async job tạo file background
4. Job status: PENDING → PROCESSING → COMPLETED
5. COMPLETED → download link (hết hạn sau 24h)

### 13.3 Export History
- Table: export type, format, records, file size, date, status, download link
- Failed → retry button
- Expired → re-export button

### API
```
POST   /api/admin/export/questions       → { format, filters } → { jobId }
POST   /api/admin/export/users           → { format, filters } → { jobId }
POST   /api/admin/export/leaderboard     → { season?, period, format } → { jobId }
POST   /api/admin/export/groups          → { groupId?, format } → { jobId }
POST   /api/admin/export/analytics       → { dateRange, format } → { jobId }
GET    /api/admin/export/jobs            → list jobs
GET    /api/admin/export/jobs/{id}/download → file
```

---

## 14. Question Quality

> Page: `/admin/question-quality`

### 14.1 Tại sao cần?
Chất lượng câu hỏi = chất lượng app. Admin cần biết: câu nào quá khó/dễ, câu nào bị report, câu nào chưa dùng, trend chất lượng theo thời gian.

### 14.2 Overall Score
- 0-100, tính từ: avg accuracy all questions + avg user feedback + inverse report rate
- Color: green >70, yellow 40-70, red <40

### 14.3 Problem Questions

| Category | Điều kiện | Action |
|----------|-----------|--------|
| Quá khó | accuracy < 20% AND timesAnswered > 50 | Xem, sửa, đổi difficulty, deactivate |
| Quá dễ | accuracy > 95% AND timesAnswered > 50 | Xem, sửa, tăng difficulty |
| Bị report nhiều | reports >= 3 | Xem, sửa, link đến feedback |
| Chưa dùng | timesAnswered = 0 AND createdAt > 30 ngày | Activate hoặc delete |

### 14.4 Distribution Charts
- Difficulty distribution per book: stacked bar (Easy/Medium/Hard)
- Accuracy histogram: x = accuracy %, y = question count, red zones <20% và >95%
- Quality trends 30 ngày: line chart, separate lines AI vs manual vs imported

### API
```
GET /api/admin/question-quality/overview      → { avgQuality, totalActive, distribution }
GET /api/admin/question-quality/problems       → { tooHard[], tooEasy[], mostReported[] }
GET /api/admin/question-quality/unused         → questions timesAnswered=0
GET /api/admin/question-quality/trends         → daily avg quality 30 days
GET /api/admin/question-quality/distribution   → accuracy histogram data
```

---

## 15. Audit Log

> Hiển thị trong Dashboard + accessible from all pages

### 15.1 Tracked Actions

| Action | Ghi nhận |
|--------|----------|
| question.create | Admin tạo câu hỏi |
| question.update | Admin sửa câu hỏi |
| question.delete | Admin xóa câu hỏi |
| question.import | Import batch |
| question.approve | Duyệt câu hỏi |
| question.reject | Từ chối câu hỏi |
| ai.generate | Tạo câu AI |
| user.ban | Khóa tài khoản |
| user.unban | Mở khóa |
| user.role_change | Đổi role |
| group.lock | Khóa nhóm |
| group.unlock | Mở khóa nhóm |
| group.delete | Xóa nhóm |
| season.create | Tạo mùa |
| season.end | Kết thúc mùa |
| tournament.cancel | Hủy tournament |
| tournament.force_end | Force end |
| config.update | Đổi config |
| config.reset | Reset config |
| notification.broadcast | Gửi broadcast |
| export.create | Tạo export job |

### 15.2 Log format
```json
{
  "id": "uuid",
  "actorUserId": "admin_uuid",
  "action": "user.ban",
  "entity": "User",
  "entityId": "user_uuid",
  "metadata": { "reason": "Spam feedback", "previousRole": "user" },
  "createdAt": "2026-04-02T10:30:00Z"
}
```

### API (đã có)
```
GET /api/admin/audit                → paginated, filter by action/entity/actor/date
GET /api/admin/audit/user/{userId}  → actions by specific admin
GET /api/admin/audit/recent         → last 50
GET /api/admin/audit/stats          → counts by action type
```

---

## 16. Bảng tổng hợp API

| # | Method | Endpoint | Auth | Page |
|---|--------|----------|------|------|
| 1 | GET | /api/admin/dashboard | Admin | Dashboard |
| 2 | GET | /api/admin/users | Admin | Users |
| 3 | GET | /api/admin/users/{id} | Admin | Users |
| 4 | PATCH | /api/admin/users/{id}/role | Admin | Users |
| 5 | PATCH | /api/admin/users/{id}/ban | Admin | Users |
| 6 | GET | /api/admin/questions | Admin | Questions |
| 7 | POST | /api/admin/questions | Admin | Questions |
| 8 | PUT | /api/admin/questions/{id} | Admin | Questions |
| 9 | DELETE | /api/admin/questions/{id} | Admin | Questions |
| 10 | POST | /api/admin/questions/import | Admin | Questions |
| 11 | GET | /api/admin/questions/coverage | Admin | Questions |
| 12 | POST | /api/admin/ai/generate | Admin | AI Generator |
| 13 | GET | /api/admin/ai/info | Admin | AI Generator |
| 14 | POST | /api/admin/ai/drafts/{id}/approve | Admin | AI Generator |
| 15 | GET | /api/admin/review/pending | Admin+Mod | Review Queue |
| 16 | POST | /api/admin/review/{id}/approve | Admin+Mod | Review Queue |
| 17 | POST | /api/admin/review/{id}/reject | Admin+Mod | Review Queue |
| 18 | GET | /api/admin/feedback | Admin+Mod(read) | Feedback |
| 19 | PATCH | /api/admin/feedback/{id} | Admin | Feedback |
| 20 | GET | /api/admin/seasons | Admin | Rankings |
| 21 | POST | /api/admin/seasons | Admin | Rankings |
| 22 | POST | /api/admin/seasons/{id}/end | Admin | Rankings |
| 23 | GET | /api/admin/tournaments | Admin | Events |
| 24 | DELETE | /api/admin/tournaments/{id} | Admin | Events |
| 25 | POST | /api/admin/tournaments/{id}/force-end | Admin | Events |
| 26 | GET | /api/admin/groups | Admin | Groups |
| 27 | PATCH | /api/admin/groups/{id}/lock | Admin | Groups |
| 28 | DELETE | /api/admin/groups/{id} | Admin | Groups |
| 29 | POST | /api/admin/notifications/broadcast | Admin | Notifications |
| 30 | GET | /api/admin/notifications/history | Admin | Notifications |
| 31 | GET | /api/admin/config | Admin | Configuration |
| 32 | PATCH | /api/admin/config | Admin | Configuration |
| 33 | POST | /api/admin/export/* | Admin | Export |
| 34 | GET | /api/admin/question-quality/* | Admin | Quality |
| 35 | GET | /api/admin/audit | Admin | Audit (Dashboard) |

---

## 17. Bảng tổng hợp Pages

| # | Page | Route | Vai trò | Status |
|---|------|-------|---------|--------|
| 1 | Dashboard | /admin | Admin + Mod(read) | 🆕 Cần tạo |
| 2 | Users | /admin/users | Admin | 🆕 Cần tạo (stub) |
| 3 | Questions | /admin/questions | Admin | ✅ Có (cần split) |
| 4 | AI Generator | /admin/ai-generator | Admin | ✅ Có (cần split) |
| 5 | Review Queue | /admin/review-queue | Admin + Mod | ✅ Có |
| 6 | Feedback | /admin/feedback | Admin + Mod(read) | ✅ Có |
| 7 | Rankings | /admin/rankings | Admin | 🆕 Cần tạo (stub) |
| 8 | Events | /admin/events | Admin | 🆕 Cần tạo (stub) |
| 9 | Groups | /admin/groups | Admin | 🆕 Cần tạo (mới) |
| 10 | Notifications | /admin/notifications | Admin | 🆕 Cần tạo (mới) |
| 11 | Configuration | /admin/config | Admin | 🆕 Cần tạo (mới) |
| 12 | Export Center | /admin/export | Admin | 🆕 Cần tạo (mới) |
| 13 | Question Quality | /admin/question-quality | Admin | 🆕 Cần tạo (mới) |
