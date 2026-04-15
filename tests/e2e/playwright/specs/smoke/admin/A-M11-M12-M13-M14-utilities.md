# A-M11 + A-M12 + A-M13 + A-M14 — Utilities Admin (L1 Smoke)

**Routes:** `/admin/notifications`, `/admin/config`, `/admin/export`, `/admin/question-quality`
**Spec ref:** SPEC_ADMIN §11–14

---

## A-M11 — Notifications Broadcast

### A-M11-L1-001 — Notifications admin page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @notifications @critical

**Actions**:
1. `page.goto('/admin/notifications')`
2. `page.waitForSelector('[data-testid="admin-notifications-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/notifications')`
- `expect(page.getByTestId('admin-notifications-page')).toBeVisible()`
- `expect(page.getByTestId('notifications-broadcast-form')).toBeVisible()`
- `expect(page.getByTestId('notifications-history')).toBeVisible()`

**Notes**:
- [NEEDS TESTID: admin-notifications-page] — wrapper
- [NEEDS TESTID: notifications-broadcast-form] — form title + content
- [NEEDS TESTID: notifications-history] — section lịch sử notifications

---

### A-M11-L1-002 — Broadcast form: fill và submit

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=admin
**Tags**: @smoke @admin @notifications @write

**Actions**:
1. `page.goto('/admin/notifications')`
2. `page.getByTestId('notifications-title-input').fill('Test Broadcast')`
3. `page.getByTestId('notifications-content-input').fill('Thông báo E2E test')`
4. `page.getByTestId('notifications-send-btn').click()`

**Assertions**:
- `expect(page.getByTestId('notifications-success-toast')).toBeVisible()` ← toast thành công

**Notes**:
- [NEEDS TESTID: notifications-title-input] — input tiêu đề
- [NEEDS TESTID: notifications-content-input] — textarea nội dung
- [NEEDS TESTID: notifications-send-btn] — nút "Gửi Thông Báo"
- [NEEDS TESTID: notifications-success-toast] — toast
- [NOT IMPLEMENTED: broadcast endpoint dùng setTimeout placeholder — chưa có real API]

---

## A-M12 — Configuration

### A-M12-L1-001 — Configuration page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @config @critical

**Actions**:
1. `page.goto('/admin/config')`
2. `page.waitForSelector('[data-testid="admin-config-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/config')`
- `expect(page.getByTestId('admin-config-page')).toBeVisible()`
- `expect(page.getByTestId('config-game-panel')).toBeVisible()` ← panel Game
- `expect(page.getByTestId('config-scoring-panel')).toBeVisible()` ← panel Scoring

**Notes**:
- [NEEDS TESTID: admin-config-page] — wrapper
- [NEEDS TESTID: config-game-panel] — panel Game config
- [NEEDS TESTID: config-scoring-panel] — panel Scoring config

---

### A-M12-L1-002 — Thay đổi giá trị → "Save N changes" button active

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=admin
**Tags**: @smoke @admin @config

**Actions**:
1. `page.goto('/admin/config')`
2. `page.waitForSelector('[data-testid="config-game-panel"]')`
3. `page.getByTestId('config-daily-energy-input').fill('90')` ← thay đổi 1 giá trị
4. `page.waitForSelector('[data-testid="config-save-btn"]')`

**Assertions**:
- `expect(page.getByTestId('config-save-btn')).toBeEnabled()`
- `expect(page.getByTestId('config-save-btn')).toContainText(/Save 1 change/i)`

**Notes**:
- [NEEDS TESTID: config-daily-energy-input] — input daily energy value
- [NEEDS TESTID: config-save-btn] — "Save N changes" button
- [NOT IMPLEMENTED: save endpoint `/api/admin/config` chưa implement — button là stub]

---

## A-M13 — Export Center

### A-M13-L1-001 — Export Center page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @export @critical

**Actions**:
1. `page.goto('/admin/export')`
2. `page.waitForSelector('[data-testid="admin-export-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/export')`
- `expect(page.getByTestId('admin-export-page')).toBeVisible()`
- `expect(page.getByTestId('export-questions-card')).toBeVisible()`
- `expect(page.getByTestId('export-users-card')).toBeVisible()`

**Notes**:
- [NEEDS TESTID: admin-export-page] — wrapper ExportCenter
- [NEEDS TESTID: export-questions-card] — card export Questions
- [NEEDS TESTID: export-users-card] — card export Users
- [NOT IMPLEMENTED: tất cả export buttons dùng `alert("API not implemented")`]

---

### A-M13-L1-002 — Export format buttons visible trên mỗi card

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @export

**Actions**:
1. `page.goto('/admin/export')`
2. `page.waitForSelector('[data-testid="export-questions-card"]')`

**Assertions**:
- `expect(page.getByTestId('export-questions-card').getByTestId('export-btn-csv')).toBeVisible()`
- `expect(page.getByTestId('export-questions-card').getByTestId('export-btn-json')).toBeVisible()`

**Notes**:
- [NEEDS TESTID: export-btn-csv] — nút CSV trong mỗi export card
- [NEEDS TESTID: export-btn-json] — nút JSON trong mỗi export card

---

## A-M14 — Question Quality

### A-M14-L1-001 — Question Quality page render đúng

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @quality @critical

**Actions**:
1. `page.goto('/admin/question-quality')`
2. `page.waitForSelector('[data-testid="admin-quality-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/admin/question-quality')`
- `expect(page.getByTestId('admin-quality-page')).toBeVisible()`
- `expect(page.getByTestId('quality-overall-score')).toBeVisible()`
- `expect(page.getByTestId('quality-coverage-map')).toBeVisible()`

**Notes**:
- [NEEDS TESTID: admin-quality-page] — wrapper
- [NEEDS TESTID: quality-overall-score] — score tổng (hiện hardcoded 72/100)
- [NEEDS TESTID: quality-coverage-map] — coverage bars by book

---

### A-M14-L1-002 — Coverage map hiển thị books với progress bars

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=admin
**Tags**: @smoke @admin @quality

**Actions**:
1. `page.goto('/admin/question-quality')`
2. `page.waitForSelector('[data-testid="quality-coverage-map"]')`

**Assertions**:
- `expect(page.getByTestId('quality-coverage-map').locator('[data-testid="coverage-book-bar"]')).toHaveCount({ min: 1 })`
- `expect(page.getByTestId('coverage-book-bar').first().getByTestId('coverage-pct')).toBeVisible()`

**Notes**:
- [NEEDS TESTID: coverage-book-bar] — mỗi sách trong coverage map
- [NEEDS TESTID: coverage-pct] — % coverage cho mỗi sách

---

## NEEDS TESTID Summary (A-M11 through A-M14)

| Element | Suggested testid | File |
|---------|-----------------|------|
| Notifications page | `admin-notifications-page` | admin/Notifications.tsx |
| Broadcast form | `notifications-broadcast-form` | admin/Notifications.tsx |
| Title input | `notifications-title-input` | admin/Notifications.tsx |
| Content input | `notifications-content-input` | admin/Notifications.tsx |
| Send button | `notifications-send-btn` | admin/Notifications.tsx |
| Success toast | `notifications-success-toast` | admin/Notifications.tsx |
| Notifications history | `notifications-history` | admin/Notifications.tsx |
| Config page | `admin-config-page` | admin/Configuration.tsx |
| Game panel | `config-game-panel` | admin/Configuration.tsx |
| Scoring panel | `config-scoring-panel` | admin/Configuration.tsx |
| Daily energy input | `config-daily-energy-input` | admin/Configuration.tsx |
| Save button | `config-save-btn` | admin/Configuration.tsx |
| Export page | `admin-export-page` | admin/ExportCenter.tsx |
| Questions card | `export-questions-card` | admin/ExportCenter.tsx |
| Users card | `export-users-card` | admin/ExportCenter.tsx |
| CSV button | `export-btn-csv` | admin/ExportCenter.tsx |
| JSON button | `export-btn-json` | admin/ExportCenter.tsx |
| Quality page | `admin-quality-page` | admin/QuestionQuality.tsx |
| Overall score | `quality-overall-score` | admin/QuestionQuality.tsx |
| Coverage map | `quality-coverage-map` | admin/QuestionQuality.tsx |
| Coverage book bar | `coverage-book-bar` | admin/QuestionQuality.tsx |
| Coverage pct | `coverage-pct` | admin/QuestionQuality.tsx |

---

## NOT IMPLEMENTED Summary

| Feature | Module | Notes |
|---------|--------|-------|
| Broadcast send API | A-M11 | `setTimeout` placeholder, chưa có real endpoint |
| Config save API | A-M12 | `TODO` comment — `/api/admin/config` chưa implement |
| All export actions | A-M13 | `alert("API not implemented")` cho tất cả export types |
| Quality score dynamic | A-M14 | Score 72/100 hardcoded, endpoint problem APIs missing |
