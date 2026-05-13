# PROMPT: Fix Notification Panel — Dedup + NaN bug + UI Redesign

> **Goal:** Fix 2 P0 bugs + redesign notification panel theo mockup mới.
> **Reference mockup:** `MOCKUP_NOTIFICATION_PANEL.html` (8 notification types, 3 states: full/empty/all-read)
> **Stop policy:** Commit riêng từng task. STOP sau mỗi commit để confirm trước khi tiếp tục.
> **Verification first:** Grep/read code thực tế trước khi implement — KHÔNG assume từ tên file/field.

---

## 🔍 Context & Bugs

### Bug #1 — "NaN ngày trước" (P0, FE)
Screenshot user cho thấy tất cả notifications hiển thị `"NaN ngày trước"`. Nguyên nhân khả nghi: `formatDistanceToNow(new Date(invalidValue))` trả NaN khi `createdAt` từ backend là null/undefined/string không parse được.

### Bug #2 — Spam duplicate notifications (P0, BE)
Screenshot show 4 notifications giống hệt nhau ("Streak sắp gãy! Streak 2 ngày..."). `NotificationScheduler` chạy `@Scheduled` hourly check streak warning mà KHÔNG dedup — mỗi giờ tạo 1 notification mới cho cùng user, cùng type.

### Bug #3 — Visual + UX issues (P1, FE)
Bell icon position lệch, square white border lạc lõng, dropdown z-index/position sai, không phân biệt read/unread, thiếu empty state, badge color sai palette, dropdown width hẹp gây text wrap nhiều dòng. Chi tiết trong mockup file.

---

## ✅ Pre-Flight Verification (mandatory)

Trước khi implement task nào, chạy các grep/read sau và confirm output:

### BE Verification
```bash
# 1. Find NotificationScheduler — confirm exact path + existing logic
find apps/api/src/main -name "NotificationScheduler.java"
cat apps/api/src/main/java/com/biblequiz/modules/notification/scheduler/NotificationScheduler.java
# (path may differ — adjust based on find result)

# 2. Find NotificationService methods
grep -rn "createNotification\|create(" apps/api/src/main/java/com/biblequiz/modules/notification/service/

# 3. Find NotificationEntity field names (createdAt? created_at?)
cat apps/api/src/main/java/com/biblequiz/modules/notification/entity/NotificationEntity.java

# 4. Find existing repo queries
cat apps/api/src/main/java/com/biblequiz/modules/notification/repository/NotificationRepository.java
```

### FE Verification
```bash
# 1. Find current notification dropdown — could be in Header.tsx, AppLayout.tsx, or NotificationPanel.tsx
grep -rn "notifications\|Thông báo\|markAsRead\|markAllAsRead" apps/web/src/components/ apps/web/src/pages/AppLayout.tsx apps/web/src/components/Header.tsx 2>/dev/null

# 2. Find date formatting usage — locate the NaN bug source
grep -rn "formatDistanceToNow\|createdAt" apps/web/src/components/ | grep -i notif

# 3. Confirm field name from backend response (createdAt vs created_at)
grep -rn "Notification" apps/web/src/api/types.ts apps/web/src/api/

# 4. Verify date-fns + locale vi already installed
grep -E "date-fns" apps/web/package.json
```

**STOP và báo cáo các findings này trước khi vào Task 1.** Đặc biệt:
- Field name notification timestamp: `createdAt` hay `created_at`?
- Notification panel hiện đang ở component nào?
- NotificationScheduler trigger streak warning ở method nào?

---

## 📋 Tasks

### Task 1: BE — Dedup logic trong NotificationScheduler ⚠️ P0

**Goal:** Mỗi loại notification chỉ tạo 1 lần per user trong 24h. Nếu đã có cùng `type + userId` chưa đọc trong 24h gần nhất → skip.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/notification/repository/NotificationRepository.java`
- `apps/api/src/main/java/com/biblequiz/modules/notification/service/NotificationService.java`
- `apps/api/src/main/java/com/biblequiz/modules/notification/scheduler/NotificationScheduler.java`

**Implementation:**

1. Add repository query:
```java
// NotificationRepository.java
@Query("SELECT n FROM NotificationEntity n WHERE n.userId = :userId AND n.type = :type AND n.createdAt > :since")
List<NotificationEntity> findRecentByUserAndType(
    @Param("userId") UUID userId,
    @Param("type") String type,
    @Param("since") Instant since
);
```

2. Add helper method trong `NotificationService`:
```java
public boolean hasRecentNotification(UUID userId, String type, Duration window) {
    Instant since = Instant.now().minus(window);
    return !notificationRepository.findRecentByUserAndType(userId, type, since).isEmpty();
}

public NotificationEntity createIfNotDuplicate(UUID userId, String type, String title, String message, Map<String, Object> metadata) {
    if (hasRecentNotification(userId, type, Duration.ofHours(24))) {
        log.debug("Skipping duplicate notification: user={}, type={}", userId, type);
        return null;
    }
    return create(userId, type, title, message, metadata);
}
```

3. Update `NotificationScheduler` để gọi `createIfNotDuplicate` thay vì `create` cho streak warning + daily reminder:
```java
// Trong streak warning loop
notificationService.createIfNotDuplicate(
    user.getId(),
    "STREAK_WARNING",
    "Streak sắp gãy!",
    String.format("Streak %d ngày của bạn sắp gãy — chơi hôm nay để giữ chuỗi", user.getCurrentStreak()),
    Map.of("streakDays", user.getCurrentStreak())
);
```

**Note:** ĐỪNG dedup cho event-triggered notifications (tier-up, badge unlock, group invite, challenge). Chỉ dedup scheduled/repeating ones (streak warning, daily reminder).

**Tests** (`NotificationServiceTest.java`):
- `createIfNotDuplicate_skipsWhenRecentExists` — đã có notification cùng type 1h trước → return null
- `createIfNotDuplicate_createsWhenOlderThan24h` — notification 25h trước → tạo mới
- `createIfNotDuplicate_createsWhenDifferentType` — STREAK_WARNING vs DAILY_READY → tạo cả 2
- `createIfNotDuplicate_createsWhenDifferentUser` — cùng type, user khác → tạo cả 2

**Tầng 1 test:** `./mvnw test -Dtest=NotificationServiceTest`
**Tầng 2 test:** `./mvnw test -Dtest=NotificationSchedulerTest`

**Commit message:** `fix(notification): dedup scheduler notifications within 24h window`

**STOP — confirm BE tests pass trước khi vào Task 2.**

---

### Task 2: FE — Date formatting NaN guard utility ⚠️ P0

**Goal:** Tạo helper `formatRelativeTime(input)` xử lý null/undefined/invalid → return chuỗi rỗng thay vì "NaN ngày trước".

**Files:**
- `apps/web/src/utils/dateFormat.ts` (new)
- `apps/web/src/utils/__tests__/dateFormat.test.ts` (new)

**Implementation:**
```typescript
// apps/web/src/utils/dateFormat.ts
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import i18n from '../i18n';

/**
 * Safe relative time formatter.
 * Returns "" if input is null/undefined/invalid date.
 * Never returns "NaN ngày trước" or similar bug strings.
 */
export function formatRelativeTime(input: string | Date | null | undefined): string {
  if (input == null) return '';

  const date = typeof input === 'string' ? parseISO(input) : input;
  if (!isValid(date)) return '';

  const locale = i18n.language === 'en' ? enUS : vi;
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale });
  } catch {
    return '';
  }
}
```

**Tests** (min 6):
- `returns empty for null` → `formatRelativeTime(null) === ''`
- `returns empty for undefined`
- `returns empty for invalid string` → `formatRelativeTime('not-a-date') === ''`
- `returns empty for empty string`
- `formats valid ISO string in vi locale` → contains "trước" hoặc "vừa"
- `formats Date object correctly`

**Tầng 1 test:** `cd apps/web && npx vitest run src/utils/__tests__/dateFormat.test.ts`

**Commit message:** `feat(web): safe relative time formatter — fixes "NaN ngày trước" bug`

**STOP — confirm tests pass.**

---

### Task 3: FE — NotificationPanel.tsx component (redesign)

**Goal:** Tạo component mới theo mockup `MOCKUP_NOTIFICATION_PANEL.html`. Tách logic dropdown ra khỏi `AppLayout.tsx` / `Header.tsx`.

**Files:**
- `apps/web/src/components/NotificationPanel.tsx` (new)
- `apps/web/src/components/__tests__/NotificationPanel.test.tsx` (new)
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (thêm strings)

**Component API:**
```typescript
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement>;  // for outside-click detection
}
```

**Implementation guidance:**

1. **Data fetching** — dùng existing TanStack Query:
```typescript
const { data: notifications = [], isLoading } = useQuery({
  queryKey: ['notifications'],
  queryFn: () => api.get('/api/notifications').then(r => r.data),
  staleTime: 30_000,
  enabled: isOpen,
});
```

2. **Type → icon + color mapping** (dùng theo mockup, hardcoded hex KHÔNG CSS variables):
```typescript
const NOTIF_STYLE: Record<string, { emoji: string; bgClass: string }> = {
  STREAK_WARNING: { emoji: '🔥', bgClass: 'bg-[rgba(239,107,94,0.15)]' },
  TIER_UP:        { emoji: '🏆', bgClass: 'bg-[rgba(232,168,50,0.18)]' },
  DAILY_READY:    { emoji: '📖', bgClass: 'bg-[rgba(127,184,232,0.15)]' },
  GROUP_INVITE:   { emoji: '👥', bgClass: 'bg-[rgba(141,179,139,0.15)]' },
  CHALLENGE:      { emoji: '⚔️', bgClass: 'bg-[rgba(239,107,94,0.15)]' },
  BADGE_UNLOCK:   { emoji: '🎖️', bgClass: 'bg-[rgba(232,168,50,0.18)]' },
  BOOK_COMPLETE:  { emoji: '📕', bgClass: 'bg-[rgba(141,179,139,0.15)]' },
  TOURNAMENT:     { emoji: '🏟️', bgClass: 'bg-[rgba(127,184,232,0.15)]' },
};

function getStyle(type: string) {
  return NOTIF_STYLE[type] ?? { emoji: '🔔', bgClass: 'bg-[rgba(255,255,255,0.06)]' };
}
```

**⚠️ Verify type strings BE → FE match.** Grep BE để confirm `STREAK_WARNING` enum/constant value đúng.

3. **3 states render:**
   - `notifications.length === 0` → empty state (bell-off icon + "Chưa có thông báo")
   - All read (`unreadCount === 0` but có items) → list dimmed, "Đọc tất cả" disabled
   - Mixed → render normal với gold dot cho unread

4. **Layout per mockup:**
   - Position: `absolute top-[64px] right-[80px] w-[400px] max-h-[540px]`
   - Background: `rgba(28,30,40,0.96)` với `backdrop-blur-md`
   - Border: `1px solid rgba(232,168,50,0.18)`
   - Triangle pointer chỉ vào bell (top-right)
   - Header: title "Thông báo" + subtitle "X chưa đọc" + button "Đọc tất cả"
   - List: scrollable, max-height 400px
   - Footer: "Xem tất cả thông báo →" link sang `/notifications`

5. **Item structure:**
```jsx
<button onClick={() => handleClick(notif)} className={`flex gap-3 px-5 py-3.5 w-full text-left transition-colors ${notif.read ? '' : 'bg-[rgba(232,168,50,0.05)]'}`}>
  <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[20px] ${getStyle(notif.type).bgClass}`}>
    {getStyle(notif.type).emoji}
  </div>
  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
    <div className={`text-sm leading-snug ${notif.read ? 'font-medium text-[#b8bac2]' : 'font-semibold text-[#e8e9ed]'}`}>
      {notif.title}
    </div>
    <div className="text-[13px] text-[#b8bac2] leading-[1.4] line-clamp-2">
      {notif.message}
    </div>
    <div className="text-[11px] text-[#6b6e7a] font-medium mt-1 flex items-center gap-1.5">
      <span className="material-symbols-outlined text-[12px]">schedule</span>
      {formatRelativeTime(notif.createdAt)}
    </div>
  </div>
  {!notif.read && (
    <div className="absolute top-[18px] right-4 w-2 h-2 rounded-full bg-[#e8a832] shadow-[0_0_8px_rgba(232,168,50,0.6)]" />
  )}
</button>
```

6. **Click behavior:**
   - Click item → `mutateMarkAsRead(id)` → invalidate `['notifications']` → navigate (giữ logic existing trong Header.tsx)
   - Click "Đọc tất cả" → `mutateMarkAllAsRead()` → invalidate
   - Click outside → call `onClose()`
   - ESC key → call `onClose()`

7. **i18n strings cần thêm:**
```json
// vi.json
"notifications.title": "Thông báo",
"notifications.unread_count": "{{count}} chưa đọc",
"notifications.all_read": "Đã đọc hết",
"notifications.mark_all": "Đọc tất cả",
"notifications.empty_title": "Chưa có thông báo",
"notifications.empty_desc": "Khi có hoạt động mới — streak, lên hạng, hoặc lời mời nhóm — bạn sẽ thấy ở đây",
"notifications.view_all": "Xem tất cả thông báo"
```

**Tests** (min 10):
- Renders empty state when notifications array is empty
- Renders all 8 type icons correctly
- Unread items have gold dot indicator
- Read items rendered dimmed
- "Đọc tất cả" disabled when 0 unread
- Click item triggers markAsRead mutation
- Click "Đọc tất cả" triggers markAllAsRead
- ESC closes panel
- Click outside closes panel
- `formatRelativeTime` integration — invalid `createdAt` doesn't show "NaN"
- Footer link only renders when `notifications.length > 0`
- i18n: subtitle shows "X chưa đọc" not English

**Tầng 1 test:** `cd apps/web && npx vitest run src/components/__tests__/NotificationPanel.test.tsx`

**Commit message:** `feat(web): NotificationPanel component with redesign per mockup`

**STOP — confirm tests pass.**

---

### Task 4: FE — Wire NotificationPanel vào AppLayout + fix bell button

**Goal:** Replace existing bell dropdown bằng `NotificationPanel`. Fix bell button position + styling.

**Files:**
- `apps/web/src/pages/AppLayout.tsx` (or `Header.tsx` — verify từ Pre-Flight grep)
- `apps/web/src/pages/__tests__/AppLayout.test.tsx`

**Implementation:**

1. **Bell button styling (per mockup):**
```jsx
<button
  ref={bellRef}
  onClick={() => setNotifOpen(o => !o)}
  className="relative w-10 h-10 rounded-[10px] bg-[rgba(50,52,64,0.5)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(70,72,88,0.8)] hover:border-[rgba(232,168,50,0.3)] transition-colors flex items-center justify-center"
  aria-label={t('notifications.title')}
>
  <span className="material-symbols-outlined text-[22px] text-[#e8e9ed]">notifications</span>
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px] bg-[#ef6b5e] text-white rounded-[9px] text-[10px] font-bold flex items-center justify-center border-2 border-[#11131e] leading-none">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</button>

<NotificationPanel
  isOpen={notifOpen}
  onClose={() => setNotifOpen(false)}
  anchorRef={bellRef}
/>
```

2. **Position bell button:** verify nằm trong `header-right` div cùng row với avatar, KHÔNG floating absolute giữa header.

3. **Unread count source:** dùng existing query `['notifications', 'unread-count']` hoặc derive từ `notifications` query.

4. **Remove old dropdown code** từ `AppLayout.tsx` / `Header.tsx` — clean up legacy implementation.

**Tests:**
- Bell button renders with correct aria-label
- Badge shows unread count when > 0
- Badge hidden when unread = 0
- Badge shows "9+" when count >= 10
- Click bell toggles panel open/close
- Panel closed by default

**Tầng 1 test:** `cd apps/web && npx vitest run src/pages/__tests__/AppLayout.test.tsx`
**Tầng 2 test:** `cd apps/web && npx vitest run src/pages/`

**Commit message:** `feat(web): integrate NotificationPanel + fix bell button position/style`

**STOP — confirm tests pass.**

---

### Task 5: FE — Replace usage of formatDistanceToNow trong existing code

**Goal:** Search toàn bộ FE và replace direct `formatDistanceToNow` calls bằng `formatRelativeTime` từ Task 2 — defensive against same NaN bug elsewhere.

**Files:** any file matching grep result.

**Implementation:**
```bash
# Find all usages
grep -rn "formatDistanceToNow" apps/web/src/

# Replace each with formatRelativeTime(input) — keeping locale logic centralized
```

**Verify each replacement:** đảm bảo input có thể là null/undefined trong production data.

**Tests:** chạy lại tests cũ — không phải break.

**Tầng 3 test:** `cd apps/web && npx vitest run` (full FE suite)

**Commit message:** `refactor(web): use safe formatRelativeTime helper everywhere`

**STOP — confirm full FE suite pass (baseline 387+ tests).**

---

### Task 6: Full Regression + Lighthouse smoke

**Goal:** Confirm no regressions across BE + FE.

**Checks:**
```bash
# BE
cd apps/api && ./mvnw test
# Expect: 494+ pass (baseline from TODO)

# FE
cd apps/web && npx vitest run
# Expect: 387+ pass

# Build
cd apps/web && npm run build
# Expect: 0 errors

# Manual smoke (devtools console + visual):
# 1. Login → click bell → panel opens with proper position
# 2. Click outside → panel closes
# 3. Console should have NO "NaN" string anywhere
# 4. Notifications show proper time ("X phút trước", "Hôm qua", etc.)
# 5. Mark all as read → all dots disappear, items dim
# 6. Empty state: temporarily clear DB → reload → see empty state
```

**Commit message:** `test: full regression after notification panel fix`

---

## 📐 Design Tokens (Sacred Modernist) — KHÔNG dùng CSS variables

| Token | Hex |
|-------|-----|
| Navy bg | `#11131e` |
| Glass card bg | `rgba(28, 30, 40, 0.96)` (dropdown), `rgba(50, 52, 64, 0.5)` (bell button) |
| Gold primary | `#e8a832` |
| Gold light | `#f4c563` |
| Gold border | `rgba(232, 168, 50, 0.18)` |
| Gold tint (unread bg) | `rgba(232, 168, 50, 0.05)` |
| Coral (badge, streak) | `#ef6b5e` |
| Sky | `#7fb8e8` |
| Sage | `#8db38b` |
| Text primary | `#e8e9ed` |
| Text secondary | `#b8bac2` |
| Text muted | `#8a8d99` |
| Text faint | `#6b6e7a` |

Font: Be Vietnam Pro (existing).

---

## ⚠️ Common Pitfalls

1. **Field name mismatch:** Confirm BE response field tên `createdAt` (camelCase, Jackson default) — ĐỪNG assume `created_at`.
2. **Notification type strings:** Confirm exact enum/string value BE dùng (`STREAK_WARNING` vs `streak_warning` vs `streakWarning`).
3. **Type-icon fallback:** Map có 8 types từ mockup — nếu BE thêm type mới mà chưa có trong map, fallback `🔔` đảm bảo UI không crash.
4. **Click outside detection:** dùng `useEffect` với `mousedown` listener + check `anchorRef.current?.contains(target)` — KHÔNG đóng panel khi user click vào chính bell button (sẽ vô hiệu hóa toggle).
5. **Don't break web regression:** existing notification tests trong `Header.test.tsx` có thể fail nếu di chuyển component — update tests, không skip.
6. **Tier names trong notification messages:** dùng hệ canonical (Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ) — KHÔNG dùng Tia Sáng/Ánh Bình Minh kể cả nếu thấy trong SPEC v3.

---

## 🚦 Execution Protocol

1. Pre-Flight verification → report findings → wait confirm
2. Task 1 (BE dedup) → commit → STOP confirm
3. Task 2 (date util) → commit → STOP confirm
4. Task 3 (NotificationPanel) → commit → STOP confirm
5. Task 4 (AppLayout integration) → commit → STOP confirm
6. Task 5 (refactor) → commit → STOP confirm
7. Task 6 (regression) → commit → DONE

**Total expected commits:** 6
**Estimated effort:** 4-6h

---

## 📎 Reference Files

- Mockup: `MOCKUP_NOTIFICATION_PANEL.html` (in same outputs dir)
- Design tokens: `docs/designs/DESIGN_TOKENS.md`
- Existing code (verify in Pre-Flight):
  - `apps/api/src/main/java/com/biblequiz/modules/notification/`
  - `apps/web/src/components/Header.tsx` or `apps/web/src/pages/AppLayout.tsx`
  - `apps/web/src/i18n/vi.json`, `en.json`

---

*End of prompt.*
