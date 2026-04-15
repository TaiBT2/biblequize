# A-M06 — Review Queue (L1 Smoke)

**Routes:** `/admin/review-queue`
**Spec ref:** SPEC_ADMIN §6

---

### A-M06-L1-001 — Review Queue page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @review @critical

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/review-queue')`
2. `page.waitForSelector('[data-testid="review-queue-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/review-queue')`
- `expect(page.getByTestId('review-queue-page')).toBeVisible()`
- `expect(page.getByTestId('review-queue-stats')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: review-queue-page] — wrapper
- [NEEDS TESTID: review-queue-stats] — stats section (pending for me, total, actions today)

---

### A-M06-L1-002 — Question items visible với approve/reject buttons

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @review

**Setup**:
- Cần có ít nhất 1 question trong review queue

**Preconditions**:
- Admin đã đăng nhập, có pending question

**Actions**:
1. `page.goto('/admin/review-queue')`
2. `page.waitForSelector('[data-testid="review-queue-item"]')`

**Assertions**:
- `expect(page.getByTestId('review-queue-item')).toHaveCount({ min: 1 })`
- `expect(page.getByTestId('review-approve-btn').first()).toBeVisible()`
- `expect(page.getByTestId('review-reject-btn').first()).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: review-queue-item] — mỗi question card trong queue
- [NEEDS TESTID: review-approve-btn] — approve button
- [NEEDS TESTID: review-reject-btn] — reject button

---

### A-M06-L1-003 — Approve question → approval count tăng

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @smoke @admin @review @write

**Setup**:
- Có question đang chờ review

**Preconditions**:
- Có ít nhất 1 question trong queue

**Actions**:
1. `page.goto('/admin/review-queue')`
2. `page.waitForSelector('[data-testid="review-approve-btn"]')`
3. `const countBefore = await page.getByTestId('review-queue-item').count()`
4. `page.getByTestId('review-approve-btn').first().click()`
5. `page.waitForResponse('/api/admin/review*')`

**Assertions**:
- `expect(page.getByTestId('review-queue-item')).toHaveCount(countBefore - 1)` ← item removed sau approve
  ← HOẶC item vẫn hiển thị nhưng progress tăng (nếu cần 2 admin approve)

**Cleanup**: none

---

### A-M06-L1-004 — Reject question với comment

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @smoke @admin @review @write

**Setup**: none

**Preconditions**:
- Có ít nhất 1 question trong queue

**Actions**:
1. `page.goto('/admin/review-queue')`
2. `page.waitForSelector('[data-testid="review-reject-btn"]')`
3. `page.getByTestId('review-reject-btn').first().click()`
4. `page.waitForSelector('[data-testid="review-reject-comment"]')`
5. `page.getByTestId('review-reject-comment').fill('Câu hỏi không rõ ràng')`
6. `page.getByTestId('review-reject-confirm-btn').click()`

**Assertions**:
- `expect(page.getByTestId('review-reject-comment')).not.toBeVisible()` ← form đóng sau submit

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: review-reject-comment] — textarea nhập lý do reject
- [NEEDS TESTID: review-reject-confirm-btn] — confirm reject

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Review queue page | `review-queue-page` | admin/ReviewQueue.tsx |
| Stats section | `review-queue-stats` | admin/ReviewQueue.tsx |
| Queue item | `review-queue-item` | admin/ReviewQueue.tsx |
| Approve button | `review-approve-btn` | admin/ReviewQueue.tsx |
| Reject button | `review-reject-btn` | admin/ReviewQueue.tsx |
| Reject comment | `review-reject-comment` | admin/ReviewQueue.tsx |
| Reject confirm | `review-reject-confirm-btn` | admin/ReviewQueue.tsx |
