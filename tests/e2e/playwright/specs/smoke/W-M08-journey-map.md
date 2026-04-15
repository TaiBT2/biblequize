# W-M08 — Bible Journey Map (L1 Smoke)

**Routes:** `/journey`
**Spec ref:** SPEC_USER §8

---

### W-M08-L1-001 — Journey page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @journey @critical

**Setup**: none

**Preconditions**:
- User đã đăng nhập (không bắt buộc — route không yêu cầu auth theo code)

**Actions**:
1. `page.goto('/journey')`
2. `page.waitForSelector('[data-testid="journey-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/journey')`
- `expect(page.getByTestId('journey-page')).toBeVisible()`
- `expect(page.getByTestId('journey-summary-card')).toBeVisible()`
- `expect(page.getByTestId('journey-old-testament')).toBeVisible()`
- `expect(page.getByTestId('journey-new-testament')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: journey-page] — wrapper trang Journey
- [NEEDS TESTID: journey-summary-card] — card tổng quan (mastery %, completed/in-progress/locked)
- [NEEDS TESTID: journey-old-testament] — section Cựu Ước
- [NEEDS TESTID: journey-new-testament] — section Tân Ước

---

### W-M08-L1-002 — Summary card hiển thị mastery % đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @journey

**Setup**: none

**Preconditions**:
- User đã đăng nhập, có history với ít nhất 1 quyển sách đã học

**Actions**:
1. `page.goto('/journey')`
2. `page.waitForSelector('[data-testid="journey-summary-card"]')`

**Assertions**:
- `expect(page.getByTestId('journey-mastery-pct')).toBeVisible()`
- `expect(page.getByTestId('journey-mastery-pct')).toHaveText(/\d+%/)`
- `expect(page.getByTestId('journey-books-completed')).toBeVisible()`
- `expect(page.getByTestId('journey-books-inprogress')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: journey-mastery-pct] — text "X%" overall mastery
- [NEEDS TESTID: journey-books-completed] — số sách đã hoàn thành (màu xanh)
- [NEEDS TESTID: journey-books-inprogress] — số sách đang học (màu xanh dương)

---

### W-M08-L1-003 — Book card hiển thị đúng trạng thái

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @journey

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/journey')`
2. `page.waitForSelector('[data-testid="journey-book-card"]')`

**Assertions**:
- `expect(page.getByTestId('journey-book-card').first()).toBeVisible()`
- `expect(page.getByTestId('journey-book-card').first().getByTestId('journey-book-name')).toBeVisible()`
- `expect(page.getByTestId('journey-book-card').first().getByTestId('journey-book-mastery')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: journey-book-card] — mỗi book card
- [NEEDS TESTID: journey-book-name] — tên sách (Vi hoặc En tùy ngôn ngữ)
- [NEEDS TESTID: journey-book-mastery] — progress bar hoặc % mastery
- [NEEDS TESTID: journey-book-status-icon] — icon trạng thái (check_circle/lock/menu_book)

---

### W-M08-L1-004 — Click book card → navigate to Practice với filter sách đó

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @smoke @journey

**Setup**: none

**Preconditions**:
- User đã đăng nhập, có book cards hiển thị

**Actions**:
1. `page.goto('/journey')`
2. `page.waitForSelector('[data-testid="journey-book-card"]')`
3. Click vào book card đầu tiên không bị locked
4. `page.waitForURL(/\/practice/)`

**Assertions**:
- `expect(page).toHaveURL(/\/practice/)`
- `expect(page.url()).toContain('book=')` ← URL có query param `book=`

**Cleanup**: none

**Notes**:
- Book cards navigate sang `/practice?book={bookName}`
- Locked books không navigate (disabled)

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Journey page | `journey-page` | Journey.tsx |
| Summary card | `journey-summary-card` | Journey.tsx |
| Mastery % | `journey-mastery-pct` | Journey.tsx |
| Books completed count | `journey-books-completed` | Journey.tsx |
| Books in-progress count | `journey-books-inprogress` | Journey.tsx |
| Old Testament section | `journey-old-testament` | Journey.tsx |
| New Testament section | `journey-new-testament` | Journey.tsx |
| Book card | `journey-book-card` | Journey.tsx |
| Book name | `journey-book-name` | Journey.tsx |
| Book mastery bar | `journey-book-mastery` | Journey.tsx |
| Book status icon | `journey-book-status-icon` | Journey.tsx |
