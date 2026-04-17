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
    // TODO [NEEDS TESTID: daily-page] — wrapper trang DailyChallenge
    await expect(dailyPage.container).toBeVisible()
    // TODO [NEEDS TESTID: daily-streak-display] — streak hien tai
    await expect(dailyPage.streakDisplay).toBeVisible()
    // TODO [NEEDS TESTID: daily-start-btn] — nut "Bat Dau Thu Thach"
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
    // TODO [NEEDS TESTID: daily-countdown] — countdown toi midnight reset
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
    // TODO [NEEDS TESTID: daily-leaderboard] — section bang xep hang daily
    await expect(dailyPage.leaderboard).toBeVisible()
    // TODO [NEEDS TESTID: daily-leaderboard-row] — moi hang user
    await expect(
      dailyPage.leaderboard.locator('[data-testid="daily-leaderboard-row"]'),
    ).toHaveCount({ min: 1 })
  })

  test('W-M05-L1-005: Da hoan thanh hom nay button disabled + result hien thi @smoke @daily', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    // [NOT IMPLEMENTED: can endpoint test-helper de mark daily completed]
    test.skip()

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const dailyPage = new DailyChallengePage(page)
    await dailyPage.goto()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(dailyPage.startBtn).toBeDisabled()
    // TODO [NEEDS TESTID: daily-completed-badge] — badge "Da Hoan Thanh"
    await expect(dailyPage.completedBadge).toBeVisible()
    // TODO [NEEDS TESTID: daily-score-display] — score/stars da dat hom nay
    await expect(page.getByTestId('daily-score-display')).toBeVisible()
  })

})
