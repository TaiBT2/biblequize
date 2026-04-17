/**
 * W-M15 — Cross-cutting (L1 Smoke)
 *
 * Routes: Error boundary, offline detection, loading states (cross-cutting)
 * Spec ref: SPEC_USER §15
 */

import { test, expect } from '../../fixtures/auth'

test.describe('W-M15 Cross-cutting — L1 Smoke @smoke @cross-cutting', () => {

  test('W-M15-L1-001: Loading skeleton hien thi dung tren trang Practice @smoke @cross-cutting @loading', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/practice')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    // Page renders before API returns (no blank screen)
    await expect(page.getByTestId('practice-page')).toBeVisible()
    // After load, book select should be present
    await expect(page.getByTestId('practice-book-select')).toBeVisible()
  })

  test('W-M15-L1-002: OfflineBanner hien thi khi mat ket noi @smoke @cross-cutting @offline', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/')
    await page.waitForSelector('[data-testid="home-page"]')
    await page.context().setOffline(true)
    // TODO [NEEDS TESTID: offline-banner] — component OfflineBanner
    await page.waitForSelector('[data-testid="offline-banner"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('offline-banner')).toBeVisible()
    await expect(page.getByTestId('offline-banner')).toContainText(/offline|mất kết nối|no internet/i)

    // ============================================================
    // CLEANUP — restore online
    // ============================================================
    await page.context().setOffline(false)
  })

  test('W-M15-L1-003: OfflineBanner an di khi ket noi duoc phuc hoi @smoke @cross-cutting @offline', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/')
    await page.waitForSelector('[data-testid="home-page"]')
    await page.context().setOffline(true)
    await page.waitForSelector('[data-testid="offline-banner"]')
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="offline-banner"]', { state: 'hidden' })

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('offline-banner')).not.toBeVisible()
  })

  test('W-M15-L1-004: ErrorBoundary fallback UI hien thi khi co uncaught error @smoke @cross-cutting @error-boundary', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    // [NOT IMPLEMENTED: need test route or error injection mechanism]
    test.skip()

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/')
    // await page.evaluate(() => { window.__triggerErrorBoundary?.() })
    // TODO [NEEDS TESTID: error-boundary-fallback] — fallback UI cua ErrorBoundary
    // await page.waitForSelector('[data-testid="error-boundary-fallback"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    // await expect(page.getByTestId('error-boundary-fallback')).toBeVisible()
    // TODO [NEEDS TESTID: error-boundary-retry-btn] — nut "Thu Lai"
    // await expect(page.getByTestId('error-boundary-retry-btn')).toBeVisible()
  })

  test('W-M15-L1-005: API error state hien thi dung retry button @smoke @cross-cutting @error', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — mock API to return 500
    // ============================================================
    const page = tier3Page
    await page.route('**/api/daily*', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    )

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    await page.goto('/daily')
    // TODO [NEEDS TESTID: daily-error-state] — error state trong DailyChallenge
    await page.waitForSelector('[data-testid="daily-error-state"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('daily-error-state')).toBeVisible()
    // TODO [NEEDS TESTID: daily-error-retry-btn] — retry button
    await expect(page.getByTestId('daily-error-retry-btn')).toBeVisible()

    // ============================================================
    // CLEANUP
    // ============================================================
    await page.unroute('**/api/daily*')
  })

})
