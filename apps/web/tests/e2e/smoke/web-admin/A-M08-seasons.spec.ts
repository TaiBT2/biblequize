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
    await adminPage.waitForSelector('[data-testid="admin-rankings-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/rankings')
    await expect(adminPage.getByTestId('admin-rankings-page')).toBeVisible()
  })

  // ── A-M08-L1-002 ── admin ──────────────────────────────────
  test('A-M08-L1-002: Active season hien thi (neu co) @smoke @admin @rankings', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/rankings')
    await adminPage.waitForSelector('[data-testid="active-season-banner"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('active-season-banner')).toBeVisible()
    await expect(adminPage.getByTestId('active-season-name')).toBeVisible()
    await expect(adminPage.getByTestId('end-season-btn')).toBeVisible()
  })

  // ── A-M08-L1-003 ── admin ──────────────────────────────────
  test('A-M08-L1-003: Create new season form visible @smoke @admin @rankings', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/rankings')
    await adminPage.waitForSelector('[data-testid="create-season-form"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('create-season-form')).toBeVisible()
    await expect(
      adminPage.getByTestId('create-season-name-input'),
    ).toBeVisible()
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
    await adminPage.waitForSelector('[data-testid="inactive-seasons-list"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('inactive-seasons-list')).toBeVisible()
  })
})
