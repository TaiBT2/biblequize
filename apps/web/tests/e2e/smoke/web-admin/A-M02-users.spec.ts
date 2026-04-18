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
    await adminPage.waitForSelector('[data-testid="admin-users-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/users')
    await expect(adminPage.getByTestId('admin-users-page')).toBeVisible()
    await expect(adminPage.getByTestId('admin-users-table')).toBeVisible()
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
    await adminPage.waitForSelector('[data-testid="admin-user-detail-modal"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('admin-user-detail-modal')).toBeVisible()
    await expect(adminPage.getByTestId('admin-user-detail-email')).toBeVisible()
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
    await adminPage.waitForSelector('[data-testid="admin-ban-reason-input"]')
    await adminPage.getByTestId('admin-ban-reason-input').fill('E2E test ban')
    await adminPage.getByTestId('admin-ban-confirm-btn').click()

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('admin-user-row').first()).toContainText(
      /banned|cấm/i,
    )
  })
})
