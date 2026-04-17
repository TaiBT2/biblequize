/**
 * A-M11 + A-M12 + A-M13 + A-M14 — Utilities Admin (L1 Smoke)
 *
 * Routes: /admin/notifications, /admin/config, /admin/export, /admin/question-quality
 * Spec ref: SPEC_ADMIN S11-14
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M11 Notifications Broadcast — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M11 Notifications Broadcast — L1 Smoke', () => {
  // ── A-M11-L1-001 ── admin ──────────────────────────────────
  test('A-M11-L1-001: Notifications admin page render dung @smoke @admin @notifications @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/notifications')
    // TODO [NEEDS TESTID: admin-notifications-page] — wrapper
    await adminPage.waitForSelector('[data-testid="admin-notifications-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/notifications')
    await expect(
      adminPage.getByTestId('admin-notifications-page'),
    ).toBeVisible()
    // TODO [NEEDS TESTID: notifications-broadcast-form] — form title + content
    await expect(
      adminPage.getByTestId('notifications-broadcast-form'),
    ).toBeVisible()
    // TODO [NEEDS TESTID: notifications-history] — section lich su notifications
    await expect(adminPage.getByTestId('notifications-history')).toBeVisible()
  })

  // ── A-M11-L1-002 ── admin ──────────────────────────────────
  test('A-M11-L1-002: Broadcast form fill va submit @smoke @admin @notifications @write', async ({
    adminPage,
  }) => {
    // [NOT IMPLEMENTED: broadcast endpoint dung setTimeout placeholder — chua co real API]
    test.skip()

    // ── Actions ──
    await adminPage.goto('/admin/notifications')
    await adminPage.waitForSelector(
      '[data-testid="notifications-broadcast-form"]',
    )
    // TODO [NEEDS TESTID: notifications-title-input] — input tieu de
    await adminPage
      .getByTestId('notifications-title-input')
      .fill('Test Broadcast')
    // TODO [NEEDS TESTID: notifications-content-input] — textarea noi dung
    await adminPage
      .getByTestId('notifications-content-input')
      .fill('Thong bao E2E test')
    // TODO [NEEDS TESTID: notifications-send-btn] — nut "Gui Thong Bao"
    await adminPage.getByTestId('notifications-send-btn').click()

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: notifications-success-toast] — toast
    await expect(
      adminPage.getByTestId('notifications-success-toast'),
    ).toBeVisible()
  })
})

// ────────────────────────────────────────────────────────────────
// A-M12 Configuration — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M12 Configuration — L1 Smoke', () => {
  // ── A-M12-L1-001 ── admin ──────────────────────────────────
  test('A-M12-L1-001: Configuration page render dung @smoke @admin @config @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/config')
    // TODO [NEEDS TESTID: admin-config-page] — wrapper
    await adminPage.waitForSelector('[data-testid="admin-config-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/config')
    await expect(adminPage.getByTestId('admin-config-page')).toBeVisible()
    // TODO [NEEDS TESTID: config-game-panel] — panel Game config
    await expect(adminPage.getByTestId('config-game-panel')).toBeVisible()
    // TODO [NEEDS TESTID: config-scoring-panel] — panel Scoring config
    await expect(adminPage.getByTestId('config-scoring-panel')).toBeVisible()
  })

  // ── A-M12-L1-002 ── admin ──────────────────────────────────
  test('A-M12-L1-002: Thay doi gia tri — Save N changes button active @smoke @admin @config', async ({
    adminPage,
  }) => {
    // [NOT IMPLEMENTED: save endpoint /api/admin/config chua implement — button la stub]
    test.skip()

    // ── Actions ──
    await adminPage.goto('/admin/config')
    await adminPage.waitForSelector('[data-testid="config-game-panel"]')
    // TODO [NEEDS TESTID: config-daily-energy-input] — input daily energy value
    await adminPage.getByTestId('config-daily-energy-input').fill('90')
    // TODO [NEEDS TESTID: config-save-btn] — "Save N changes" button
    await adminPage.waitForSelector('[data-testid="config-save-btn"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('config-save-btn')).toBeEnabled()
    await expect(adminPage.getByTestId('config-save-btn')).toContainText(
      /Save 1 change/i,
    )
  })
})

// ────────────────────────────────────────────────────────────────
// A-M13 Export Center — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M13 Export Center — L1 Smoke', () => {
  // ── A-M13-L1-001 ── admin ──────────────────────────────────
  test('A-M13-L1-001: Export Center page render dung @smoke @admin @export @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/export')
    // TODO [NEEDS TESTID: admin-export-page] — wrapper ExportCenter
    await adminPage.waitForSelector('[data-testid="admin-export-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/export')
    await expect(adminPage.getByTestId('admin-export-page')).toBeVisible()
    // TODO [NEEDS TESTID: export-questions-card] — card export Questions
    await expect(adminPage.getByTestId('export-questions-card')).toBeVisible()
    // TODO [NEEDS TESTID: export-users-card] — card export Users
    await expect(adminPage.getByTestId('export-users-card')).toBeVisible()
  })

  // ── A-M13-L1-002 ── admin ──────────────────────────────────
  test('A-M13-L1-002: Export format buttons visible tren moi card @smoke @admin @export', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/export')
    await adminPage.waitForSelector('[data-testid="export-questions-card"]')

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: export-btn-csv] — nut CSV trong moi export card
    await expect(
      adminPage
        .getByTestId('export-questions-card')
        .getByTestId('export-btn-csv'),
    ).toBeVisible()
    // TODO [NEEDS TESTID: export-btn-json] — nut JSON trong moi export card
    await expect(
      adminPage
        .getByTestId('export-questions-card')
        .getByTestId('export-btn-json'),
    ).toBeVisible()
  })
})

// ────────────────────────────────────────────────────────────────
// A-M14 Question Quality — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M14 Question Quality — L1 Smoke', () => {
  // ── A-M14-L1-001 ── admin ──────────────────────────────────
  test('A-M14-L1-001: Question Quality page render dung @smoke @admin @quality @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/question-quality')
    // TODO [NEEDS TESTID: admin-quality-page] — wrapper
    await adminPage.waitForSelector('[data-testid="admin-quality-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/question-quality')
    await expect(adminPage.getByTestId('admin-quality-page')).toBeVisible()
    // TODO [NEEDS TESTID: quality-overall-score] — score tong (hien hardcoded 72/100)
    await expect(adminPage.getByTestId('quality-overall-score')).toBeVisible()
    // TODO [NEEDS TESTID: quality-coverage-map] — coverage bars by book
    await expect(adminPage.getByTestId('quality-coverage-map')).toBeVisible()
  })

  // ── A-M14-L1-002 ── admin ──────────────────────────────────
  test('A-M14-L1-002: Coverage map hien thi books voi progress bars @smoke @admin @quality', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/question-quality')
    await adminPage.waitForSelector('[data-testid="quality-coverage-map"]')

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: coverage-book-bar] — moi sach trong coverage map
    await expect(
      adminPage
        .getByTestId('quality-coverage-map')
        .getByTestId('coverage-book-bar'),
    ).toHaveCount({ min: 1 })
    // TODO [NEEDS TESTID: coverage-pct] — % coverage cho moi sach
    await expect(
      adminPage.getByTestId('coverage-book-bar').first().getByTestId('coverage-pct'),
    ).toBeVisible()
  })
})
