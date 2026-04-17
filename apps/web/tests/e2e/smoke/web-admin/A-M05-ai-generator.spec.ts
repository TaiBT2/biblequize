/**
 * A-M05 — AI Question Generator (L1 Smoke)
 *
 * Routes: /admin/ai-generator
 * Spec ref: SPEC_ADMIN S5
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M05 AI Question Generator — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M05 AI Question Generator — L1 Smoke', () => {
  // ── A-M05-L1-001 ── admin ──────────────────────────────────
  test('A-M05-L1-001: AI Generator page render dung @smoke @admin @ai-generator @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/ai-generator')
    // TODO [NEEDS TESTID: ai-generator-page] — wrapper
    await adminPage.waitForSelector('[data-testid="ai-generator-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/ai-generator')
    await expect(adminPage.getByTestId('ai-generator-page')).toBeVisible()
    // TODO [NEEDS TESTID: ai-scripture-selector] — selector book/chapter/verse
    await expect(adminPage.getByTestId('ai-scripture-selector')).toBeVisible()
    // TODO [NEEDS TESTID: ai-settings-panel] — panel difficulty/type/count
    await expect(adminPage.getByTestId('ai-settings-panel')).toBeVisible()
    // TODO [NEEDS TESTID: ai-generate-btn] — nut "Tao Cau Hoi"
    await expect(adminPage.getByTestId('ai-generate-btn')).toBeVisible()
  })

  // ── A-M05-L1-002 ── admin ──────────────────────────────────
  test('A-M05-L1-002: Provider selector (Gemini/Claude) visible @smoke @admin @ai-generator', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/ai-generator')
    // TODO [NEEDS TESTID: ai-provider-select] — provider selector
    await adminPage.waitForSelector('[data-testid="ai-provider-select"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('ai-provider-select')).toBeVisible()
    // TODO [NEEDS TESTID: ai-provider-gemini] — Gemini option
    await expect(adminPage.getByTestId('ai-provider-gemini')).toBeVisible()
    // TODO [NEEDS TESTID: ai-provider-claude] — Claude option
    await expect(adminPage.getByTestId('ai-provider-claude')).toBeVisible()
  })

  // ── A-M05-L1-003 ── admin ──────────────────────────────────
  test('A-M05-L1-003: Generate drafts — draft cards xuat hien @smoke @admin @ai-generator @write', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/ai-generator')
    await adminPage.waitForSelector('[data-testid="ai-generator-page"]')
    // Select book Genesis + chapter 1 (via scripture selector)
    await adminPage.getByTestId('ai-scripture-selector').click()
    // TODO: actual selection depends on component implementation
    await adminPage.getByTestId('ai-generate-btn').click()
    // TODO [NEEDS TESTID: ai-draft-card] — moi draft question card
    await adminPage.waitForSelector('[data-testid="ai-draft-card"]', {
      timeout: 15_000,
    })

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('ai-draft-card')).toHaveCount({ min: 1 })
    // TODO [NEEDS TESTID: ai-draft-approve-btn] — approve button
    await expect(
      adminPage.getByTestId('ai-draft-approve-btn').first(),
    ).toBeVisible()
    // TODO [NEEDS TESTID: ai-draft-reject-btn] — reject button
    await expect(
      adminPage.getByTestId('ai-draft-reject-btn').first(),
    ).toBeVisible()
  })

  // ── A-M05-L1-004 ── admin ──────────────────────────────────
  test('A-M05-L1-004: Approve draft — goi API save @smoke @admin @ai-generator @write', async ({
    adminPage,
  }) => {
    // ── Actions ── (generate drafts first)
    await adminPage.goto('/admin/ai-generator')
    await adminPage.waitForSelector('[data-testid="ai-generator-page"]')
    await adminPage.getByTestId('ai-scripture-selector').click()
    await adminPage.getByTestId('ai-generate-btn').click()
    await adminPage.waitForSelector('[data-testid="ai-draft-card"]', {
      timeout: 15_000,
    })
    await adminPage.getByTestId('ai-draft-approve-btn').first().click()

    // ── UI Assertions ──
    await expect(
      adminPage.getByTestId('ai-draft-card').first(),
    ).toHaveAttribute('data-status', 'approved')
  })
})
