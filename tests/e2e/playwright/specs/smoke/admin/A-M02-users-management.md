# A-M02 — Users Management (L1 Smoke)

**Routes:** `/admin/users`
**Spec ref:** SPEC_ADMIN §2

---

### A-M02-L1-001 — Users list page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @users @critical

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/users')`
2. `page.waitForSelector('[data-testid="admin-users-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/users')`
- `expect(page.getByTestId('admin-users-page')).toBeVisible()`
- `expect(page.getByTestId('admin-users-table')).toBeVisible()`
- `expect(page.getByTestId('admin-users-search')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-users-page] — wrapper
- [NEEDS TESTID: admin-users-table] — bảng danh sách users
- [NEEDS TESTID: admin-users-search] — input search

---

### A-M02-L1-002 — Search users theo email

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @smoke @admin @users

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập, có user test1@dev.local

**Actions**:
1. `page.goto('/admin/users')`
2. `page.waitForSelector('[data-testid="admin-users-search"]')`
3. `page.getByTestId('admin-users-search').fill('test1@dev.local')`
4. `page.waitForResponse('/api/admin/users*')`

**Assertions**:
- `expect(page.getByTestId('admin-users-table').locator('[data-testid="admin-user-row"]')).toHaveCount(1)`
- `expect(page.getByTestId('admin-user-row').first()).toContainText('test1@dev.local')`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-user-row] — mỗi hàng user trong bảng

---

### A-M02-L1-003 — Click user row → mở user detail modal

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @smoke @admin @users

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/users')`
2. `page.waitForSelector('[data-testid="admin-user-row"]')`
3. `page.getByTestId('admin-user-row').first().click()`
4. `page.waitForSelector('[data-testid="admin-user-detail-modal"]')`

**Assertions**:
- `expect(page.getByTestId('admin-user-detail-modal')).toBeVisible()`
- `expect(page.getByTestId('admin-user-detail-email')).toBeVisible()`
- `expect(page.getByTestId('admin-user-ban-btn')).toBeVisible()`

**Cleanup**:
- Close modal

**Notes**:
- [NEEDS TESTID: admin-user-detail-modal] — modal chi tiết user
- [NEEDS TESTID: admin-user-detail-email] — email display
- [NEEDS TESTID: admin-user-ban-btn] — nút Ban

---

### A-M02-L1-004 — Ban user với lý do

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @smoke @admin @users @write

**Setup**:
- `POST /api/admin/test/users/{userId}/full-reset` để đảm bảo user không bị ban

**Preconditions**:
- User test1@dev.local không bị ban

**Actions**:
1. `page.goto('/admin/users')`
2. Search "test1@dev.local" → click row → mở modal
3. `page.getByTestId('admin-user-ban-btn').click()`
4. `page.waitForSelector('[data-testid="admin-ban-reason-input"]')`
5. `page.getByTestId('admin-ban-reason-input').fill('E2E test ban')`
6. `page.getByTestId('admin-ban-confirm-btn').click()`

**Assertions**:
- `expect(page.getByTestId('admin-user-row').first()).toContainText(/banned|cấm/i)` ← user hiện status banned

**Cleanup**:
- `PATCH /api/admin/users/{userId}/ban` với `{banned: false}` để unban

**Notes**:
- [NEEDS TESTID: admin-ban-reason-input] — input lý do ban (min 10 chars)
- [NEEDS TESTID: admin-ban-confirm-btn] — confirm ban button

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Users page | `admin-users-page` | admin/Users.tsx |
| Users table | `admin-users-table` | admin/Users.tsx |
| Search input | `admin-users-search` | admin/Users.tsx |
| User row | `admin-user-row` | admin/Users.tsx |
| User detail modal | `admin-user-detail-modal` | admin/Users.tsx |
| User email in modal | `admin-user-detail-email` | admin/Users.tsx |
| Ban button | `admin-user-ban-btn` | admin/Users.tsx |
| Ban reason input | `admin-ban-reason-input` | admin/Users.tsx |
| Ban confirm | `admin-ban-confirm-btn` | admin/Users.tsx |
