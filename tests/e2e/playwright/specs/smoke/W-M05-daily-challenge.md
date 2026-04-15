# W-M05 — Daily Challenge (L1 Smoke)

**Routes:** `/daily`
**Spec ref:** SPEC_USER §5.3

---

### W-M05-L1-001 — Trang Daily Challenge render đúng (chưa chơi hôm nay)

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @daily @critical

**Setup**:
- `POST /api/admin/test/users/{userId}/full-reset` — đảm bảo chưa chơi daily hôm nay

**Preconditions**:
- User đã đăng nhập, chưa hoàn thành daily challenge hôm nay

**Actions**:
1. `page.goto('/daily')`
2. `page.waitForSelector('[data-testid="daily-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/daily')`
- `expect(page.getByTestId('daily-page')).toBeVisible()`
- `expect(page.getByTestId('daily-streak-display')).toBeVisible()`
- `expect(page.getByTestId('daily-start-btn')).toBeVisible()`
- `expect(page.getByTestId('daily-start-btn')).toBeEnabled()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: daily-page] — wrapper trang DailyChallenge
- [NEEDS TESTID: daily-streak-display] — streak hiện tại (vd: "🔥 12 ngày")
- [NEEDS TESTID: daily-start-btn] — nút "Bắt Đầu Thử Thách"

---

### W-M05-L1-002 — Countdown timer đến midnight hiển thị

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @daily

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/daily')`
2. `page.waitForSelector('[data-testid="daily-countdown"]')`

**Assertions**:
- `expect(page.getByTestId('daily-countdown')).toBeVisible()`
- `expect(page.getByTestId('daily-countdown')).toHaveText(/\d{2}:\d{2}:\d{2}/)` ← format HH:MM:SS

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: daily-countdown] — countdown tới midnight reset
- Countdown đếm ngược tới 00:00 UTC+7

---

### W-M05-L1-003 — Click "Bắt Đầu" → vào quiz mode daily

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @daily @critical

**Setup**:
- `POST /api/admin/test/users/{userId}/full-reset`

**Preconditions**:
- User chưa chơi daily hôm nay

**Actions**:
1. `page.goto('/daily')`
2. `page.waitForSelector('[data-testid="daily-start-btn"]')`
3. `page.getByTestId('daily-start-btn').click()`
4. `page.waitForURL('/quiz')`

**Assertions**:
- `expect(page).toHaveURL('/quiz')`
- `expect(page.getByTestId('quiz-question-text')).toBeVisible()`

**Cleanup**: none (session auto-completes hoặc expire)

**Notes**:
- Gọi `POST /api/daily/sessions` để tạo session với mode=daily
- Redirect sang `/quiz` với params mode='daily'

---

### W-M05-L1-004 — Leaderboard section hiển thị top users

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @daily

**Setup**: none

**Preconditions**:
- Seed data đã chạy (có users đã chơi daily)

**Actions**:
1. `page.goto('/daily')`
2. `page.waitForSelector('[data-testid="daily-leaderboard"]')`

**Assertions**:
- `expect(page.getByTestId('daily-leaderboard')).toBeVisible()`
- `expect(page.getByTestId('daily-leaderboard').locator('[data-testid="daily-leaderboard-row"]')).toHaveCount({ min: 1 })`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: daily-leaderboard] — section bảng xếp hạng daily
- [NEEDS TESTID: daily-leaderboard-row] — mỗi hàng user

---

### W-M05-L1-005 — Đã hoàn thành hôm nay → button disabled + result hiển thị

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @smoke @daily

**Setup**:
- Hoàn thành daily challenge qua API: `POST /api/daily/complete-test` (nếu có)
- Hoặc: navigate through quiz flow và complete

**Preconditions**:
- User đã hoàn thành daily hôm nay (score trong DB)

**Actions**:
1. `page.goto('/daily')`
2. `page.waitForSelector('[data-testid="daily-page"]')`

**Assertions**:
- `expect(page.getByTestId('daily-start-btn')).toBeDisabled()` ← hoặc không hiển thị
- `expect(page.getByTestId('daily-completed-badge')).toBeVisible()` ← "Đã hoàn thành hôm nay"
- `expect(page.getByTestId('daily-score-display')).toBeVisible()` ← score hôm nay

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: daily-completed-badge] — badge "Đã Hoàn Thành" (checkmark)
- [NEEDS TESTID: daily-score-display] — score/stars đã đạt hôm nay
- [NOT IMPLEMENTED: cần endpoint test-helper để mark daily completed mà không qua full quiz flow]

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Daily page wrapper | `daily-page` | DailyChallenge.tsx |
| Streak display | `daily-streak-display` | DailyChallenge.tsx |
| Start button | `daily-start-btn` | DailyChallenge.tsx |
| Countdown timer | `daily-countdown` | DailyChallenge.tsx |
| Leaderboard section | `daily-leaderboard` | DailyChallenge.tsx |
| Leaderboard row | `daily-leaderboard-row` | DailyChallenge.tsx |
| Completed badge | `daily-completed-badge` | DailyChallenge.tsx |
| Score display | `daily-score-display` | DailyChallenge.tsx |

---

## NOT IMPLEMENTED Summary

| Feature | Notes |
|---------|-------|
| Mark daily completed via test helper | Cần `POST /api/admin/test/users/{id}/complete-daily` để set W-M05-L1-005 |
