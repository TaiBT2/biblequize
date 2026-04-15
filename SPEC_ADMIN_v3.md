# BibleQuiz — SPEC ADMIN (v3)
> Spec cho phần admin & content moderation.
> Phần user xem SPEC_USER_v3.md.
> Last updated: 2026-04-07
> Replaces: SPEC_ADMIN.md (v1) + admin sections trong SPEC-v2.md

---

## Mục lục

1. Tổng quan & vai trò
2. Admin Dashboard
3. Quản lý người dùng
4. Quản lý câu hỏi
5. Duplicate Detection (3-layer)
6. AI Question Generator
7. Review Queue
8. Feedback & Moderation
9. Seasons & Rankings
10. Events & Tournaments
11. Church Groups Admin
12. Notifications Broadcast
13. Configuration
14. Export Center
15. Question Quality
16. Audit Log
17. Test Panel (Dev/Staging)
18. Bảng tổng hợp API
19. Bảng tổng hợp Pages

---

## 1. Tổng quan & vai trò

### 1.1 Mục đích

Admin panel cho phép quản trị viên điều hành toàn bộ hệ thống BibleQuiz: nội dung câu hỏi (với duplicate detection), người dùng, nhóm hội thánh, giải đấu, thông báo, cấu hình game, theo dõi chất lượng, và test features trong dev environment.

### 1.2 Vai trò admin

| Vai trò | Quyền | Truy cập |
|---------|-------|----------|
| **Admin** | Toàn quyền | Tất cả 14 trang admin |
| **Content Moderator** | Duyệt câu hỏi + xem feedback | Dashboard (read-only), Review Queue, Feedback (read-only) |

### 1.3 Truy cập admin

- URL: `/admin` (Dashboard mặc định)
- Guard: `RequireAdmin` — redirect về `/` nếu không phải admin/content_mod
- Entry point: nút "Admin Panel" trong sidebar AppLayout (chỉ hiện cho admin/content_mod)
- Content mod thấy nút "Moderation" thay vì "Admin Panel"

### 1.4 Admin Layout

- Sidebar trái (240px): 14 nav items + link "Về trang chính" + user info
- Top bar: page title + search + notification bell + avatar dropdown
- Content area: scrollable, full-width cho tables
- Responsive: tablet → sidebar icons only, mobile → hamburger menu

---

## 2. Admin Dashboard

> Trang mặc định `/admin`. Tổng quan toàn hệ thống.

### 2.1 KPI Cards (2 rows × 4)

| Card | Dữ liệu | Nguồn |
|------|---------|-------|
| Người dùng | Total + active today + new this week | User table |
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
- Per language tabs: VN / EN

### 2.3 Action Items

Danh sách items cần xử lý:
- Feedback open
- Câu chờ duyệt
- Groups bị report
- Users bị flag
- Duplicates pending review

Click → navigate tới page tương ứng.

### 2.4 Recent Activity

- 10 dòng audit log gần nhất (admin actions)

### 2.5 Charts

- Sessions 7 ngày: line chart
- User registrations 30 ngày: bar chart
- Question quality trend 30 ngày: line chart

### API

```
GET /api/admin/dashboard → { users, questions, sessions, ai, feedback, coverage, seasons }
```

---

## 3. Quản lý người dùng

> Page: `/admin/users`

### 3.1 Danh sách users

- Table: avatar, tên, email, role, tier, streak, last active, actions
- Search: theo tên/email (debounce 300ms)
- Filter: role, status (Active/Banned)
- Pagination: 20/page, cursor-based
- Export CSV button

### 3.2 User Detail Modal

Click user → modal hiện:

**Thông tin:**
- Avatar + name + email + role badge + tier badge
- Stats: tổng điểm, streak, sessions, accuracy, ngày gia nhập
- Tabs:
  - Sessions (mode + book + score + accuracy + date)
  - Achievements (badge grid)
  - Groups (group + role)
  - Journey progress (66 sách)

**Admin actions:**
- Thay đổi role: dropdown → "Lưu thay đổi" (chỉ hiện khi khác current)
- Warning khi promote Admin
- Khóa tài khoản: toggle + lý do bắt buộc (min 10 ký tự)
- BAN button disabled khi lý do trống
- Confirmation popup trước khi ban
- Ban history: vi phạm trước đó

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
GET    /api/admin/users              → paginated, filters
GET    /api/admin/users/{id}         → detail + stats
PATCH  /api/admin/users/{id}/role    → { role }
PATCH  /api/admin/users/{id}/ban     → { banned, reason? }
GET    /api/admin/users/{id}/sessions
GET    /api/admin/users/{id}/achievements
GET    /api/admin/users/{id}/journey
```

---

## 4. Quản lý câu hỏi

> Page: `/admin/questions`

### 4.1 Danh sách câu hỏi

- Table: checkbox, ID, content (truncated 60 chars), book, chapter, difficulty, type, language, quality score, times used, status, actions
- Filters: book, difficulty, type, status, language, search text
- Bulk actions: xóa, đổi difficulty, toggle active, change language
- Pagination: 20/page

### 4.2 CRUD

- **Create**: form modal — book, chapter, verse range, difficulty, type, language, content, options, correct answer, **explanation (BẮT BUỘC)**, **scriptureRef (BẮT BUỘC)**, context note, tags
- **Edit**: same form, pre-filled
- **Delete**: confirm modal, soft delete
- **Duplicate**: copy câu hỏi → edit

### 4.3 Real-time duplicate check

> Khi admin đang gõ content → debounced check (500ms) → cảnh báo nếu trùng.

```
[Content textarea]
  ↓ (debounce 500ms)
POST /api/admin/questions/check-duplicate
  ↓
⚠️ Warning panel hiện nếu có:
  - "Câu này trùng hệt câu #42" (BLOCK)
  - "Tương tự 85% với câu #42: ..." (WARNING)
  - [Xem câu cũ] [Vẫn tạo (forceCreate=true)]
```

Xem mục 5 để chi tiết.

### 4.4 Import

- Format: CSV hoặc JSON
- Drag & drop upload
- **Dry-run trước (default ON):** preview + validation errors + duplicate detection
- Report:
  - X câu mới
  - Y câu warning (similar)
  - Z câu skipped (exact duplicate)
  - Highlight rows có duplicates
- Confirm: import → save

### 4.5 Coverage Map

- Panel bên phải (collapsible): bar chart per book per language
- Click book → filter table
- Color: green (đủ min pool), red (thiếu)

### 4.6 Quality Score

- 0-100, tính từ: accuracy rate, user feedback ratings, report count
- Color: green >70, yellow 40-70, red <40

### API

```
GET    /api/admin/questions              → paginated, filterable
POST   /api/admin/questions              → create (with duplicate check)
PUT    /api/admin/questions/{id}         → update
DELETE /api/admin/questions/{id}         → soft delete
POST   /api/admin/questions/check-duplicate → real-time check (no save)
POST   /api/admin/questions/import       → { file, format, dryRun }
GET    /api/admin/questions/coverage     → per book per difficulty per language
```

---

## 5. Duplicate Detection (3-Layer)

> Quan trọng: chất lượng app phụ thuộc vào không có câu hỏi trùng. 3-layer validation áp dụng cho TẤT CẢ paths thêm câu hỏi.

### 5.1 3 Layers

| Layer | Check | Threshold | Action |
|-------|-------|-----------|--------|
| **1. Exact Match** | Content giống hệt sau normalize (lowercase, bỏ dấu câu, trim spaces) | 100% | ❌ **BLOCK** |
| **2. Same Verse + Answer** | Cùng book + chapter + verse + correctAnswer (case insensitive) | — | ⚠️ **WARNING** |
| **3. Fuzzy Similarity** | Jaccard similarity giữa câu cùng book+chapter | ≥75% | ⚠️ **WARNING** |

### 5.2 Normalize logic

```
text.trim()
  .toLowerCase()
  .replaceAll(punctuation, "")  // ?!.,;:
  .replaceAll(whitespace+, " ")
  .replaceAll("đức chúa trời", "duc chua troi")  // Vietnamese normalization
  .replaceAll("chúa giê-su", "chua giesu")
```

### 5.3 Jaccard similarity

```
similarity(A, B) = |words(A) ∩ words(B)| / |words(A) ∪ words(B)|

Threshold: ≥0.75 → flag warning
```

### 5.4 Áp dụng cho 3 paths

#### 5.4.1 Admin Manual Create

```
Real-time check khi đang gõ (debounced 500ms)
  → Hiện warning panel nếu có
  
On submit:
  → Layer 1 BLOCK → reject với 409 + existingQuestion
  → Layer 2/3 WARNING → reject với 409 + similarQuestions + hint forceCreate=true
  → Pass → create

forceCreate=true → bypass warnings, vẫn create
```

#### 5.4.2 Import CSV/JSON

```
Dry-run mandatory:
  Check từng câu qua 3 layers
  Báo cáo:
    ✅ X câu mới
    ⚠️ Y câu warning (hiện similar questions)
    ❌ Z câu exact duplicate (auto skip)
  
Cũng check trùng TRONG BATCH (không chỉ vs DB)
  Nếu 2 câu trong file similarity >90% → flag

skipDuplicates option:
  true → skip cả warnings
  false → import warnings, chỉ skip exact

Confirm → save
```

#### 5.4.3 AI Generate

```
AI tạo 20 drafts
  ↓
Auto-check 3 layers TRƯỚC KHI hiện cho admin
  ↓
Drafts hiện với status:
  ✅ Không trùng
  ⚠️ Tương tự X% với câu #42 (admin review)
  ❌ AUTO-REJECTED (exact match)
  
Cũng check trùng GIỮA các drafts trong batch
```

### 5.5 API

```
POST /api/admin/questions/check-duplicate → DuplicateCheckResult
  Body: { content, correctAnswer, book, chapter, verse, language }
  Response: { status, blocked, message, matches: [{ questionId, content, similarityPercent }] }

POST /api/admin/questions
  Body: { ..., forceCreate: false }
  → 409 nếu duplicate (without forceCreate)
  → 201 nếu created
```

### 5.6 Database

```sql
-- Optional: indexes for performance
CREATE INDEX idx_question_book_chapter_lang ON question(book, chapter, language);
CREATE INDEX idx_question_book_verse_answer ON question(book, chapter, verse, language);
```

---

## 6. AI Question Generator

> Page: `/admin/ai-generator`

### 6.1 Configuration

- Scripture selector: book → chapter range → verse range (optional)
- Model: Gemini hoặc Claude (tab selector)
- Difficulty: Easy/Medium/Hard/Mixed
- Question type: MCQ/True-False/Mixed
- Count: 1-20 (default 10)
- **Language: Tiếng Việt (default), English**
- **Scripture version:** VIE2011 (vi default), NIV/ESV/KJV (en options)

### 6.2 Quota & Cost

- Daily quota: 200 câu/admin
- Cost alert: $10/ngày
- Hiển thị: "45/200 câu hôm nay" + "$3.42/$10.00"
- Generate disabled khi vượt quota
- Warning khi cost > $8

### 6.3 Draft Management

- Generate → danh sách drafts
- Mỗi draft: preview, difficulty/type badge, validation status, **duplicate status**
- Status icons:
  - ✅ Valid + No duplicate
  - ⚠️ Similar to existing (X%)
  - ❌ AUTO-REJECTED (exact duplicate hoặc invalid)
- Inline edit: click draft → mở editor → sửa content, options, answer, explanation, scriptureRef
- Approve: duyệt đưa vào pool (createdBy="ai-generated", reviewedBy=adminId)
- Bulk: "Duyệt tất cả hợp lệ" + "Xóa tất cả"

### 6.4 Validation tự động

- Format check: đủ fields, correctAnswer hợp lệ
- Explanation check: có verse reference (scriptureRef)
- Duplicate check: 3-layer (xem mục 5)
- Length check: explanation max 150 từ

### 6.5 Auto-generate explanations cho câu existing

> Câu hỏi cũ chưa có explanation → batch generate.

```
POST /api/admin/ai/generate-explanations?batchSize=50
  → AI generate explanation + scriptureRef cho 50 câu chưa có
  → Save vào DB
```

### API

```
POST   /api/admin/ai/generate            → { scripture, model, count, difficulty, type, language }
GET    /api/admin/ai/info                → { models, quotaToday, costToday }
GET    /api/admin/ai/jobs/{id}           → { status, drafts[], costUSD }
POST   /api/admin/ai/drafts/{id}/approve → { questionId }
PUT    /api/admin/ai/drafts/{id}         → update draft
DELETE /api/admin/ai/drafts/{id}         → delete draft
POST   /api/admin/ai/generate-explanations?batchSize=50
```

---

## 7. Review Queue

> Page: `/admin/review-queue`

### 7.1 Quy trình duyệt

- Câu hỏi mới (AI generated hoặc imported) → status "pending"
- Cần **2 admin duyệt** → status "approved" → active
- 1 admin reject → status "rejected"
- Admin có thể sửa trước khi duyệt

### 7.2 Giao diện

- Stats pills: chờ duyệt (yellow), đã duyệt hôm nay (green), đã từ chối (red)
- Queue cards: question ID, difficulty badge, book reference, language flag, full question text, options (correct highlighted), explanation, scriptureRef, source
- Approval progress: "1/2 đã duyệt (Admin B)"
- Actions: Duyệt (green), Sửa trước duyệt (outline), Từ chối + lý do (red)
- Filters: sort, filter by book/language

### 7.3 Quy tắc

- Admin không duyệt câu mình tạo
- Reject phải có lý do (min 10 ký tự)
- Mọi action ghi audit log

### API

```
GET    /api/admin/review/pending      → list pending
POST   /api/admin/review/{id}/approve
POST   /api/admin/review/{id}/reject  → { reason }
GET    /api/admin/review/stats        → counts
```

---

## 8. Feedback & Moderation

> Page: `/admin/feedback`

### 8.1 Feedback types

| Type | Mô tả |
|------|-------|
| `report` | Báo cáo nội dung sai |
| `question` | Hỏi về câu hỏi |
| `general` | Góp ý chung |
| `content_error` | Lỗi nội dung |
| `bug_report` | Báo lỗi app |

### 8.2 Status flow

```
open → in_review → resolved
                 → dismissed
```

### 8.3 Giao diện

- Stats cards: Open, In Review, Resolved this week, Dismissed
- Table: user, type badge, content preview, linked question, status, date, actions
- Detail modal: full content, linked question, admin notes, status buttons, history

### 8.4 Content Moderation Queue

- Feedback có nội dung không phù hợp → flag
- Group announcements cần moderate → flag
- Admin review + dismiss hoặc take action

### API

```
GET    /api/admin/feedback           → paginated, filter
PATCH  /api/admin/feedback/{id}      → { status, note? }
```

---

## 9. Seasons & Rankings

> Page: `/admin/rankings`

### 9.1 Season Management

- Danh sách: name, status, dates, participants
- Create: name, description, start, end (validation: không overlap)
- End sớm: confirm → trigger badge distribution
- Active season detail: participants, avg score, tier distribution, top 10

### 9.2 Season Config

- Duration: 3 tháng (configurable)
- Badge format: "Vinh Quang Mùa [N] 🏆" cho top 3 mỗi tier
- Auto-create next season: toggle

### 9.3 Leaderboard Controls

- Manual recompute: trigger Redis ZSET recalculation
- Health check: phát hiện stale entries
- Last recompute timestamp

### API

```
GET    /api/admin/seasons              → list
POST   /api/admin/seasons              → create
PATCH  /api/admin/seasons/{id}
POST   /api/admin/seasons/{id}/end     → force end + badges
GET    /api/admin/seasons/{id}/stats
POST   /api/admin/leaderboard/reset    → manual recompute
```

---

## 10. Events & Tournaments

> Page: `/admin/events`

### 10.1 Tournament Management

- Danh sách: name, status, group, players, rounds, winner, dates
- Filters: status, group, date range
- Detail: bracket (read-only), participants + seeds, match details

### 10.2 Admin Actions

- Cancel tournament: input reason → notify participants
- Force end: emergency — auto-determine winner
- DQ player: disqualify → auto-advance opponent
- Delete: chỉ cancelled tournaments

### 10.3 Stats

- Active tournaments count
- Avg participants per tournament
- Most active groups
- Recent completions

### API

```
GET    /api/admin/tournaments
GET    /api/admin/tournaments/{id}
PATCH  /api/admin/tournaments/{id}
DELETE /api/admin/tournaments/{id}
POST   /api/admin/tournaments/{id}/force-end
GET    /api/admin/tournaments/stats
```

---

## 11. Church Groups Admin

> Page: `/admin/groups`

### 11.1 Mục đích

Church Group là differentiator chính. Phát triển tự nhiên nhưng cần admin can thiệp khi: vi phạm, leader inactive, nội dung không phù hợp, conflicts.

### 11.2 Danh sách groups

- Table: avatar, name, leader, members (X/200), weekly points, status, created, actions
- Filters: status (Active/Inactive/Locked), size range, public/private

### 11.3 Flagged Groups (priority)

- Groups bị report bởi users
- Report reason + reporter info
- Quick actions: dismiss, lock, contact leader

### 11.4 Group Detail

- Header: avatar + name + description + leader
- Stats: members, weekly activity, avg accuracy, group streak
- Tabs: Members, Analytics, Announcements, Quiz Sets

### 11.5 Admin Actions

- Lock group: input reason → notify leader → members thấy "Nhóm bị khóa"
- Unlock group
- Transfer leadership
- Delete group: soft delete + reason
- Adjust max members (override default 200)

### 11.6 Group States

| Status | Điều kiện | Hiển thị |
|--------|-----------|----------|
| Active | Có activity 30 ngày | Green dot |
| Inactive | Không activity > 30 ngày | Yellow dot |
| Locked | Admin khóa | Red dot + "🔒 Đã khóa" |

### API

```
GET    /api/admin/groups
GET    /api/admin/groups/{id}
PATCH  /api/admin/groups/{id}/lock     → { locked, reason }
PATCH  /api/admin/groups/{id}/unlock
DELETE /api/admin/groups/{id}
PATCH  /api/admin/groups/{id}/transfer-leader → { newLeaderId }
GET    /api/admin/groups/flagged
GET    /api/admin/groups/stats
```

---

## 12. Notifications Broadcast

> Page: `/admin/notifications`

### 12.1 Compose Broadcast

- Title, content (rich text)
- Target audience:
  - Tất cả users
  - Theo tier (multi-select)
  - Theo role
  - Theo group
  - Custom list (paste user IDs hoặc emails)
- Schedule: ngay hoặc hẹn giờ
- Preview: "Sẽ gửi đến ~1,247 người"

### 12.2 Sent History

- Table: title, target, sent count, opened % (open rate), date, status
- Status: Sent (green), Scheduled (blue), Failed (red), Draft (gray)
- Click → detail: delivery stats, open rate chart

### 12.3 Automated Notifications Management

| Notification | Schedule | Default |
|-------------|----------|---------|
| Streak warning | Hourly check | ✅ On |
| Daily challenge ready | 8:00 AM local | ✅ On |
| Weekly summary | Monday 9:00 AM | ❌ Off |
| Welcome new user | On signup | ✅ On |
| Tier up celebration | On tier change | ✅ On |
| Tournament start | 5 phút trước | ✅ On |
| Challenge received | Real-time | ✅ On |
| Group invite | Real-time | ✅ On |

- Toggle on/off per notification
- Edit schedule
- View last sent stats

### API

```
POST   /api/admin/notifications/broadcast
GET    /api/admin/notifications/history
GET    /api/admin/notifications/history/{id}/stats
GET    /api/admin/notifications/scheduled
PATCH  /api/admin/notifications/scheduled/{id}
DELETE /api/admin/notifications/broadcast/{id}
```

---

## 13. Configuration

> Page: `/admin/config`

### 13.1 Mục đích

Admin thay đổi game parameters mà không cần redeploy. Thay đổi ảnh hưởng tất cả users ngay lập tức.

### 13.2 Config categories

**Game:**
| Key | Default | Mô tả |
|-----|---------|-------|
| DAILY_ENERGY | 100 | Năng lượng/ngày |
| ENERGY_REGEN_PER_HOUR_TIER_1 | 20 | Regen tier 1 |
| ENERGY_REGEN_PER_HOUR_TIER_6 | 35 | Regen tier 6 |
| DAILY_QUESTION_CAP | 100 | Giới hạn câu ranked/ngày |
| STREAK_FREEZE_PER_WEEK_BASE | 1 | Freeze base/tuần |

**Scoring:**
| Key | Default |
|-----|---------|
| BASE_POINTS_EASY | 8 |
| BASE_POINTS_MEDIUM | 12 |
| BASE_POINTS_HARD | 18 |
| COMBO_THRESHOLD_1 | 5 |
| COMBO_THRESHOLD_2 | 10 |
| DAILY_BONUS_MULTIPLIER | 2 |

**Tier multipliers (XP):**
| Key | Default |
|-----|---------|
| TIER_1_XP_MULTIPLIER | 1.0 |
| TIER_2_XP_MULTIPLIER | 1.1 |
| TIER_3_XP_MULTIPLIER | 1.2 |
| TIER_4_XP_MULTIPLIER | 1.3 |
| TIER_5_XP_MULTIPLIER | 1.5 |
| TIER_6_XP_MULTIPLIER | 2.0 |

**Smart Selection:**
| Key | Default |
|-----|---------|
| SMART_SELECT_NEW_PERCENT | 60 |
| SMART_SELECT_REVIEW_PERCENT | 20 |
| SMART_SELECT_OLD_PERCENT | 15 |
| SRS_REVIEW_THRESHOLD_DAYS | 30 |

**Variety modes:**
| Key | Default |
|-----|---------|
| MYSTERY_MODE_XP_MULTIPLIER | 1.5 |
| SPEED_ROUND_XP_MULTIPLIER | 2.0 |
| SPEED_ROUND_TIMER_SECONDS | 10 |
| WEEKLY_QUIZ_QUESTION_COUNT | 10 |
| DAILY_BONUS_PROBABILITY | 0.14 |

**AI:**
| Key | Default |
|-----|---------|
| AI_DAILY_QUOTA | 200 |
| AI_COST_ALERT_USD | 10.00 |
| AI_DEFAULT_MODEL | gemini |

**Duplicate Detection:**
| Key | Default |
|-----|---------|
| DUPLICATE_FUZZY_THRESHOLD | 0.75 |
| DUPLICATE_BATCH_THRESHOLD | 0.90 |

**Season:**
| Key | Default |
|-----|---------|
| SEASON_DURATION_MONTHS | 3 |
| AUTO_CREATE_NEXT_SEASON | true |

**Room:**
| Key | Default |
|-----|---------|
| ROOM_MAX_PLAYERS | 20 |
| ROOM_CODE_LENGTH | 6 |
| ROOM_IDLE_TIMEOUT_MIN | 30 |
| ROOM_RECONNECT_GRACE_SECONDS | 60 |

### 13.3 Giao diện

- Cards per category, collapsible
- Inline edit → "Lưu" button
- Warning banner: "⚠️ Thay đổi ảnh hưởng tất cả người dùng ngay lập tức"
- "Khôi phục mặc định" button (danger, confirm)
- Change history: ai đổi gì, khi nào

### 13.4 Storage

- DB table `app_config`: key, value, default_value, description, category
- Backend đọc từ DB (cache, invalidate on update)
- Fallback: default nếu key không có

### API

```
GET    /api/admin/config             → all by category
PATCH  /api/admin/config             → { configs: [{ key, value }] }
POST   /api/admin/config/reset       → reset to defaults
GET    /api/admin/config/history     → audit log
```

---

## 14. Export Center

> Page: `/admin/export`

### 14.1 Export types

| Type | Format | Filters |
|------|--------|---------|
| Câu hỏi | CSV, JSON, Excel | Book, difficulty, status, language, date |
| Người dùng | CSV, Excel | Role, tier, active/inactive |
| Bảng xếp hạng | CSV, PDF | Season, period |
| Groups | CSV, Excel | Specific/all |
| Analytics | CSV, JSON | Date range |
| **Question History** | CSV | User-specific (cho duplicate analysis) |

### 14.2 Quy trình

1. Admin chọn type + format + filters
2. Preview: "~3,420 records sẽ được xuất"
3. Click "Xuất" → async job background
4. Job status: PENDING → PROCESSING → COMPLETED
5. COMPLETED → download link (24h expire)

### 14.3 Export History

- Table: type, format, records, file size, date, status, download
- Failed → retry
- Expired → re-export

### API

```
POST   /api/admin/export/questions       → { format, filters } → { jobId }
POST   /api/admin/export/users
POST   /api/admin/export/leaderboard
POST   /api/admin/export/groups
POST   /api/admin/export/analytics
GET    /api/admin/export/jobs            → list
GET    /api/admin/export/jobs/{id}/download
```

---

## 15. Question Quality

> Page: `/admin/question-quality`

### 15.1 Mục đích

Theo dõi chất lượng câu hỏi: câu nào quá khó/dễ, câu nào bị report, câu nào chưa dùng, trend theo thời gian.

### 15.2 Overall Score

- 0-100, tính từ: avg accuracy + avg user feedback + inverse report rate
- Color: green >70, yellow 40-70, red <40

### 15.3 Problem Questions

| Category | Điều kiện | Action |
|----------|-----------|--------|
| Quá khó | accuracy < 20% AND timesAnswered > 50 | Edit, change difficulty, deactivate |
| Quá dễ | accuracy > 95% AND timesAnswered > 50 | Edit, increase difficulty |
| Bị report nhiều | reports >= 3 | Review, edit |
| Chưa dùng | timesAnswered = 0 AND createdAt > 30 ngày | Activate hoặc delete |
| **Có duplicate** | similarity >75% với câu khác | Review, merge hoặc delete |

### 15.4 Distribution Charts

- Difficulty distribution per book: stacked bar
- Accuracy histogram: x = accuracy %, y = question count, red zones
- Quality trends 30 ngày: line chart, separate AI vs manual vs imported
- Coverage gap: sách nào thiếu câu

### API

```
GET /api/admin/question-quality/overview
GET /api/admin/question-quality/problems
GET /api/admin/question-quality/unused
GET /api/admin/question-quality/trends
GET /api/admin/question-quality/distribution
GET /api/admin/question-quality/duplicates → potential duplicates list
```

---

## 16. Audit Log

> Hiển thị trong Dashboard + accessible từ all pages

### 16.1 Tracked Actions

| Action | Ghi nhận |
|--------|----------|
| question.create | Admin tạo câu hỏi |
| question.update | Admin sửa |
| question.delete | Admin xóa |
| question.import | Import batch |
| question.approve | Duyệt |
| question.reject | Từ chối |
| question.duplicate_override | Force create vượt warning duplicate |
| ai.generate | Tạo AI |
| ai.explanations_batch | Generate explanations batch |
| user.ban | Khóa tài khoản |
| user.unban | Mở khóa |
| user.role_change | Đổi role |
| user.delete_account | User tự xóa account |
| group.lock | Khóa nhóm |
| group.unlock | Mở khóa |
| group.delete | Xóa nhóm |
| group.transfer_leader | Chuyển leader |
| season.create | Tạo mùa |
| season.end | Kết thúc mùa |
| tournament.cancel | Hủy |
| tournament.force_end | Force end |
| config.update | Đổi config |
| config.reset | Reset config |
| notification.broadcast | Gửi broadcast |
| export.create | Tạo export job |
| **test.set_tier** | Test panel: set tier (dev only) |
| **test.full_reset** | Test panel: reset user (dev only) |
| **test.set_state** | Test panel: partial scalar state override (dev only) |
| **test.set_mission_state** | Test panel: override daily mission state (dev only) |
| **test.seed_points** | Test panel: wipe UserDailyProgress history + seed exact totalPoints (dev only) |

### 16.2 Log format

```json
{
  "id": "uuid",
  "actorUserId": "admin_uuid",
  "action": "user.ban",
  "entity": "User",
  "entityId": "user_uuid",
  "metadata": { "reason": "Spam feedback", "previousRole": "user" },
  "createdAt": "2026-04-07T10:30:00Z"
}
```

### API

```
GET /api/admin/audit                → paginated, filters
GET /api/admin/audit/user/{userId}  → actions by specific admin
GET /api/admin/audit/recent         → last 50
GET /api/admin/audit/stats          → counts by action
```

---

## 17. Test Panel (Dev/Staging Only)

> Page: `/admin/test`
> ⚠️ CHỈ enable trong dev/staging environment. KHÔNG có trong production.
> `@Profile({"dev", "staging"})` trên backend.

### 17.1 Mục đích

Test tier progression và features mà không cần grind nhiều ngày. Manual verification UI cho features khó test bằng unit tests.

### 17.2 Tier Testing

```
Section: 🏆 Test Tier Progression
  [Set Tier 1] [Set Tier 2] [Set Tier 3]
  [Set Tier 4] [Set Tier 5] [Set Tier 6]
  
  [🎉 Trigger Tier-Up Celebration]
  
  Sau khi set → mở Home page → quan sát:
  - XP multiplier
  - Energy regen
  - Locked modes
  - Difficulty distribution
```

### 17.3 Smart Question Selection Testing

```
Section: 🎯 Test Smart Question Selection
  [🔄 Reset History] [📚 Mock 50% seen, 20% wrong]
  
  [👁️ Preview 10 câu sẽ chọn]
  
  Output:
    Pool breakdown: NEW: 6 | REVIEW: 2 | OLD: 2
    Difficulty: EASY: 1 | MEDIUM: 4 | HARD: 5
    Questions list (with seen indicator)
```

### 17.4 Utilities

```
Section: 🛠️ Utilities
  [⚡ Refill Energy]
  [🔥 Set Streak 30 days]
  [💎 Set Streak 100 days]
  [☢️ Full Reset User]
```

### 17.5a Test Fixtures (State Override)

Endpoints for E2E test setup/teardown. All are partial-update — null fields are no-ops.
Unknown JSON fields rejected with HTTP 400: `{ "error": "Field 'xxx' is not allowed" }`.

```
Section: 🛠️ Set State (test fixtures)
  POST /api/admin/test/users/{id}/set-state
  Body (all fields optional):
    livesRemaining      : int  0–100    — today's energy
    questionsCounted    : int  0–200    — today's ranked cap counter
    daysAtTier6         : int  0–30     — prestige eligibility counter
    lastPlayedAt        : date YYYY-MM-DD — set User.lastPlayedAt to start-of-day
    xpSurgeHoursFromNow : int  0–72     — 0 = clear surge, N = set N hours from now
  
  Audit: test.set_state | metadata = applied fields (non-null only)

  POST /api/admin/test/users/{id}/set-mission-state
  Body:
    date     : YYYY-MM-DD  (optional, default = today UTC)
    missions : [
      { missionType: string, progress: int?, completed: bool?, bonusClaimed: bool? }
    ]
  
  Returns 404 if missionType not found for given date.
  Audit: test.set_mission_state | metadata = { date, missionCount }

  POST /api/admin/test/users/{id}/seed-points
  Body:
    totalPoints : int  0–200000  — exact totalPoints to seed
  
  Behavior:
    1. Wipes ALL existing UserDailyProgress rows for the user (destructive)
    2. Inserts a single fresh row today with:
       - pointsCounted = totalPoints
       - livesRemaining = 100
       - questionsCounted = 0
    3. Response: { userId, totalPoints, tierLevel, tierName, wipedRows }
  
  Rationale:
    UserTierService.getTotalPoints() = SUM(UserDailyProgress.pointsCounted).
    There is no direct User.totalPoints column — the only way to set an exact
    total is to replace the progress history. Used by tier-bump, star-boundary,
    and milestone E2E tests that need a user sát ngưỡng (e.g. 4999 points).
  
  Audit: test.seed_points | metadata = { totalPoints, wipedRows, newTier }
```

### 17.5 Test Scenarios (Documentation)

```
Scenario 1: New user experience
  1. Full Reset → Set Tier 1
  2. Mở Home → verify locked modes
  3. Chơi 5 câu → verify difficulty

Scenario 2: Tier-up flow
  1. Set Tier 2
  2. Trigger Tier-Up → verify celebration
  3. Verify rewards (XP, energy, unlocks)

Scenario 3: Smart selection
  1. Mock 50% history
  2. Preview → verify ~60% NEW
  3. Chơi quiz → confirm không lặp

Scenario 4: High tier difficulty
  1. Set Tier 6
  2. Preview 20 → verify ~60% HARD
  3. Verify timer 18s
```

### 17.6 Test Users (Seed)

```sql
-- Auto-seed trong dev environment
INSERT INTO users (email, name, tier_level, total_points)
VALUES
  ('test1@dev.local', 'Test Tier 1', 1, 0),
  ('test2@dev.local', 'Test Tier 2', 2, 1500),
  ('test3@dev.local', 'Test Tier 3', 3, 8000),
  ('test4@dev.local', 'Test Tier 4', 4, 20000),
  ('test5@dev.local', 'Test Tier 5', 5, 50000),
  ('test6@dev.local', 'Test Tier 6', 6, 100000);
```

### API

```
@Profile({"dev", "staging"})
@RequestMapping("/api/admin/test")

POST /api/admin/test/users/{userId}/set-tier?tierLevel={1-6}
POST /api/admin/test/users/{userId}/reset-history
POST /api/admin/test/users/{userId}/mock-history?percentSeen=50&percentWrong=20
POST /api/admin/test/users/{userId}/refill-energy
POST /api/admin/test/users/{userId}/set-streak?days={N}
POST /api/admin/test/users/{userId}/trigger-tier-up
GET  /api/admin/test/users/{userId}/preview-questions?count=10
POST /api/admin/test/users/{userId}/full-reset
POST /api/admin/test/users/{userId}/set-state          (body: SetStateRequest — partial scalar override)
POST /api/admin/test/users/{userId}/set-mission-state  (body: SetMissionStateRequest — daily mission state)
POST /api/admin/test/users/{userId}/seed-points        (body: SeedPointsRequest — exact totalPoints seed, wipes history)
```

---

## 18. Bảng tổng hợp API Admin

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
| 10 | POST | /api/admin/questions/check-duplicate | Admin | Questions (real-time) |
| 11 | POST | /api/admin/questions/import | Admin | Questions |
| 12 | GET | /api/admin/questions/coverage | Admin | Questions |
| 13 | POST | /api/admin/ai/generate | Admin | AI Generator |
| 14 | GET | /api/admin/ai/info | Admin | AI Generator |
| 15 | POST | /api/admin/ai/drafts/{id}/approve | Admin | AI Generator |
| 16 | POST | /api/admin/ai/generate-explanations | Admin | AI Generator |
| 17 | GET | /api/admin/review/pending | Admin+Mod | Review Queue |
| 18 | POST | /api/admin/review/{id}/approve | Admin+Mod | Review Queue |
| 19 | POST | /api/admin/review/{id}/reject | Admin+Mod | Review Queue |
| 20 | GET | /api/admin/feedback | Admin+Mod(read) | Feedback |
| 21 | PATCH | /api/admin/feedback/{id} | Admin | Feedback |
| 22 | GET | /api/admin/seasons | Admin | Rankings |
| 23 | POST | /api/admin/seasons | Admin | Rankings |
| 24 | POST | /api/admin/seasons/{id}/end | Admin | Rankings |
| 25 | GET | /api/admin/tournaments | Admin | Events |
| 26 | DELETE | /api/admin/tournaments/{id} | Admin | Events |
| 27 | POST | /api/admin/tournaments/{id}/force-end | Admin | Events |
| 28 | GET | /api/admin/groups | Admin | Groups |
| 29 | PATCH | /api/admin/groups/{id}/lock | Admin | Groups |
| 30 | DELETE | /api/admin/groups/{id} | Admin | Groups |
| 31 | POST | /api/admin/notifications/broadcast | Admin | Notifications |
| 32 | GET | /api/admin/notifications/history | Admin | Notifications |
| 33 | GET | /api/admin/config | Admin | Configuration |
| 34 | PATCH | /api/admin/config | Admin | Configuration |
| 35 | POST | /api/admin/export/* | Admin | Export |
| 36 | GET | /api/admin/question-quality/* | Admin | Quality |
| 37 | GET | /api/admin/question-quality/duplicates | Admin | Quality |
| 38 | GET | /api/admin/audit | Admin | Audit |
| 39 | POST | /api/admin/test/* | Admin | Test Panel (dev only) |

---

## 19. Bảng tổng hợp Pages

| # | Page | Route | Vai trò | Status |
|---|------|-------|---------|--------|
| 1 | Dashboard | /admin | Admin + Mod(read) | ✅ Có |
| 2 | Users | /admin/users | Admin | ✅ Có |
| 3 | Questions | /admin/questions | Admin | ✅ Có |
| 4 | AI Generator | /admin/ai-generator | Admin | ✅ Có |
| 5 | Review Queue | /admin/review-queue | Admin + Mod | ✅ Có |
| 6 | Feedback | /admin/feedback | Admin + Mod(read) | ✅ Có |
| 7 | Rankings | /admin/rankings | Admin | ✅ Có |
| 8 | Events | /admin/events | Admin | ✅ Có |
| 9 | Groups | /admin/groups | Admin | ✅ Có |
| 10 | Notifications | /admin/notifications | Admin | ✅ Có |
| 11 | Configuration | /admin/config | Admin | ✅ Có |
| 12 | Export Center | /admin/export | Admin | ✅ Có |
| 13 | Question Quality | /admin/question-quality | Admin | ✅ Có |
| 14 | **Test Panel** | **/admin/test** | **Admin (dev/staging only)** | **🆕 Cần tạo** |

---

## Phụ lục: Thay đổi so với SPEC_ADMIN v1

### Mới thêm
- **Section 5: Duplicate Detection (3-layer)** — toàn bộ section mới
- **Section 17: Test Panel** — toàn bộ section mới
- **AI Generate explanations** — endpoint mới
- **Real-time duplicate check** — workflow trong Questions page
- **Tier-aware config** — XP multipliers, energy regen, smart selection percents trong Configuration
- **Question quality duplicates** — section mới
- **User journey tracking** trong User Detail
- **Multi-language filter** trong Questions

### Audit log mở rộng
- `question.duplicate_override`
- `ai.explanations_batch`
- `user.delete_account`
- `group.transfer_leader`
- `test.set_tier` (dev only)
- `test.full_reset` (dev only)

### API endpoints mới
- `POST /api/admin/questions/check-duplicate`
- `POST /api/admin/ai/generate-explanations`
- `GET /api/admin/question-quality/duplicates`
- `POST /api/admin/test/*` (toàn bộ test panel endpoints)
- `GET /api/admin/users/{id}/journey`

---

*Living spec — cập nhật theo từng milestone.*
