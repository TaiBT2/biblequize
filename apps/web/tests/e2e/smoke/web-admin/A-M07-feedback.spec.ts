/**
 * A-M07 — Feedback & Moderation (L1 Smoke)
 *
 * Routes: /admin/feedback
 * Spec ref: SPEC_ADMIN S7
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M07 Feedback & Moderation — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M07 Feedback & Moderation — L1 Smoke', () => {
  // ── A-M07-L1-001 ── admin ──────────────────────────────────
  test('A-M07-L1-001: Feedback page render dung @smoke @admin @feedback @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/feedback')
    // TODO [NEEDS TESTID: admin-feedback-page] — wrapper
    await adminPage.waitForSelector('[data-testid="admin-feedback-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/feedback')
    await expect(adminPage.getByTestId('admin-feedback-page')).toBeVisible()
    // TODO [NEEDS TESTID: feedback-stats-cards] — cards pending/in_progress/resolved/rejected
    await expect(adminPage.getByTestId('feedback-stats-cards')).toBeVisible()
    // TODO [NEEDS TESTID: feedback-table] — bang feedback
    await expect(adminPage.getByTestId('feedback-table')).toBeVisible()
  })

  // ── A-M07-L1-002 ── admin ──────────────────────────────────
  // SKIP: UI component [feedback-stat-pending, feedback-stat-resolved] not implemented yet
  test.skip('A-M07-L1-002: Stats cards hien thi du trang thai @smoke @admin @feedback', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/feedback')
    await adminPage.waitForSelector('[data-testid="feedback-stats-cards"]')

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: feedback-stat-pending] — card "Cho Xu Ly"
    await expect(adminPage.getByTestId('feedback-stat-pending')).toBeVisible()
    // TODO [NEEDS TESTID: feedback-stat-resolved] — card "Da Giai Quyet"
    await expect(adminPage.getByTestId('feedback-stat-resolved')).toBeVisible()
    // TODO [NEEDS TESTID: feedback-stat-rejected] — card "Da Tu Choi"
    await expect(adminPage.getByTestId('feedback-stat-rejected')).toBeVisible()
  })

  // ── A-M07-L1-003 ── admin ──────────────────────────────────
  test('A-M07-L1-003: Filter feedback theo status @smoke @admin @feedback', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/feedback')
    // TODO [NEEDS TESTID: feedback-status-filter] — dropdown filter status
    await adminPage.waitForSelector('[data-testid="feedback-status-filter"]')
    await adminPage.getByTestId('feedback-status-filter').selectOption('pending')
    await adminPage.waitForResponse((resp) =>
      resp.url().includes('/api/admin/feedback') && resp.status() === 200,
    )

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: feedback-row] — moi hang feedback
    // Filtered results may be 0 or more — just verify table is still visible
    await expect(adminPage.getByTestId('feedback-table')).toBeVisible()
  })

  // ── A-M07-L1-004 ── admin ──────────────────────────────────
  // SKIP: UI component [feedback-row] not implemented yet
  test.skip('A-M07-L1-004: Click feedback mo detail modal + update status @smoke @admin @feedback @write', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/feedback')
    await adminPage.waitForSelector('[data-testid="feedback-row"]')
    await adminPage.getByTestId('feedback-row').first().click()
    // TODO [NEEDS TESTID: feedback-detail-modal] — modal chi tiet
    await adminPage.waitForSelector('[data-testid="feedback-detail-modal"]')

    // ── UI Assertions ── (modal visible)
    await expect(adminPage.getByTestId('feedback-detail-modal')).toBeVisible()

    // ── Update status ──
    // TODO [NEEDS TESTID: feedback-status-select] — selector thay doi status
    await adminPage
      .getByTestId('feedback-status-select')
      .selectOption('in_progress')
    // TODO [NEEDS TESTID: feedback-update-btn] — nut cap nhat
    await adminPage.getByTestId('feedback-update-btn').click()

    // ── UI Assertions ── (status updated)
    await expect(adminPage.getByTestId('feedback-detail-modal')).toContainText(
      /in_progress|đang xử lý/i,
    )
  })
})
