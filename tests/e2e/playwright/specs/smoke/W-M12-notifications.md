# W-M12 — Notifications (L1 Smoke)

**Routes:** AppLayout notification area (no dedicated page)
**Spec ref:** SPEC_USER §11

---

### W-M12-L1-001 — Notification icons visible trong AppLayout header

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @notifications

**Setup**: none

**Preconditions**:
- User đã đăng nhập (AppLayout render)

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="app-header"]')`

**Assertions**:
- `expect(page.getByTestId('app-header')).toBeVisible()`
- `expect(page.getByTestId('header-notification-area')).toBeVisible()` ← area chứa 3 icons

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: app-header] — sticky header trong AppLayout
- [NEEDS TESTID: header-notification-area] — vùng chứa icon favorite/bolt/stars
- Hiện tại 3 icons (favorite, bolt, stars) trong header là decorative/placeholder — chưa có notification dropdown
- [NOT IMPLEMENTED: notification dropdown/panel chưa có — icons hiện là static]

---

### W-M12-L1-002 — Notification badge hiển thị khi có unread

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @notifications

**Setup**:
- `POST /api/admin/notifications/send` để tạo notification cho user

**Preconditions**:
- User có ít nhất 1 unread notification

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="notification-badge"]')`

**Assertions**:
- `expect(page.getByTestId('notification-badge')).toBeVisible()`
- `expect(page.getByTestId('notification-badge')).toHaveText(/\d+/)` ← số unread

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: notification-badge] — badge số unread
- [NOT IMPLEMENTED: notification badge chưa được implement — hiện chỉ có static icons]

---

### W-M12-L1-003 — Click notification icon → mở notification panel

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @notifications

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/')`
2. `page.getByTestId('header-notification-btn').click()`
3. `page.waitForSelector('[data-testid="notification-panel"]')`

**Assertions**:
- `expect(page.getByTestId('notification-panel')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: header-notification-btn] — icon button để mở panel
- [NEEDS TESTID: notification-panel] — dropdown/panel danh sách notifications
- [NOT IMPLEMENTED: notification panel chưa có]

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| App header | `app-header` | AppLayout.tsx |
| Notification area | `header-notification-area` | AppLayout.tsx |
| Notification button | `header-notification-btn` | AppLayout.tsx |
| Notification badge | `notification-badge` | AppLayout.tsx |
| Notification panel | `notification-panel` | AppLayout.tsx |

---

## NOT IMPLEMENTED Summary

| Feature | Notes |
|---------|-------|
| Notification dropdown/panel | Hiện chỉ có static icons (favorite, bolt, stars) trong header |
| Notification badge (unread count) | Chưa implement |
| Click-to-open notification list | Chưa implement |
