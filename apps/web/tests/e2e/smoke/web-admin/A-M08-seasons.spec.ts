/**
 * A-M08 — Seasons & Rankings (L1 Smoke)
 *
 * Routes: /admin/rankings
 * Spec ref: SPEC_ADMIN S8
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M08 Seasons & Rankings — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M08 Seasons & Rankings — L1 Smoke', () => {
  // ── A-M08-L1-001 ── admin ──────────────────────────────────
  test('A-M08-L1-001: Rankings page render dung @smoke @admin @rankings @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/rankings')
    // TODO [NEEDS TESTID: admin-rankings-page] — wrapper Rankings admin
    await adminPage.waitForSelector('[data-testid="admin-rankings-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/rankings')
    await expect(adminPage.getByTestId('admin-rankings-page')).toBeVisible()
  })

  // ── A-M08-L1-002 ── admin ──────────────────────────────────
  // SKIP: UI component [active-season-name] not implemented yet
  test.skip('A-M08-L1-002: Active season hien thi (neu co) @smoke @admin @rankings', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/rankings')
    // TODO [NEEDS TESTID: active-season-banner] — banner season dang active
    await adminPage.waitForSelector('[data-testid="active-season-banner"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('active-season-banner')).toBeVisible()
    // TODO [NEEDS TESTID: active-season-name] — ten season
    await expect(adminPage.getByTestId('active-season-name')).toBeVisible()
    // TODO [NEEDS TESTID: end-season-btn] — nut "Ket Thuc Mua" (destructive)
    await expect(adminPage.getByTestId('end-season-btn')).toBeVisible()
  })

  // ── A-M08-L1-003 ── admin ──────────────────────────────────
  test('A-M08-L1-003: Create new season form visible @smoke @admin @rankings', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/rankings')
    // TODO [NEEDS TESTID: create-season-form] — form tao season moi
    await adminPage.waitForSelector('[data-testid="create-season-form"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('create-season-form')).toBeVisible()
    // TODO [NEEDS TESTID: create-season-name-input] — input ten season
    await expect(
      adminPage.getByTestId('create-season-name-input'),
    ).toBeVisible()
    // TODO [NEEDS TESTID: create-season-submit-btn] — nut "Tao Mua Giai"
    await expect(
      adminPage.getByTestId('create-season-submit-btn'),
    ).toBeVisible()
  })

  // ── A-M08-L1-004 ── admin ──────────────────────────────────
  test('A-M08-L1-004: Inactive seasons list hien thi @smoke @admin @rankings', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/rankings')
    // TODO [NEEDS TESTID: inactive-seasons-list] — danh sach seasons da ket thuc
    await adminPage.waitForSelector('[data-testid="inactive-seasons-list"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('inactive-seasons-list')).toBeVisible()
  })
})
