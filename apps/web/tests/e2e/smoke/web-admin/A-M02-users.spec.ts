/**
 * A-M02 — Users Management (L1 Smoke)
 *
 * Routes: /admin/users
 * Spec ref: SPEC_ADMIN S2
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M02 Users Management — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M02 Users Management — L1 Smoke', () => {
  // ── A-M02-L1-001 ── admin ──────────────────────────────────
  test('A-M02-L1-001: Users list page render dung @smoke @admin @users @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/users')
    // TODO [NEEDS TESTID: admin-users-page] — wrapper
    await adminPage.waitForSelector('[data-testid="admin-users-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/users')
    await expect(adminPage.getByTestId('admin-users-page')).toBeVisible()
    // TODO [NEEDS TESTID: admin-users-table] — bang danh sach users
    await expect(adminPage.getByTestId('admin-users-table')).toBeVisible()
    // TODO [NEEDS TESTID: admin-users-search] — input search
    await expect(adminPage.getByTestId('admin-users-search')).toBeVisible()
  })

  // ── A-M02-L1-002 ── admin ──────────────────────────────────
  test('A-M02-L1-002: Search users theo email @smoke @admin @users', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/users')
    await adminPage.waitForSelector('[data-testid="admin-users-search"]')
    await adminPage.getByTestId('admin-users-search').fill('test1@dev.local')
    await adminPage.waitForResponse((resp) =>
      resp.url().includes('/api/admin/users') && resp.status() === 200,
    )

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: admin-user-row] — moi hang user trong bang
    await expect(
      adminPage.getByTestId('admin-users-table').getByTestId('admin-user-row'),
    ).toHaveCount(1)
    await expect(adminPage.getByTestId('admin-user-row').first()).toContainText(
      'test1@dev.local',
    )
  })

  // ── A-M02-L1-003 ── admin ──────────────────────────────────
  test('A-M02-L1-003: Click user row mo user detail modal @smoke @admin @users', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/users')
    await adminPage.waitForSelector('[data-testid="admin-user-row"]')
    await adminPage.getByTestId('admin-user-row').first().click()
    // TODO [NEEDS TESTID: admin-user-detail-modal] — modal chi tiet user
    await adminPage.waitForSelector('[data-testid="admin-user-detail-modal"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('admin-user-detail-modal')).toBeVisible()
    // TODO [NEEDS TESTID: admin-user-detail-email] — email display
    await expect(adminPage.getByTestId('admin-user-detail-email')).toBeVisible()
    // TODO [NEEDS TESTID: admin-user-ban-btn] — nut Ban
    await expect(adminPage.getByTestId('admin-user-ban-btn')).toBeVisible()
  })

  // ── A-M02-L1-004 ── admin ──────────────────────────────────
  test('A-M02-L1-004: Ban user voi ly do @smoke @admin @users @write', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/users')
    await adminPage.waitForSelector('[data-testid="admin-users-search"]')
    await adminPage.getByTestId('admin-users-search').fill('test1@dev.local')
    await adminPage.waitForResponse((resp) =>
      resp.url().includes('/api/admin/users') && resp.status() === 200,
    )
    await adminPage.getByTestId('admin-user-row').first().click()
    await adminPage.waitForSelector('[data-testid="admin-user-detail-modal"]')
    await adminPage.getByTestId('admin-user-ban-btn').click()
    // TODO [NEEDS TESTID: admin-ban-reason-input] — input ly do ban (min 10 chars)
    await adminPage.waitForSelector('[data-testid="admin-ban-reason-input"]')
    await adminPage.getByTestId('admin-ban-reason-input').fill('E2E test ban')
    // TODO [NEEDS TESTID: admin-ban-confirm-btn] — confirm ban button
    await adminPage.getByTestId('admin-ban-confirm-btn').click()

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('admin-user-row').first()).toContainText(
      /banned|cấm/i,
    )
  })
})
