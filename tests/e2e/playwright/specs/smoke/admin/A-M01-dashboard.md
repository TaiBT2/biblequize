# A-M01 — Admin Dashboard (L1 Smoke)

**Routes:** `/admin`
**Spec ref:** SPEC_ADMIN §1

---

### A-M01-L1-001 — Dashboard page render đúng (admin user)

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: fresh login as admin@biblequiz.test (role=ADMIN)
**Tags**: @smoke @admin @dashboard @critical

**Setup**: none

**Preconditions**:
- User có role ADMIN

**Actions**:
1. `page.goto('/admin')`
2. `page.waitForSelector('[data-testid="admin-dashboard-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin')`
- `expect(page.getByTestId('admin-dashboard-page')).toBeVisible()`
- `expect(page.getByTestId('admin-kpi-cards')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-dashboard-page] — wrapper trang AdminDashboard
- [NEEDS TESTID: admin-kpi-cards] — section KPI cards (questions, users, etc.)
- Non-admin truy cập `/admin` → redirect (test W-M01 đã cover auth guard)

---

### A-M01-L1-002 — KPI cards hiển thị đủ metrics

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @dashboard

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin')`
2. `page.waitForSelector('[data-testid="admin-kpi-cards"]')`

**Assertions**:
- `expect(page.getByTestId('kpi-total-questions')).toBeVisible()`
- `expect(page.getByTestId('kpi-total-users')).toBeVisible()`
- `expect(page.getByTestId('kpi-pending-review')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: kpi-total-questions] — card số lượng questions
- [NEEDS TESTID: kpi-total-users] — card số lượng users
- [NEEDS TESTID: kpi-pending-review] — card pending review queue

---

### A-M01-L1-003 — Activity log section hiển thị

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @dashboard

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin')`
2. `page.waitForSelector('[data-testid="admin-activity-log"]')`

**Assertions**:
- `expect(page.getByTestId('admin-activity-log')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-activity-log] — section "10 audit log gần nhất"

---

### A-M01-L1-004 — Non-admin redirect sang /login

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=tier3 (non-admin)
**Tags**: @smoke @admin @auth @critical

**Setup**: none

**Preconditions**:
- User có role USER (không phải ADMIN)

**Actions**:
1. `page.goto('/admin')`

**Assertions**:
- `expect(page).not.toHaveURL('/admin')` ← bị redirect
- `expect(page).toHaveURL(/\/login|\/|\/403/)` ← về login hoặc home

**Cleanup**: none

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Dashboard page | `admin-dashboard-page` | admin/Dashboard.tsx |
| KPI cards section | `admin-kpi-cards` | admin/Dashboard.tsx |
| KPI questions | `kpi-total-questions` | admin/Dashboard.tsx |
| KPI users | `kpi-total-users` | admin/Dashboard.tsx |
| KPI pending review | `kpi-pending-review` | admin/Dashboard.tsx |
| Activity log | `admin-activity-log` | admin/Dashboard.tsx |
