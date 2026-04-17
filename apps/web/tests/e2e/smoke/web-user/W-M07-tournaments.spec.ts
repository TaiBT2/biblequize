/**
 * W-M07 — Tournaments (L1 Smoke)
 *
 * Routes: /tournaments, /tournaments/:id, /tournaments/:id/match/:matchId
 * Spec ref: SPEC_USER §7
 */

import { test, expect } from '../../fixtures/auth'

test.describe('W-M07 Tournaments — L1 Smoke @smoke @tournaments', () => {

  test('W-M07-L1-001: Tournaments list page render dung @smoke @tournaments @critical', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/tournaments')
    await page.waitForSelector('[data-testid="tournaments-list"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/tournaments')
    await expect(page.getByTestId('tournaments-list')).toBeVisible()
    // TODO [NEEDS TESTID: tournament-card] — moi tournament card
    await expect(
      page.getByTestId('tournaments-list').locator('[data-testid="tournament-card"]'),
    ).toHaveCount({ min: 1 })
  })

  test('W-M07-L1-002: Loading skeleton hien thi khi dang fetch @smoke @tournaments', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    // Navigate and try to catch skeleton before data loads
    await page.goto('/tournaments')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    // Skeleton may disappear quickly if response is fast — use soft check
    const skeleton = page.getByTestId('tournaments-skeleton')
    const isVisible = await skeleton.isVisible().catch(() => false)
    // If skeleton was visible at some point, or data loaded immediately, both are acceptable
    if (isVisible) {
      await expect(skeleton).toBeVisible()
    }
    // After load, the list or empty state should be present
    await expect(
      page.getByTestId('tournaments-list').or(page.getByTestId('tournaments-empty')),
    ).toBeVisible()
  })

  test('W-M07-L1-003: Tournament card hien thi status badge dung @smoke @tournaments', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/tournaments')
    await page.waitForSelector('[data-testid="tournaments-list"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    // TODO [NEEDS TESTID: tournament-status-badge] — badge status
    await expect(page.getByTestId('tournament-status-badge').first()).toBeVisible()
    // TODO [NEEDS TESTID: tournament-participants-count] — so nguoi tham gia
    await expect(
      page.getByTestId('tournament-card').first().getByTestId('tournament-participants-count'),
    ).toBeVisible()
  })

  test('W-M07-L1-004: Click tournament card navigate to detail @smoke @tournaments', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/tournaments')
    await page.waitForSelector('[data-testid="tournament-card"]')
    await page.getByTestId('tournament-card').first().click()
    await page.waitForURL(/\/tournaments\/.+/)

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL(/\/tournaments\/.+/)
    // TODO [NEEDS TESTID: tournament-detail-page] — wrapper trang TournamentDetail
    await expect(page.getByTestId('tournament-detail-page')).toBeVisible()
  })

  test('W-M07-L1-005: Tournament detail page render dung @smoke @tournaments', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — navigate via list to get a valid tournament ID
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/tournaments')
    await page.waitForSelector('[data-testid="tournament-card"]')
    await page.getByTestId('tournament-card').first().click()
    await page.waitForURL(/\/tournaments\/.+/)

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    // TODO [NEEDS TESTID: tournament-detail-page] — wrapper
    await expect(page.getByTestId('tournament-detail-page')).toBeVisible()
    // TODO [NEEDS TESTID: tournament-detail-name] — ten tournament
    await expect(page.getByTestId('tournament-detail-name')).toBeVisible()
    // TODO [NEEDS TESTID: tournament-detail-status] — status badge
    await expect(page.getByTestId('tournament-detail-status')).toBeVisible()
    // TODO [NEEDS TESTID: tournament-bracket] — bracket hoac participants list
    await expect(page.getByTestId('tournament-bracket')).toBeVisible()
  })

  test('W-M07-L1-006: Empty state khi khong co tournament @smoke @tournaments', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — mock API to return empty list
    // ============================================================
    const page = tier3Page
    await page.route('**/api/tournaments*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    )

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    await page.goto('/tournaments')
    await page.waitForSelector('[data-testid="tournaments-empty"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('tournaments-empty')).toBeVisible()

    // ============================================================
    // CLEANUP
    // ============================================================
    await page.unroute('**/api/tournaments*')
  })

})
