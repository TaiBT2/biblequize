# A-M09 — Events & Tournaments Admin (L1 Smoke)

**Routes:** `/admin/events`
**Spec ref:** SPEC_ADMIN §9

---

### A-M09-L1-001 — Events page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @events @critical

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/events')`
2. `page.waitForSelector('[data-testid="admin-events-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/events')`
- `expect(page.getByTestId('admin-events-page')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-events-page] — wrapper

---

### A-M09-L1-002 — Tournament list hiển thị với status badges

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @events

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập, có tournaments trong DB

**Actions**:
1. `page.goto('/admin/events')`
2. `page.waitForSelector('[data-testid="admin-tournament-row"]')`

**Assertions**:
- `expect(page.getByTestId('admin-tournament-row')).toHaveCount({ min: 1 })`
- `expect(page.getByTestId('admin-tournament-row').first().getByTestId('tournament-status-badge')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-tournament-row] — mỗi hàng tournament
- [NEEDS TESTID: tournament-status-badge] — badge status (dùng lại từ W-M07 nếu chung component)
- Hiện implementation: read-only view, dùng `/api/tournaments` public endpoint

---

### A-M09-L1-003 — Create tournament button visible

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @events

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/events')`
2. `page.waitForSelector('[data-testid="admin-events-page"]')`

**Assertions**:
- `expect(page.getByTestId('create-tournament-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: create-tournament-btn] — nút "Tạo Tournament"
- [NOT IMPLEMENTED: create tournament form chưa implement — hiện chỉ read-only list]

---

### A-M09-L1-004 — Bracket size và round info hiển thị

**Priority**: P2
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @events

**Setup**: none

**Preconditions**:
- Có tournament đang IN_PROGRESS

**Actions**:
1. `page.goto('/admin/events')`
2. `page.waitForSelector('[data-testid="admin-tournament-row"]')`

**Assertions**:
- `expect(page.getByTestId('admin-tournament-row').first().getByTestId('tournament-bracket-size')).toBeVisible()`
- `expect(page.getByTestId('admin-tournament-row').first().getByTestId('tournament-round-info')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: tournament-bracket-size] — hiển thị bracket size (vd: 8, 16)
- [NEEDS TESTID: tournament-round-info] — vòng hiện tại / tổng vòng

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Events page | `admin-events-page` | admin/Events.tsx |
| Tournament row | `admin-tournament-row` | admin/Events.tsx |
| Status badge | `tournament-status-badge` | admin/Events.tsx |
| Bracket size | `tournament-bracket-size` | admin/Events.tsx |
| Round info | `tournament-round-info` | admin/Events.tsx |
| Create button | `create-tournament-btn` | admin/Events.tsx |

---

## NOT IMPLEMENTED Summary

| Feature | Notes |
|---------|-------|
| Create/edit tournament form | Events admin hiện chỉ read-only, dùng public endpoint |
