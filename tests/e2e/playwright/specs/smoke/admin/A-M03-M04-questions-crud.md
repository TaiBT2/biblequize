# A-M03 + A-M04 — Questions CRUD + Duplicate Detection (L1 Smoke)

**Routes:** `/admin/questions`
**Spec ref:** SPEC_ADMIN §3, §4

---

### A-M03-L1-001 — Questions list page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @questions @critical

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập, có questions trong DB

**Actions**:
1. `page.goto('/admin/questions')`
2. `page.waitForSelector('[data-testid="admin-questions-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/questions')`
- `expect(page.getByTestId('admin-questions-page')).toBeVisible()`
- `expect(page.getByTestId('admin-questions-table')).toBeVisible()`
- `expect(page.getByTestId('admin-questions-add-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-questions-page] — wrapper
- [NEEDS TESTID: admin-questions-table] — bảng questions
- [NEEDS TESTID: admin-questions-add-btn] — nút "+ Thêm Câu Hỏi"

---

### A-M03-L1-002 — Filter questions theo sách

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @smoke @admin @questions

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/questions')`
2. `page.waitForSelector('[data-testid="admin-questions-book-filter"]')`
3. `page.getByTestId('admin-questions-book-filter').selectOption('Genesis')`
4. `page.waitForResponse('/api/admin/questions*')`

**Assertions**:
- `expect(page.getByTestId('admin-questions-table').locator('[data-testid="admin-question-row"]')).toHaveCount({ min: 1 })`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: admin-questions-book-filter] — dropdown filter theo sách
- [NEEDS TESTID: admin-question-row] — mỗi hàng question

---

### A-M03-L1-003 — Mở Create Question modal

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @questions

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập

**Actions**:
1. `page.goto('/admin/questions')`
2. `page.getByTestId('admin-questions-add-btn').click()`
3. `page.waitForSelector('[data-testid="question-form-modal"]')`

**Assertions**:
- `expect(page.getByTestId('question-form-modal')).toBeVisible()`
- `expect(page.getByTestId('question-content-input')).toBeVisible()`
- `expect(page.getByTestId('question-save-btn')).toBeVisible()`

**Cleanup**:
- Close modal

**Notes**:
- [NEEDS TESTID: question-form-modal] — modal Create/Edit
- [NEEDS TESTID: question-content-input] — textarea nội dung câu hỏi
- [NEEDS TESTID: question-save-btn] — nút "Lưu"

---

### A-M04-L1-001 — Duplicate detection: tạo câu hỏi giống → hiển thị warning

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: storageState=admin
**Tags**: @smoke @admin @questions @duplicate-detection

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập
- Đã có question với content gần giống trong DB

**Actions**:
1. `page.goto('/admin/questions')`
2. Click "+ Thêm" → mở modal
3. Fill content với text tương tự question đã có
4. `page.getByTestId('question-content-input').blur()` ← trigger duplicate check
5. `page.waitForSelector('[data-testid="duplicate-warning"]')`

**Assertions**:
- `expect(page.getByTestId('duplicate-warning')).toBeVisible()`
- `expect(page.getByTestId('duplicate-warning')).toContainText(/Similar questions found|câu hỏi tương tự/i)`

**Cleanup**:
- Close modal (không save)

**Notes**:
- [NEEDS TESTID: duplicate-warning] — modal/banner cảnh báo câu hỏi giống
- Duplicate check gọi `POST /api/admin/questions/check-duplicate`
- 2-layer: POSSIBLE_DUPLICATE (similarity score) và DUPLICATE (exact match)

---

### A-M03-L1-004 — Edit question → lưu thành công

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: storageState=admin
**Tags**: @smoke @admin @questions @write

**Setup**: none

**Preconditions**:
- Admin đã đăng nhập, có question để edit

**Actions**:
1. `page.goto('/admin/questions')`
2. `page.waitForSelector('[data-testid="admin-question-row"]')`
3. `page.getByTestId('admin-question-row').first().getByTestId('question-edit-btn').click()`
4. `page.waitForSelector('[data-testid="question-form-modal"]')`
5. Thay đổi difficulty (click difficulty selector)
6. `page.getByTestId('question-save-btn').click()`

**Assertions**:
- `expect(page.getByTestId('question-form-modal')).not.toBeVisible()` ← modal đóng sau save
- `expect(page.getByTestId('admin-questions-success-toast')).toBeVisible()` ← toast thành công

**Cleanup**: none (revert change nếu cần)

**Notes**:
- [NEEDS TESTID: question-edit-btn] — nút Edit trên mỗi hàng
- [NEEDS TESTID: admin-questions-success-toast] — toast "Đã lưu thành công"

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Questions page | `admin-questions-page` | admin/Questions.tsx |
| Questions table | `admin-questions-table` | admin/Questions.tsx |
| Add button | `admin-questions-add-btn` | admin/Questions.tsx |
| Book filter | `admin-questions-book-filter` | admin/Questions.tsx |
| Question row | `admin-question-row` | admin/Questions.tsx |
| Edit button | `question-edit-btn` | admin/Questions.tsx |
| Form modal | `question-form-modal` | admin/Questions.tsx |
| Content input | `question-content-input` | admin/Questions.tsx |
| Save button | `question-save-btn` | admin/Questions.tsx |
| Duplicate warning | `duplicate-warning` | admin/Questions.tsx |
| Success toast | `admin-questions-success-toast` | admin/Questions.tsx |
