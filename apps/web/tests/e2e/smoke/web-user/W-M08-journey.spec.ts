/**
 * W-M08 — Bible Journey Map (L1 Smoke)
 *
 * Routes: /journey
 * Spec ref: SPEC_USER §8
 */

import { test, expect } from '../../fixtures/auth'

test.describe('W-M08 Journey Map — L1 Smoke @smoke @journey', () => {

  test('W-M08-L1-001: Journey page render dung @smoke @journey @critical', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/journey')
    await page.waitForSelector('[data-testid="journey-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/journey')
    await expect(page.getByTestId('journey-page')).toBeVisible()
    await expect(page.getByTestId('journey-summary-card')).toBeVisible()
    await expect(page.getByTestId('journey-old-testament')).toBeVisible()
    await expect(page.getByTestId('journey-new-testament')).toBeVisible()
  })

  test('W-M08-L1-002: Summary card hien thi mastery pct dung @smoke @journey', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/journey')
    await page.waitForSelector('[data-testid="journey-summary-card"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('journey-mastery-pct')).toBeVisible()
    await expect(page.getByTestId('journey-mastery-pct')).toHaveText(/\d+%/)
    await expect(page.getByTestId('journey-books-completed')).toBeVisible()
    await expect(page.getByTestId('journey-books-inprogress')).toBeVisible()
  })

  test('W-M08-L1-003: Book card hien thi dung trang thai @smoke @journey', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/journey')
    await page.waitForSelector('[data-testid="journey-book-card"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    const firstCard = page.getByTestId('journey-book-card').first()
    await expect(firstCard).toBeVisible()
    await expect(firstCard.getByTestId('journey-book-name')).toBeVisible()
    await expect(firstCard.getByTestId('journey-book-mastery')).toBeVisible()
  })

  test('W-M08-L1-004: Click book card navigate to Practice voi filter sach do @smoke @journey', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/journey')
    await page.waitForSelector('[data-testid="journey-book-card"]')
    // Click first non-locked book card
    await page.getByTestId('journey-book-card').first().click()
    await page.waitForURL(/\/practice/)

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL(/\/practice/)
    expect(page.url()).toContain('book=')
  })

})
