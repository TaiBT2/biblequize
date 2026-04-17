/**
 * A-M06 — Review Queue (L1 Smoke)
 *
 * Routes: /admin/review-queue
 * Spec ref: SPEC_ADMIN S6
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M06 Review Queue — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M06 Review Queue — L1 Smoke', () => {
  // ── A-M06-L1-001 ── admin ──────────────────────────────────
  test('A-M06-L1-001: Review Queue page render dung @smoke @admin @review @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/review-queue')
    // TODO [NEEDS TESTID: review-queue-page] — wrapper
    await adminPage.waitForSelector('[data-testid="review-queue-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/review-queue')
    await expect(adminPage.getByTestId('review-queue-page')).toBeVisible()
    // TODO [NEEDS TESTID: review-queue-stats] — stats section
    await expect(adminPage.getByTestId('review-queue-stats')).toBeVisible()
  })

  // ── A-M06-L1-002 ── admin ──────────────────────────────────
  test('A-M06-L1-002: Question items visible voi approve/reject buttons @smoke @admin @review', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/review-queue')
    // TODO [NEEDS TESTID: review-queue-item] — moi question card trong queue
    await adminPage.waitForSelector('[data-testid="review-queue-item"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('review-queue-item')).toHaveCount({
      min: 1,
    })
    // TODO [NEEDS TESTID: review-approve-btn] — approve button
    await expect(
      adminPage.getByTestId('review-approve-btn').first(),
    ).toBeVisible()
    // TODO [NEEDS TESTID: review-reject-btn] — reject button
    await expect(
      adminPage.getByTestId('review-reject-btn').first(),
    ).toBeVisible()
  })

  // ── A-M06-L1-003 ── admin ──────────────────────────────────
  test('A-M06-L1-003: Approve question — approval count tang @smoke @admin @review @write', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/review-queue')
    await adminPage.waitForSelector('[data-testid="review-approve-btn"]')
    const countBefore = await adminPage.getByTestId('review-queue-item').count()
    await adminPage.getByTestId('review-approve-btn').first().click()
    await adminPage.waitForResponse((resp) =>
      resp.url().includes('/api/admin/review') && resp.status() === 200,
    )

    // ── UI Assertions ──
    // Item removed after approve OR progress increased (if 2 admin approve needed)
    await expect(adminPage.getByTestId('review-queue-item')).toHaveCount(
      countBefore - 1,
    )
  })

  // ── A-M06-L1-004 ── admin ──────────────────────────────────
  test('A-M06-L1-004: Reject question voi comment @smoke @admin @review @write', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/review-queue')
    await adminPage.waitForSelector('[data-testid="review-reject-btn"]')
    await adminPage.getByTestId('review-reject-btn').first().click()
    // TODO [NEEDS TESTID: review-reject-comment] — textarea nhap ly do reject
    await adminPage.waitForSelector('[data-testid="review-reject-comment"]')
    await adminPage
      .getByTestId('review-reject-comment')
      .fill('Cau hoi khong ro rang')
    // TODO [NEEDS TESTID: review-reject-confirm-btn] — confirm reject
    await adminPage.getByTestId('review-reject-confirm-btn').click()

    // ── UI Assertions ──
    await expect(
      adminPage.getByTestId('review-reject-comment'),
    ).not.toBeVisible()
  })
})
