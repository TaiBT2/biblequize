/**
 * W-M11 — Variety Modes (L1 Smoke)
 *
 * Routes: /weekly-quiz, /mystery-mode, /speed-round
 * Spec ref: SPEC_USER §5.4
 */

import { test, expect } from '../../fixtures/auth'
import { QuizPage } from '../../pages/QuizPage'

test.describe('W-M11 Variety Modes — L1 Smoke @smoke @variety', () => {

  // ── Weekly Quiz ─────────────────────────────────────────────────

  // SKIP: UI component weekly-start-btn not implemented yet
  test.skip('W-M11-L1-001: Weekly Quiz page render dung @smoke @variety @weekly-quiz', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/weekly-quiz')
    await page.waitForSelector('[data-testid="weekly-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/weekly-quiz')
    await expect(page.getByTestId('weekly-page')).toBeVisible()
    await expect(page.getByTestId('weekly-quiz-theme-card')).toBeVisible()
    await expect(page.getByTestId('weekly-quiz-countdown')).toBeVisible()
    await expect(page.getByTestId('weekly-start-btn')).toBeVisible()
  })

  // SKIP: UI component weekly-start-btn not implemented yet
  test.skip('W-M11-L1-002: Weekly Quiz click Start vao quiz mode weekly @smoke @variety @weekly-quiz', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/weekly-quiz')
    await page.waitForSelector('[data-testid="weekly-start-btn"]')
    await page.getByTestId('weekly-start-btn').click()
    await page.waitForURL('/quiz')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/quiz')
    const quizPage = new QuizPage(page)
    await expect(quizPage.questionText).toBeVisible()
  })

  // ── Mystery Mode ────────────────────────────────────────────────

  // SKIP: UI components mystery-info-card, mystery-bonus-xp not implemented yet
  test.skip('W-M11-L1-003: Mystery Mode page render dung @smoke @variety @mystery', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/mystery-mode')
    await page.waitForSelector('[data-testid="mystery-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/mystery-mode')
    await expect(page.getByTestId('mystery-page')).toBeVisible()
    await expect(page.getByTestId('mystery-info-card')).toBeVisible()
    await expect(page.getByTestId('mystery-bonus-xp')).toBeVisible()
    await expect(page.getByTestId('mystery-start-btn')).toBeVisible()
  })

  test('W-M11-L1-004: Mystery Mode click Start vao quiz @smoke @variety @mystery', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/mystery-mode')
    await page.waitForSelector('[data-testid="mystery-start-btn"]')
    await page.getByTestId('mystery-start-btn').click()
    await page.waitForURL('/quiz')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/quiz')
    const quizPage = new QuizPage(page)
    await expect(quizPage.questionText).toBeVisible()
  })

  // ── Speed Round ─────────────────────────────────────────────────

  // SKIP: UI components speed-round-stats-card, speed-round-timer-stat not implemented yet
  test.skip('W-M11-L1-005: Speed Round page render dung @smoke @variety @speed-round', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/speed-round')
    await page.waitForSelector('[data-testid="speed-round-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/speed-round')
    await expect(page.getByTestId('speed-round-page')).toBeVisible()
    await expect(page.getByTestId('speed-round-stats-card')).toBeVisible()
    await expect(page.getByTestId('speed-round-timer-stat')).toHaveText(/10/)
    await expect(page.getByTestId('speed-round-bonus-stat')).toHaveText(/2x/)
    await expect(page.getByTestId('speed-round-start-btn')).toBeVisible()
  })

  test('W-M11-L1-006: Speed Round click Start vao quiz voi timer @smoke @variety @speed-round', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/speed-round')
    await page.waitForSelector('[data-testid="speed-round-start-btn"]')
    await page.getByTestId('speed-round-start-btn').click()
    await page.waitForURL('/quiz')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/quiz')
    const quizPage = new QuizPage(page)
    await expect(quizPage.questionText).toBeVisible()
    await expect(quizPage.timer).toBeVisible()
  })

})
