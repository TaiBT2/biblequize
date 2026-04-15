# A-M08 — Seasons & Rankings (L1 Smoke)

**Routes:** `/admin/rankings`
**Spec ref:** SPEC_ADMIN §8

---

### A-M08-L1-001 — Rankings page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @rankings @critical

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/rankings')`
2. `page.waitForSelector('[data-testid="admin-rankings-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/rankings')`
- `expect(page.getByTestId('admin-rankings-page')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-rankings-page] — wrapper Rankings admin

---

### A-M08-L1-002 — Active season hiển thị (nếu có)

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @rankings

**Setup**: none

**Preconditions**:
- Có active season (seed data)

**Actions**:
1. `page.goto('/admin/rankings')`
2. `page.waitForSelector('[data-testid="active-season-banner"]')`

**Assertions**:
- `expect(page.getByTestId('active-season-banner')).toBeVisible()`
- `expect(page.getByTestId('active-season-name')).toBeVisible()`
- `expect(page.getByTestId('end-season-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: active-season-banner] — banner season đang active
- [NEEDS TESTID: active-season-name] — tên season
- [NEEDS TESTID: end-season-btn] — nút "Kết Thúc Mùa" (destructive)

---

### A-M08-L1-003 — Create new season form visible

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @rankings

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/rankings')`
2. `page.waitForSelector('[data-testid="create-season-form"]')`

**Assertions**:
- `expect(page.getByTestId('create-season-form')).toBeVisible()`
- `expect(page.getByTestId('create-season-name-input')).toBeVisible()`
- `expect(page.getByTestId('create-season-submit-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: create-season-form] — form tạo season mới
- [NEEDS TESTID: create-season-name-input] — input tên season
- [NEEDS TESTID: create-season-submit-btn] — nút "Tạo Mùa Giải"

---

### A-M08-L1-004 — Inactive seasons list hiển thị

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @rankings

**Setup**: none

**Preconditions**:
- Có ít nhất 1 season đã kết thúc

**Actions**:
1. `page.goto('/admin/rankings')`
2. `page.waitForSelector('[data-testid="inactive-seasons-list"]')`

**Assertions**:
- `expect(page.getByTestId('inactive-seasons-list')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: inactive-seasons-list] — danh sách seasons đã kết thúc

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Rankings page | `admin-rankings-page` | admin/Rankings.tsx |
| Active season banner | `active-season-banner` | admin/Rankings.tsx |
| Active season name | `active-season-name` | admin/Rankings.tsx |
| End season button | `end-season-btn` | admin/Rankings.tsx |
| Create season form | `create-season-form` | admin/Rankings.tsx |
| Season name input | `create-season-name-input` | admin/Rankings.tsx |
| Create submit | `create-season-submit-btn` | admin/Rankings.tsx |
| Inactive list | `inactive-seasons-list` | admin/Rankings.tsx |
