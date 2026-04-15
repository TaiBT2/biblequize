# A-M10 — Church Groups Admin (L1 Smoke)

**Routes:** `/admin/groups`
**Spec ref:** SPEC_ADMIN §10

---

### A-M10-L1-001 — Groups admin page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @groups @critical

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/groups')`
2. `page.waitForSelector('[data-testid="admin-groups-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/groups')`
- `expect(page.getByTestId('admin-groups-page')).toBeVisible()`
- `expect(page.getByTestId('admin-groups-list')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-groups-page] — wrapper
- [NEEDS TESTID: admin-groups-list] — danh sách groups

---

### A-M10-L1-002 — Group list hiển thị với member count và lock status

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @groups

**Setup**: none

**Preconditions**:
- Có ít nhất 1 group trong DB

**Actions**:
1. `page.goto('/admin/groups')`
2. `page.waitForSelector('[data-testid="admin-group-row"]')`

**Assertions**:
- `expect(page.getByTestId('admin-group-row')).toHaveCount({ min: 1 })`
- `expect(page.getByTestId('admin-group-row').first().getByTestId('group-member-count')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-group-row] — mỗi hàng group
- [NEEDS TESTID: group-member-count] — số thành viên
- [NEEDS TESTID: group-lock-badge] — badge public/private

---

### A-M10-L1-003 — Click group → mở detail modal với lock/unlock controls

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @smoke @admin @groups

**Setup**: none

**Preconditions**:
- Có ít nhất 1 group

**Actions**:
1. `page.goto('/admin/groups')`
2. `page.getByTestId('admin-group-row').first().click()`
3. `page.waitForSelector('[data-testid="admin-group-detail-modal"]')`

**Assertions**:
- `expect(page.getByTestId('admin-group-detail-modal')).toBeVisible()`
- `expect(page.getByTestId('group-lock-btn')).toBeVisible()` ← Lock button
- `expect(page.getByTestId('group-delete-btn')).toBeVisible()` ← Delete button

**Cleanup**:
- Close modal

**Notes**:
- [NEEDS TESTID: admin-group-detail-modal] — modal
- [NEEDS TESTID: group-lock-btn] — nút Lock/Unlock
- [NEEDS TESTID: group-delete-btn] — nút Delete (destructive)

---

### A-M10-L1-004 — Lock group với lý do

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @smoke @admin @groups @write

**Setup**: none

**Preconditions**:
- Group chưa bị lock (isPublic=true hoặc unlocked)

**Actions**:
1. `page.goto('/admin/groups')`
2. Click group row → mở modal
3. `page.getByTestId('group-lock-btn').click()`
4. `page.waitForSelector('[data-testid="group-lock-reason-input"]')`
5. `page.getByTestId('group-lock-reason-input').fill('Vi phạm quy tắc cộng đồng')`
6. `page.getByTestId('group-lock-confirm-btn').click()`

**Assertions**:
- `expect(page.getByTestId('admin-group-row').first().getByTestId('group-lock-badge')).toContainText(/locked|khóa/i)`

**Cleanup**:
- Unlock group via API hoặc modal

**Notes**:
- [NEEDS TESTID: group-lock-reason-input] — input lý do lock (min 10 chars)
- [NEEDS TESTID: group-lock-confirm-btn] — confirm lock

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Admin groups page | `admin-groups-page` | admin/Groups.tsx |
| Groups list | `admin-groups-list` | admin/Groups.tsx |
| Group row | `admin-group-row` | admin/Groups.tsx |
| Member count | `group-member-count` | admin/Groups.tsx |
| Lock badge | `group-lock-badge` | admin/Groups.tsx |
| Detail modal | `admin-group-detail-modal` | admin/Groups.tsx |
| Lock button | `group-lock-btn` | admin/Groups.tsx |
| Delete button | `group-delete-btn` | admin/Groups.tsx |
| Lock reason input | `group-lock-reason-input` | admin/Groups.tsx |
| Lock confirm | `group-lock-confirm-btn` | admin/Groups.tsx |
