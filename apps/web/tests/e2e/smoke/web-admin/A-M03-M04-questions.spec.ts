/**
 * A-M03 + A-M04 — Questions CRUD + Duplicate Detection (L1 Smoke)
 *
 * Routes: /admin/questions
 * Spec ref: SPEC_ADMIN S3, S4
 */

import { test, expect } from '../../fixtures/auth'

// ────────────────────────────────────────────────────────────────
// A-M03 + A-M04 Questions CRUD + Duplicate Detection — L1 Smoke
// ────────────────────────────────────────────────────────────────

test.describe('A-M03 + A-M04 Questions CRUD — L1 Smoke', () => {
  // ── A-M03-L1-001 ── admin ──────────────────────────────────
  test('A-M03-L1-001: Questions list page render dung @smoke @admin @questions @critical', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/questions')
    await adminPage.waitForSelector('[data-testid="admin-questions-page"]')

    // ── UI Assertions ──
    await expect(adminPage).toHaveURL('/admin/questions')
    await expect(adminPage.getByTestId('admin-questions-page')).toBeVisible()
    await expect(adminPage.getByTestId('admin-questions-table')).toBeVisible()
    await expect(adminPage.getByTestId('admin-questions-add-btn')).toBeVisible()
  })

  // ── A-M03-L1-002 ── admin ──────────────────────────────────
  test('A-M03-L1-002: Filter questions theo sach @smoke @admin @questions', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/questions')
    await adminPage.waitForSelector('[data-testid="admin-questions-book-filter"]')
    await adminPage.getByTestId('admin-questions-book-filter').selectOption('Genesis')
    await adminPage.waitForResponse((resp) =>
      resp.url().includes('/api/admin/questions') && resp.status() === 200,
    )

    // ── UI Assertions ──
    const rows = adminPage
      .getByTestId('admin-questions-table')
      .getByTestId('admin-question-row')
    await expect(rows).toHaveCount({ min: 1 })
  })

  // ── A-M03-L1-003 ── admin ──────────────────────────────────
  test('A-M03-L1-003: Mo Create Question modal @smoke @admin @questions', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/questions')
    await adminPage.waitForSelector('[data-testid="admin-questions-add-btn"]')
    await adminPage.getByTestId('admin-questions-add-btn').click()
    await adminPage.waitForSelector('[data-testid="question-form-modal"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('question-form-modal')).toBeVisible()
    await expect(adminPage.getByTestId('admin-question-content-input')).toBeVisible()
    await expect(adminPage.getByTestId('admin-question-save-btn')).toBeVisible()
  })

  // ── A-M04-L1-001 ── admin ──────────────────────────────────
  test('A-M04-L1-001: Duplicate detection — tao cau hoi giong hien warning @smoke @admin @questions @duplicate-detection', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/questions')
    await adminPage.waitForSelector('[data-testid="admin-questions-add-btn"]')
    await adminPage.getByTestId('admin-questions-add-btn').click()
    await adminPage.waitForSelector('[data-testid="question-form-modal"]')
    await adminPage.getByTestId('admin-question-content-input').fill(
      'Ai la nguoi dau tien duoc Chua tao dung?',
    )
    await adminPage.getByTestId('admin-question-content-input').blur()
    await adminPage.waitForSelector('[data-testid="duplicate-warning"]')

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('duplicate-warning')).toBeVisible()
    await expect(adminPage.getByTestId('duplicate-warning')).toContainText(
      /Similar questions found|câu hỏi tương tự/i,
    )
  })

  // ── A-M03-L1-004 ── admin ──────────────────────────────────
  test('A-M03-L1-004: Edit question luu thanh cong @smoke @admin @questions @write', async ({
    adminPage,
  }) => {
    // ── Actions ──
    await adminPage.goto('/admin/questions')
    await adminPage.waitForSelector('[data-testid="admin-question-row"]')
    await adminPage
      .getByTestId('admin-question-row')
      .first()
      .getByTestId('admin-question-edit-btn')
      .click()
    await adminPage.waitForSelector('[data-testid="question-form-modal"]')
    // Change difficulty (click difficulty selector)
    await adminPage.getByTestId('admin-question-save-btn').click()

    // ── UI Assertions ──
    await expect(adminPage.getByTestId('question-form-modal')).not.toBeVisible()
    await expect(
      adminPage.getByTestId('admin-questions-success-toast'),
    ).toBeVisible()
  })
})
