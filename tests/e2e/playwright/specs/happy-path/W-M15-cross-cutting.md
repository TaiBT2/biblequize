# W-M15 — Cross-cutting (L2 Happy Path)

**Routes:** N/A (cross-cutting)
**Spec ref:** SPEC_USER §15, §14
**Module priority:** Tier 4 (error boundary, offline recovery, loading states)

---

## W-M15-L2-001 — Error boundary: component throws → fallback UI

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @cross-cutting @error @parallel-safe

**Setup**:
- Mock `GET /api/me` to return 500 server error

**Actions**:
1. `page.route('/api/me', route => route.fulfill({ status: 500 }))`
2. `page.goto('/')`

**Assertions** (UI):
- `expect(page.getByTestId('error-boundary')).toBeVisible()` hoặc
- `expect(page.getByText(/something went wrong|có lỗi/i)).toBeVisible()`
- "Reload" or "Retry" button visible

---

## W-M15-L2-002 — API retry after error: click retry → network recovered → data loaded

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: storageState=tier3
**Tags**: @happy-path @cross-cutting @error @parallel-safe

**Actions**:
1. Mock first GET /api/me → 500
2. Goto `/`
3. Unmock
4. Click retry button
5. Verify page loads successfully

**Assertions**:
- After retry, home page renders normally

---

## W-M15-L2-003 — Offline mode: setOffline(true) → OfflineBanner visible

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @cross-cutting @offline @parallel-safe

**Actions**:
1. `page.goto('/')`
2. `page.context().setOffline(true)`
3. Wait for offline detection (navigator.onLine event)

**Assertions**:
- `expect(page.getByTestId('offline-banner')).toBeVisible()`
- `expect(page.getByText(/offline|mất kết nối/i)).toBeVisible()`

**Cleanup**:
- `page.context().setOffline(false)`

---

## W-M15-L2-004 — Offline recovery: setOffline(false) → banner disappears

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @cross-cutting @offline @parallel-safe

**Actions**:
1. `page.goto('/')`
2. `page.context().setOffline(true)`
3. Verify banner visible
4. `page.context().setOffline(false)`

**Assertions**:
- Banner disappears sau khi online
- UI functional again

---

## W-M15-L2-005 — Loading skeleton: slow API → skeleton visible → real content after

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @cross-cutting @loading @parallel-safe

**Actions**:
1. `page.route('/api/me', async route => { await new Promise(r => setTimeout(r, 2000)); route.continue() })`
2. `page.goto('/')`

**Assertions**:
- Initially: skeleton placeholders visible
- After 2s: real content replaces skeleton

---

## W-M15-L2-006 — Rate limiting: 100+ rapid requests → 429 Too Many Requests

**Priority**: P2
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @cross-cutting @security @write @serial

**Actions**:
1. Make 100+ parallel GET /api/me requests via `Promise.all`

**API Verification**:
- At least 1 response có status 429
- Rate limit headers `X-RateLimit-Remaining`, `X-RateLimit-Reset` present

**Notes**:
- Rate limit filter tồn tại trong `infrastructure/security/` — verify config
- Careful: tránh rate-limit throttling test itself — use fresh user

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 5s |
| L2-002 | 6s |
| L2-003 | 5s |
| L2-004 | 5s |
| L2-005 | 5s |
| L2-006 | 8s |
| **Total** | **~34s** |

---

## Summary
- **6 cases** (matches estimate)
- **P0**: 2 | **P1**: 3 | **P2**: 1
- **Runtime**: ~34s
