# W-M15 — Cross-cutting (L1 Smoke)

**Routes:** Error boundary, offline detection, loading states (cross-cutting)
**Spec ref:** SPEC_USER §15

---

### W-M15-L1-001 — Loading skeleton hiển thị đúng trên trang Practice

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @cross-cutting @loading

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/practice')`
2. (Observe loading state xuất hiện trước khi data load)

**Assertions**:
- `expect(page.getByTestId('practice-page')).toBeVisible()` ← page render được (dù loading)
- Sau khi load xong: `expect(page.getByTestId('practice-book-select')).toBeVisible()`

**Cleanup**: none

**Notes**:
- Test xác nhận không có blank screen — page render trước khi API trả về

---

### W-M15-L1-002 — OfflineBanner hiển thị khi mất kết nối

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @cross-cutting @offline

**Setup**: none

**Preconditions**:
- User đã đăng nhập, browser đang online

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-page"]')`
3. `await page.context().setOffline(true)` ← simulate offline
4. `page.waitForSelector('[data-testid="offline-banner"]')`

**Assertions**:
- `expect(page.getByTestId('offline-banner')).toBeVisible()`
- `expect(page.getByTestId('offline-banner')).toContainText(/offline|mất kết nối/i)`

**Cleanup**:
- `await page.context().setOffline(false)` ← restore online

**Notes**:
- [NEEDS TESTID: offline-banner] — component OfflineBanner
- `OfflineBanner` dùng `useOnlineStatus` hook → lắng nghe event 'offline'/'online'

---

### W-M15-L1-003 — OfflineBanner ẩn đi khi kết nối được phục hồi

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @cross-cutting @offline

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/')`
2. `await page.context().setOffline(true)`
3. `page.waitForSelector('[data-testid="offline-banner"]')`
4. `await page.context().setOffline(false)`
5. `page.waitForSelector('[data-testid="offline-banner"]', { state: 'hidden' })`

**Assertions**:
- `expect(page.getByTestId('offline-banner')).not.toBeVisible()`

**Cleanup**: none

---

### W-M15-L1-004 — ErrorBoundary: fallback UI hiển thị khi có uncaught error

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @cross-cutting @error-boundary

**Setup**:
- Cần trigger error có kiểm soát — dùng test route hoặc inject error

**Preconditions**:
- Có route `/test-error` render component throw error (nếu tồn tại trong dev)
- Hoặc: inject error script

**Actions**:
1. `page.goto('/')`
2. `await page.evaluate(() => { window.__triggerErrorBoundary?.() })` ← nếu có helper
3. `page.waitForSelector('[data-testid="error-boundary-fallback"]')`

**Assertions**:
- `expect(page.getByTestId('error-boundary-fallback')).toBeVisible()`
- `expect(page.getByTestId('error-boundary-retry-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: error-boundary-fallback] — fallback UI của ErrorBoundary
- [NEEDS TESTID: error-boundary-retry-btn] — nút "Thử Lại" hoặc "Reload"
- ErrorBoundary gửi POST `/api/errors` với errorInfo khi catch

---

### W-M15-L1-005 — API error state hiển thị đúng (retry button)

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @smoke @cross-cutting @error

**Setup**:
- Mock API `/api/daily` để trả về 500

**Preconditions**:
- API trả về lỗi

**Actions**:
1. `await page.route('/api/daily*', route => route.fulfill({ status: 500 }))`
2. `page.goto('/daily')`
3. `page.waitForSelector('[data-testid="daily-error-state"]')`

**Assertions**:
- `expect(page.getByTestId('daily-error-state')).toBeVisible()`
- `expect(page.getByTestId('daily-error-retry-btn')).toBeVisible()`

**Cleanup**:
- `await page.unroute('/api/daily*')`

**Notes**:
- [NEEDS TESTID: daily-error-state] — error state trong DailyChallenge
- [NEEDS TESTID: daily-error-retry-btn] — retry button
- Dùng `page.route()` (Playwright network intercept) để mock API error

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Offline banner | `offline-banner` | OfflineBanner.tsx |
| Error boundary fallback | `error-boundary-fallback` | ErrorBoundary.tsx |
| Error boundary retry | `error-boundary-retry-btn` | ErrorBoundary.tsx |
| Daily error state | `daily-error-state` | DailyChallenge.tsx |
| Daily error retry | `daily-error-retry-btn` | DailyChallenge.tsx |
