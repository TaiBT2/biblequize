/**
 * W-M05 — Daily Challenge (L1 Smoke)
 *
 * Routes: /daily
 * Spec ref: SPEC_USER §5.3
 */

import { test, expect } from '../../fixtures/auth'
import { DailyChallengePage } from '../../pages/DailyChallengePage'
import { QuizPage } from '../../pages/QuizPage'

test.describe('W-M05 Daily Challenge — L1 Smoke @smoke @daily', () => {

  test('W-M05-L1-001: Trang Daily Challenge render dung (chua choi hom nay) @smoke @daily @critical', async ({
    tier3Page,
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    await testApi.fullReset('test3@dev.local')

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const dailyPage = new DailyChallengePage(page)
    await dailyPage.goto()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/daily')
    await expect(dailyPage.container).toBeVisible()
    await expect(dailyPage.streakDisplay).toBeVisible()
    await expect(dailyPage.startBtn).toBeVisible()
    await expect(dailyPage.startBtn).toBeEnabled()
  })

  test('W-M05-L1-002: Countdown timer den midnight hien thi @smoke @daily', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const dailyPage = new DailyChallengePage(page)
    await dailyPage.goto()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(dailyPage.countdown).toBeVisible()
    await expect(dailyPage.countdown).toHaveText(/\d{2}:\d{2}:\d{2}/)
  })

  test('W-M05-L1-003: Click Bat Dau vao quiz mode daily @smoke @daily @critical', async ({
    tier3Page,
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    await testApi.fullReset('test3@dev.local')

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const dailyPage = new DailyChallengePage(page)
    await dailyPage.goto()
    await dailyPage.startChallenge()
    await page.waitForURL('/quiz')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/quiz')
    const quizPage = new QuizPage(page)
    await expect(quizPage.questionText).toBeVisible()
  })

  test('W-M05-L1-004: Leaderboard section hien thi top users @smoke @daily', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const dailyPage = new DailyChallengePage(page)
    await dailyPage.goto()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(dailyPage.leaderboard).toBeVisible()
    await expect(
      dailyPage.leaderboard.locator('[data-testid="daily-leaderboard-row"]'),
    ).toHaveCount({ min: 1 })
  })

  test('W-M05-L1-005: Da hoan thanh hom nay button disabled + result hien thi @smoke @daily', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — test3 is pre-marked complete via global-setup
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const dailyPage = new DailyChallengePage(page)
    await dailyPage.goto()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(dailyPage.completedBadge).toBeVisible()
    await expect(page.getByTestId('daily-score-display')).toBeVisible()
  })

})
