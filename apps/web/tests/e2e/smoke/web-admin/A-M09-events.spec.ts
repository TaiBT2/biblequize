/**
 * A-M09 — Events & Tournaments Admin (L1 Smoke)
 *
 * Routes: /admin/events
 * Spec ref: SPEC_ADMIN S9
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M09 Events & Tournaments Admin — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M09 Events & Tournaments — L1 Smoke', () => {
  // ── A-M09-L1-001 ── admin ──────────────────────────────────
  test('A-M09-L1-001: Events page render dung @smoke @admin @events @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/events')
    // TODO [NEEDS TESTID: admin-events-page] — wrapper
    await adminPage.waitForSelector('[data-testid="admin-events-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/events')
    await expect(adminPage.getByTestId('admin-events-page')).toBeVisible()
  })

  // ── A-M09-L1-002 ── admin ──────────────────────────────────
  test('A-M09-L1-002: Tournament list hien thi voi status badges @smoke @admin @events', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/events')
    // TODO [NEEDS TESTID: admin-tournament-row] — moi hang tournament
    await adminPage.waitForSelector('[data-testid="admin-tournament-row"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('admin-tournament-row')).toHaveCount({
      min: 1,
    })
    // TODO [NEEDS TESTID: tournament-status-badge] — badge status
    await expect(
      adminPage
        .getByTestId('admin-tournament-row')
        .first()
        .getByTestId('tournament-status-badge'),
    ).toBeVisible()
  })

  // ── A-M09-L1-003 ── admin ──────────────────────────────────
  test('A-M09-L1-003: Create tournament button visible @smoke @admin @events', async ({
    adminPage,
  }) => {
    // [NOT IMPLEMENTED: create tournament form chua implement — hien chi read-only list]
    test.skip()

    // ── Actions ──
    await adminPage.goto('/admin/events')
    await adminPage.waitForSelector('[data-testid="admin-events-page"]')

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: create-tournament-btn] — nut "Tao Tournament"
    await expect(adminPage.getByTestId('create-tournament-btn')).toBeVisible()
  })

  // ── A-M09-L1-004 ── admin ──────────────────────────────────
  test('A-M09-L1-004: Bracket size va round info hien thi @smoke @admin @events', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/events')
    await adminPage.waitForSelector('[data-testid="admin-tournament-row"]')

    // ── UI Assertions ──
    // TODO [NEEDS TESTID: tournament-bracket-size] — hien thi bracket size
    await expect(
      adminPage
        .getByTestId('admin-tournament-row')
        .first()
        .getByTestId('tournament-bracket-size'),
    ).toBeVisible()
    // TODO [NEEDS TESTID: tournament-round-info] — vong hien tai / tong vong
    await expect(
      adminPage
        .getByTestId('admin-tournament-row')
        .first()
        .getByTestId('tournament-round-info'),
    ).toBeVisible()
  })
})
