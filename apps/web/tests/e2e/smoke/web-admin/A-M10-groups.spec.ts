/**
 * A-M10 — Church Groups Admin (L1 Smoke)
 *
 * Routes: /admin/groups
 * Spec ref: SPEC_ADMIN S10
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M10 Church Groups Admin — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M10 Church Groups Admin — L1 Smoke', () => {
  // ── A-M10-L1-001 ── admin ──────────────────────────────────
  test('A-M10-L1-001: Groups admin page render dung @smoke @admin @groups @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/groups')
    // TODO [NEEDS TESTID: admin-groups-page] — wrapper
    await adminPage.waitForSelector('[data-testid="admin-groups-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/groups')
    await expect(adminPage.getByTestId('admin-groups-page')).toBeVisible()
    // TODO [NEEDS TESTID: admin-groups-list] — danh sach groups
    await expect(adminPage.getByTestId('admin-groups-list')).toBeVisible()
  })

  // ── A-M10-L1-002 ── admin ──────────────────────────────────
  test('A-M10-L1-002: Group list hien thi voi member count va lock status @smoke @admin @groups', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/groups')
    // TODO [NEEDS TESTID: admin-group-row] — moi hang group
    await adminPage.waitForSelector('[data-testid="admin-group-row"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('admin-group-row')).toHaveCount({
      min: 1,
    })
    // TODO [NEEDS TESTID: group-member-count] — so thanh vien
    await expect(
      adminPage
        .getByTestId('admin-group-row')
        .first()
        .getByTestId('group-member-count'),
    ).toBeVisible()
  })

  // ── A-M10-L1-003 ── admin ──────────────────────────────────
  test('A-M10-L1-003: Click group mo detail modal voi lock/unlock controls @smoke @admin @groups', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/groups')
    await adminPage.waitForSelector('[data-testid="admin-group-row"]')
    await adminPage.getByTestId('admin-group-row').first().click()
    // TODO [NEEDS TESTID: admin-group-detail-modal] — modal
    await adminPage.waitForSelector('[data-testid="admin-group-detail-modal"]')

    // ── UI Assertions ──
    await expect(
      adminPage.getByTestId('admin-group-detail-modal'),
    ).toBeVisible()
    // TODO [NEEDS TESTID: group-lock-btn] — nut Lock/Unlock
    await expect(adminPage.getByTestId('group-lock-btn')).toBeVisible()
    // TODO [NEEDS TESTID: group-delete-btn] — nut Delete (destructive)
    await expect(adminPage.getByTestId('group-delete-btn')).toBeVisible()
  })

  // ── A-M10-L1-004 ── admin ──────────────────────────────────
  test('A-M10-L1-004: Lock group voi ly do @smoke @admin @groups @write', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/groups')
    await adminPage.waitForSelector('[data-testid="admin-group-row"]')
    await adminPage.getByTestId('admin-group-row').first().click()
    await adminPage.waitForSelector('[data-testid="admin-group-detail-modal"]')
    await adminPage.getByTestId('group-lock-btn').click()
    // TODO [NEEDS TESTID: group-lock-reason-input] — input ly do lock (min 10 chars)
    await adminPage.waitForSelector('[data-testid="group-lock-reason-input"]')
    await adminPage
      .getByTestId('group-lock-reason-input')
      .fill('Vi pham quy tac cong dong')
    // TODO [NEEDS TESTID: group-lock-confirm-btn] — confirm lock
    await adminPage.getByTestId('group-lock-confirm-btn').click()

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: group-lock-badge] — badge public/private
    await expect(
      adminPage
        .getByTestId('admin-group-row')
        .first()
        .getByTestId('group-lock-badge'),
    ).toContainText(/locked|khóa/i)
  })
})
