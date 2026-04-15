# A-M07 — Feedback & Moderation (L1 Smoke)

**Routes:** `/admin/feedback`
**Spec ref:** SPEC_ADMIN §7

---

### A-M07-L1-001 — Feedback page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @feedback @critical

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/feedback')`
2. `page.waitForSelector('[data-testid="admin-feedback-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/feedback')`
- `expect(page.getByTestId('admin-feedback-page')).toBeVisible()`
- `expect(page.getByTestId('feedback-stats-cards')).toBeVisible()`
- `expect(page.getByTestId('feedback-table')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-feedback-page] — wrapper
- [NEEDS TESTID: feedback-stats-cards] — cards pending/in_progress/resolved/rejected
- [NEEDS TESTID: feedback-table] — bảng feedback

---

### A-M07-L1-002 — Stats cards hiển thị đủ trạng thái

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @feedback

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/feedback')`
2. `page.waitForSelector('[data-testid="feedback-stats-cards"]')`

**Assertions**:
- `expect(page.getByTestId('feedback-stat-pending')).toBeVisible()`
- `expect(page.getByTestId('feedback-stat-resolved')).toBeVisible()`
- `expect(page.getByTestId('feedback-stat-rejected')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: feedback-stat-pending] — card "Chờ Xử Lý"
- [NEEDS TESTID: feedback-stat-resolved] — card "Đã Giải Quyết"
- [NEEDS TESTID: feedback-stat-rejected] — card "Đã Từ Chối"

---

### A-M07-L1-003 — Filter feedback theo status

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @smoke @admin @feedback

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/feedback')`
2. `page.waitForSelector('[data-testid="feedback-status-filter"]')`
3. `page.getByTestId('feedback-status-filter').selectOption('pending')`
4. `page.waitForResponse('/api/admin/feedback*')`

**Assertions**:
- `expect(page.getByTestId('feedback-table').locator('[data-testid="feedback-row"]')
    .filter({ hasText: /pending|chờ/i })).toHaveCount({ min: 0 })`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: feedback-status-filter] — dropdown filter status
- [NEEDS TESTID: feedback-row] — mỗi hàng feedback

---

### A-M07-L1-004 — Click feedback → mở detail modal + update status

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @smoke @admin @feedback @write

**Setup**: none

**Preconditions**:
- Có feedback với status pending

**Actions**:
1. `page.goto('/admin/feedback')`
2. `page.getByTestId('feedback-row').first().click()`
3. `page.waitForSelector('[data-testid="feedback-detail-modal"]')`
4. `page.getByTestId('feedback-status-select').selectOption('in_progress')`
5. `page.getByTestId('feedback-update-btn').click()`

**Assertions**:
- `expect(page.getByTestId('feedback-detail-modal')).toBeVisible()`
- `expect(page.getByTestId('feedback-detail-modal')).toContainText(/in_progress|đang xử lý/i)`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: feedback-detail-modal] — modal chi tiết
- [NEEDS TESTID: feedback-status-select] — selector thay đổi status
- [NEEDS TESTID: feedback-update-btn] — nút cập nhật

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Feedback page | `admin-feedback-page` | admin/Feedback.tsx |
| Stats cards | `feedback-stats-cards` | admin/Feedback.tsx |
| Stat pending | `feedback-stat-pending` | admin/Feedback.tsx |
| Stat resolved | `feedback-stat-resolved` | admin/Feedback.tsx |
| Stat rejected | `feedback-stat-rejected` | admin/Feedback.tsx |
| Status filter | `feedback-status-filter` | admin/Feedback.tsx |
| Feedback table | `feedback-table` | admin/Feedback.tsx |
| Feedback row | `feedback-row` | admin/Feedback.tsx |
| Detail modal | `feedback-detail-modal` | admin/Feedback.tsx |
| Status select | `feedback-status-select` | admin/Feedback.tsx |
| Update button | `feedback-update-btn` | admin/Feedback.tsx |
