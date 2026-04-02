# Admin — Claude Code Implementation Prompts (v2 — có Stitch Sync)

> Tất cả prompts paste vào Claude Code.
> MỖI prompt đều có bước sync design từ Stitch qua MCP — BẮT BUỘC.
> Chạy sau khi Stitch designs đã tạo xong.

---

## Quy trình chung cho MỖI admin page

```
1. MCP Stitch query design bằng screen name (project 5341030797678838526)
2. Đọc HTML/CSS/layout từ Stitch response
3. Đọc code hiện tại (nếu có) → liệt kê DIFF
4. Code/update match Stitch design pixel-perfect
5. Giữ nguyên business logic — chỉ thay đổi UI nếu page đã có
6. Backend: tạo endpoints + migration nếu cần
7. Unit tests + E2E tests
8. 3 tầng Regression Guard
9. Commit
```

---

## Prompt C0: Admin Button trong User Sidebar (nhanh, không cần Stitch)

```
Thêm button "Admin Panel" vào sidebar AppLayout cho users có role admin.

TRƯỚC KHI CODE: ghi task vào TODO.md.

### Bước 1: Đọc code
- apps/web/src/layouts/AppLayout.tsx
- apps/web/src/store/authStore.ts → user.role

### Bước 2: Thêm conditional admin button
Trong sidebar, sau nav items, trước user info:

```typescript
const user = useAuthStore(state => state.user)
const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin'
const isContentMod = user?.role === 'CONTENT_MOD' || user?.role === 'content_mod'

{(isAdmin || isContentMod) && (
  <>
    <div className="border-t border-white/5 my-2" />
    <a
      href="/admin"
      className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                 bg-gradient-to-r from-[#e8a832]/10 to-[#e7c268]/10
                 border border-[#e8a832]/20 text-[#e8a832]
                 hover:bg-[#e8a832]/20 transition-colors text-sm font-medium"
    >
      <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
      <span>{isAdmin ? 'Admin Panel' : 'Moderation'}</span>
      <span className="material-symbols-outlined text-xs ml-auto">open_in_new</span>
    </a>
  </>
)}
```

### Bước 3: Mobile — thêm trong profile dropdown, KHÔNG thêm vào bottom tab bar

### Bước 4: Tests
- Admin → "Admin Panel" visible
- Content mod → "Moderation" visible
- Regular user → NO button
- Guest → NO button

### Bước 5: Regression (AppLayout = file nhạy cảm!)
- Commit: "feat: admin panel button in sidebar for admin/content_mod"
```

---

## Prompt C1: Tests cho existing admin pages + controllers

```
Admin section có 0 tests. Viết tests trước khi sửa/thêm code.

TRƯỚC KHI CODE: chia 9 sub-tasks vào TODO.md.

### Frontend (Vitest) — 5 sub-tasks
1. AIQuestionGenerator.test.tsx — min 10 cases
2. Questions.test.tsx — min 10 cases
3. Feedback.test.tsx — min 8 cases
4. ReviewQueue.test.tsx — min 8 cases
5. AdminLayout.test.tsx — min 5 cases

### Backend (JUnit) — 4 sub-tasks
6. AdminQuestionControllerTest — min 8 cases
7. QuestionReviewControllerTest — min 6 cases
8. FeedbackControllerTest — min 4 cases
9. AIAdminControllerTest — min 4 cases

Mỗi sub-task commit riêng.
```

---

## Prompt C2: Split AIQuestionGenerator (918 LOC) + Sync Stitch

```
Tách AIQuestionGenerator 918 LOC + sync Stitch design.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch Design (BẮT BUỘC)
MCP Stitch (project 5341030797678838526) query screen "AI Question Generator".
- Đọc full HTML/CSS/layout
- Ghi chú: 2-column? Config trái, drafts phải? Quota bar ở đâu?

### Bước 2: Tách sub-components THEO Stitch layout
```
pages/admin/
  AIQuestionGenerator.tsx       → Shell (~200 LOC)
  ai-generator/
    ScriptureSelector.tsx       → (~150 LOC)
    ModelSelector.tsx           → (~80 LOC)
    GenerateButton.tsx          → + quota bar (~80 LOC)
    DraftList.tsx               → (~150 LOC)
    DraftEditor.tsx             → (~150 LOC)
    BulkActions.tsx             → (~80 LOC)
```

### Bước 3: Style match Stitch — admin tokens (#0d0f18 bg, #161825 cards)
### Bước 4: Tests + regression
- Commit: "refactor: split AIQuestionGenerator + sync Stitch"
```

---

## Prompt C3: Split Questions (666 LOC) + Sync Stitch

```
Tách Questions 666 LOC + sync Stitch design.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query screen "Questions Management" → đọc layout.

### Bước 2: Tách theo Stitch layout
```
pages/admin/
  Questions.tsx                → Shell (~200 LOC)
  questions/
    QuestionFilters.tsx        → (~120 LOC)
    QuestionTable.tsx          → (~150 LOC)
    QuestionFormModal.tsx      → (~180 LOC)
    ImportModal.tsx            → (~120 LOC)
    CoverageMap.tsx            → (~100 LOC)
```

### Bước 3: Style match Stitch
### Bước 4: Tests + regression
- Commit: "refactor: split Questions admin + sync Stitch"
```

---

## Prompt C4: AI Quota + Cost + Stitch sync quota bar

```
Thêm AI quota 200/day + cost alert $10/day.

TRƯỚC KHI CODE: ghi tasks vào TODO.md.

### Bước 1: Sync Stitch — query "AI Question Generator" cho quota bar position/style

### Bước 2: Backend
- Quota check: count today per admin, reject if > 200
- Cost tracking: sum costUSD per day, warn if > $10
- GET /api/admin/ai/info thêm quotaToday + costToday

### Bước 3: Frontend — quota bar + cost display match Stitch
### Bước 4: Tests + regression
- Commit: "feat: AI quota 200/day + cost tracking"
```

---

## Prompt C14: Sync Existing Admin Pages + AdminLayout từ Stitch

```
Sync UI 4 existing pages + AdminLayout match Stitch design mới.
Làm TRƯỚC khi implement new pages để AdminLayout có đủ nav items.

TRƯỚC KHI CODE: chia tasks vào TODO.md (1 page = 1 task).

### Task 1: AdminLayout sync
- MCP query "Admin Layout + Sidebar" design
- Update: sidebar 13 nav items (thêm Groups, Notifications, Config, Export, Quality, Dashboard)
- Update: top bar, responsive
- KHÔNG thay đổi routing logic
- Commit: "sync: AdminLayout from Stitch + new nav items"

### Task 2: Review Queue sync
- MCP query "Review Queue" design → diff → update UI
- Commit: "sync: ReviewQueue admin from Stitch"

### Task 3: Feedback sync
- MCP query "Feedback Management" design → diff → update UI
- Commit: "sync: Feedback admin from Stitch"

### Task 4: AIQuestionGenerator sync (sau split C2)
- MCP query "AI Question Generator" design → verify sub-components match
- Commit: "sync: AIQuestionGenerator admin from Stitch"

### Task 5: Questions sync (sau split C3)
- MCP query "Questions Management" design → verify sub-components match
- Commit: "sync: Questions admin from Stitch"

Regression sau tất cả tasks.
```

---

## Prompt C5: Users Admin (implement + Stitch sync)

```
Implement Users admin. Hiện stub 38 LOC.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query:
- Screen "Users Admin" → table layout, filters, badges
- Screen "User Detail Modal" → modal layout, stats, tabs, admin actions, ban UX
Ghi chú chi tiết mọi thứ từ Stitch trước khi code.

### Bước 2: Backend
AdminUserController: GET list, GET detail, PATCH role, PATCH ban, GET sessions, GET achievements
Flyway: is_banned, ban_reason, banned_at columns

### Bước 3: Frontend — match Stitch pixel-perfect
Users.tsx + users/ sub-components
- Table, filters, badges — per Stitch
- Modal: compact header, 2-column, banned banner, ban history — per Stitch

### Bước 4: Verify match Stitch + Tests (BE min 6, FE min 10) + Regression
- Commit: "feat: admin users page — synced from Stitch"
```

---

## Prompt C6: Rankings (implement + Stitch sync)

```
Implement Rankings admin. Hiện stub 36 LOC.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query "Seasons & Rankings" → đọc full design.

### Bước 2: Backend — season CRUD + leaderboard controls
### Bước 3: Frontend — match Stitch
### Bước 4: Verify + Tests + Regression
- Commit: "feat: admin seasons — synced from Stitch"
```

---

## Prompt C7: Events (implement + Stitch sync)

```
Implement Events admin. Hiện stub 36 LOC.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query "Events & Tournaments" → đọc design.

### Bước 2: Backend — tournament admin CRUD + cancel + force-end
### Bước 3: Frontend — match Stitch
### Bước 4: Verify + Tests + Regression
- Commit: "feat: admin events — synced from Stitch"
```

---

## Prompt C8: Groups Admin (NEW + Stitch sync)

```
Tạo Groups admin page MỚI.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query "Groups Admin" → flagged section, table, detail view, lock/unlock UI.

### Bước 2: Backend — AdminGroupController + Flyway (is_locked, lock_reason)
### Bước 3: Frontend — match Stitch. Route /admin/groups.
### Bước 4: Verify + Tests + Regression
- Commit: "feat: admin groups — synced from Stitch"
```

---

## Prompt C9: Notifications Admin (NEW + Stitch sync)

```
Tạo Notifications admin MỚI.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query "Notifications Admin" → compose form, history, automated toggles.

### Bước 2: Backend — AdminNotificationController
### Bước 3: Frontend — match Stitch. Route /admin/notifications.
### Bước 4: Verify + Tests + Regression
- Commit: "feat: admin notifications — synced from Stitch"
```

---

## Prompt C10: Configuration (NEW + Stitch sync)

```
Tạo Configuration admin MỚI.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query "Configuration Management" → grouped cards, inline edit, warning.

### Bước 2: Backend — AdminConfigController + Flyway (app_config table + seed defaults)
### Bước 3: Frontend — match Stitch. Route /admin/config.
### Bước 4: Verify + Tests + Regression
- Commit: "feat: admin configuration — synced from Stitch"
```

---

## Prompt C11: Export Center (NEW + Stitch sync)

```
Tạo Export Center MỚI.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query "Export Center" → export cards, job history.

### Bước 2: Backend — AdminExportController (async jobs + download)
### Bước 3: Frontend — match Stitch. Route /admin/export.
### Bước 4: Verify + Tests + Regression
- Commit: "feat: admin export center — synced from Stitch"
```

---

## Prompt C12: Question Quality (NEW + Stitch sync)

```
Tạo Question Quality dashboard MỚI.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query "Question Quality Dashboard" → score card, problem tables, charts.

### Bước 2: Backend — QuestionQualityController
### Bước 3: Frontend — match Stitch. Route /admin/question-quality.
### Bước 4: Verify + Tests + Regression
- Commit: "feat: admin question quality — synced from Stitch"
```

---

## Prompt C13: Dashboard (NEW + Stitch sync)

```
Tạo Admin Dashboard. Trang mặc định /admin. Làm GẦN CUỐI vì aggregate data.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Bước 1: Sync Stitch (BẮT BUỘC)
MCP query "Admin Dashboard" → KPI cards, coverage map, action items, charts.

### Bước 2: Backend — GET /api/admin/dashboard aggregate endpoint
### Bước 3: Frontend — match Stitch. Route /admin (index).
### Bước 4: Verify + Tests + Regression
- Commit: "feat: admin dashboard — synced from Stitch"
```

---

## Prompt C15: Content Moderator Role (CUỐI CÙNG)

```
Implement phân quyền content_mod. Cần tất cả pages tồn tại trước.

TRƯỚC KHI CODE: ghi tasks vào TODO.md.

### Backend: update @PreAuthorize
- Review Queue: hasAnyRole('ADMIN', 'CONTENT_MOD')
- Feedback GET: hasAnyRole('ADMIN', 'CONTENT_MOD')
- Tất cả khác: hasRole('ADMIN') only

### Frontend:
- AdminLayout: hide nav items per role
- Content mod: Dashboard (read-only) + Review Queue + Feedback (read-only)
- Direct URL access other pages → "Không có quyền"

### Tests + Regression
- Commit: "feat: content moderator role"
```

---

## Execution Order

```
Stitch trước (14 designs) → rồi Claude Code:

C0:  Admin button sidebar
C1:  Tests existing (safety net)
C2:  Split AIGenerator + Stitch sync
C3:  Split Questions + Stitch sync
C4:  AI quota + Stitch sync
C14: Sync existing pages + AdminLayout
C5:  Users (Stitch sync)
C6:  Rankings (Stitch sync)
C7:  Events (Stitch sync)
C8:  Groups (Stitch sync)
C9:  Notifications (Stitch sync)
C10: Configuration (Stitch sync)
C11: Export Center (Stitch sync)
C12: Question Quality (Stitch sync)
C13: Dashboard (Stitch sync)
C15: Content Mod role

Expected:
| Metric | Hiện tại | Kết thúc |
|--------|---------|----------|
| Admin pages | 4 full + 3 stub | 14 full + 0 stub |
| Admin tests | 0 | ~120+ |
| LOC violations | 2 | 0 |
| Stitch synced | 0 | 14/14 (100%) |
| SPEC compliance | ~60% | ~98% |
```
