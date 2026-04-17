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

  // SKIP: UI component weekly-quiz-start-btn not implemented yet
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
    await page.waitForSelector('[data-testid="weekly-quiz-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/weekly-quiz')
    // TODO [NEEDS TESTID: weekly-quiz-page] — wrapper trang WeeklyQuiz
    await expect(page.getByTestId('weekly-quiz-page')).toBeVisible()
    // TODO [NEEDS TESTID: weekly-quiz-theme-card] — card chu de tuan
    await expect(page.getByTestId('weekly-quiz-theme-card')).toBeVisible()
    // TODO [NEEDS TESTID: weekly-quiz-countdown] — countdown toi tuan toi
    await expect(page.getByTestId('weekly-quiz-countdown')).toBeVisible()
    // TODO [NEEDS TESTID: weekly-quiz-start-btn] — nut "Bat Dau"
    await expect(page.getByTestId('weekly-quiz-start-btn')).toBeVisible()
  })

  // SKIP: UI component weekly-quiz-start-btn not implemented yet
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
    await page.waitForSelector('[data-testid="weekly-quiz-start-btn"]')
    await page.getByTestId('weekly-quiz-start-btn').click()
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
    // TODO [NEEDS TESTID: mystery-page] — wrapper trang MysteryMode
    await expect(page.getByTestId('mystery-page')).toBeVisible()
    // TODO [NEEDS TESTID: mystery-info-card] — card voi ??? placeholders
    await expect(page.getByTestId('mystery-info-card')).toBeVisible()
    // TODO [NEEDS TESTID: mystery-bonus-xp] — badge "1.5x XP"
    await expect(page.getByTestId('mystery-bonus-xp')).toBeVisible()
    // TODO [NEEDS TESTID: mystery-start-btn] — nut "Bat Dau"
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
    // TODO [NEEDS TESTID: speed-round-page] — wrapper trang SpeedRound
    await expect(page.getByTestId('speed-round-page')).toBeVisible()
    // TODO [NEEDS TESTID: speed-round-stats-card] — card 3 stats
    await expect(page.getByTestId('speed-round-stats-card')).toBeVisible()
    // TODO [NEEDS TESTID: speed-round-timer-stat] — stat "10 giay"
    await expect(page.getByTestId('speed-round-timer-stat')).toHaveText(/10/)
    // TODO [NEEDS TESTID: speed-round-bonus-stat] — stat "2x XP"
    await expect(page.getByTestId('speed-round-bonus-stat')).toHaveText(/2x/)
    // TODO [NEEDS TESTID: speed-round-start-btn] — nut "Bat Dau"
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
    // TODO [NEEDS TESTID: quiz-timer] — timer SVG/circle trong Quiz component
    await expect(quizPage.timer).toBeVisible()
  })

})
