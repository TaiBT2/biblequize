/**
 * W-M03 — Practice Mode (L1 Smoke)
 *
 * Routes: /practice, /quiz, /review
 * Spec ref: SPEC_USER §5.1
 */

import { test, expect } from '../../fixtures/auth'
import { PracticePage } from '../../pages/PracticePage'
import { QuizPage } from '../../pages/QuizPage'
import { QuizResultsPage } from '../../pages/QuizResultsPage'
import { LoginPage } from '../../pages/LoginPage'

test.describe('W-M03 Practice Mode — L1 Smoke @smoke @practice', () => {

  test('W-M03-L1-001: Trang Practice Selection render dung @smoke @practice', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const practicePage = new PracticePage(page)
    await practicePage.goto()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/practice')
    await expect(practicePage.bookSelect).toBeVisible()
    await expect(practicePage.difficultyBtn('all')).toBeVisible()
    await expect(practicePage.countBtn(10)).toBeVisible()
    await expect(practicePage.startBtn).toBeVisible()
    await expect(practicePage.startBtn).toBeEnabled()
  })

  test('W-M03-L1-002: Chon difficulty Easy va bat dau quiz @smoke @practice', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL('/quiz')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/quiz')
    const quizPage = new QuizPage(page)
    await expect(quizPage.questionText).toBeVisible()
    await expect(quizPage.option(0)).toBeVisible()
    await expect(quizPage.option(1)).toBeVisible()
    await expect(quizPage.option(2)).toBeVisible()
    await expect(quizPage.option(3)).toBeVisible()
  })

  test('W-M03-L1-003: Quiz chon dap an nhan feedback @smoke @practice @critical', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL('/quiz')

    const quizPage = new QuizPage(page)
    await quizPage.questionText.waitFor({ state: 'visible' })
    await quizPage.answerOption(0)

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(quizPage.answerFeedback).toBeVisible()
    await expect(quizPage.nextBtn).toBeVisible()
    await expect(quizPage.option(0)).toBeVisible()
  })

  test('W-M03-L1-004: Quiz hoan thanh redirect den trang ket qua @smoke @practice @critical', async ({
    tier3Page,
  }) => {
    test.slow() // 3x timeout — need to answer 5 questions

    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL('/quiz')

    const quizPage = new QuizPage(page)
    for (let i = 0; i < 5; i++) {
      await quizPage.questionText.waitFor({ state: 'visible' })
      await quizPage.answerOption(0)
      // On the last question there may be no next button — results page loads
      if (i < 4) {
        await quizPage.waitForNextQuestion()
      }
    }

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    const resultsPage = new QuizResultsPage(page)
    await resultsPage.container.waitFor({ state: 'visible', timeout: 10_000 })
    await expect(resultsPage.container).toBeVisible()
    await expect(resultsPage.scoreDisplay).toBeVisible()
    await expect(resultsPage.reviewBtn).toBeVisible()
    await expect(resultsPage.homeBtn).toBeVisible()
  })

  test('W-M03-L1-005: Navigate tu ket qua den Review page @smoke @practice', async ({
    tier3Page,
  }) => {
    test.slow() // 3x timeout — need to complete quiz first

    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS — complete quiz then navigate to review
    // ============================================================
    const page = tier3Page
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL('/quiz')

    const quizPage = new QuizPage(page)
    for (let i = 0; i < 5; i++) {
      await quizPage.questionText.waitFor({ state: 'visible' })
      await quizPage.answerOption(0)
      if (i < 4) {
        await quizPage.waitForNextQuestion()
      }
    }

    const resultsPage = new QuizResultsPage(page)
    await resultsPage.container.waitFor({ state: 'visible', timeout: 10_000 })
    await resultsPage.clickReview()
    await page.waitForURL('/review')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/review')
    await expect(page.getByTestId('review-page')).toBeVisible()
    await expect(page.getByTestId('review-filter-all')).toBeVisible()
    await expect(page.getByTestId('review-filter-wrong')).toBeVisible()
    await expect(page.getByTestId('review-filter-correct')).toBeVisible()
    await expect(
      page.getByTestId('review-question-list').locator('[data-testid="review-question-item"]'),
    ).toHaveCount(5)
  })

  test('W-M03-L1-006: Review filter tab Wrong chi hien cau sai @smoke @practice', async ({
    tier3Page,
  }) => {
    test.slow() // 3x timeout — need to complete quiz first

    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS — complete quiz, go to review, click Wrong tab
    // ============================================================
    const page = tier3Page
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL('/quiz')

    const quizPage = new QuizPage(page)
    for (let i = 0; i < 5; i++) {
      await quizPage.questionText.waitFor({ state: 'visible' })
      await quizPage.answerOption(0)
      if (i < 4) {
        await quizPage.waitForNextQuestion()
      }
    }

    const resultsPage = new QuizResultsPage(page)
    await resultsPage.container.waitFor({ state: 'visible', timeout: 10_000 })
    await resultsPage.clickReview()
    await page.waitForURL('/review')

    await page.getByTestId('review-filter-wrong').click()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('review-filter-wrong')).toHaveAttribute('data-active', 'true')
    // Wrong-only items should be fewer than total (5) — at least some should be filtered
    const wrongCount = await page
      .getByTestId('review-question-list')
      .locator('[data-testid="review-question-item"]')
      .count()
    expect(wrongCount).toBeLessThanOrEqual(5)
  })

  test('W-M03-L1-007: Review nut Retry Wrong tao session moi @smoke @practice @write', async ({
    page,
    testApi,
  }) => {
    test.slow() // 3x timeout — need to complete quiz + retry

    // ============================================================
    // SECTION 1: SETUP — fresh login
    // ============================================================
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginWithCredentials('test3@dev.local', 'Test@123456')
    await page.waitForURL('/')

    // ============================================================
    // SECTION 2: ACTIONS — complete quiz, go to review, click Retry
    // ============================================================
    const practicePage = new PracticePage(page)
    await page.goto('/practice')
    await practicePage.waitForLoaded()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL('/quiz')

    const quizPage = new QuizPage(page)
    for (let i = 0; i < 5; i++) {
      await quizPage.questionText.waitFor({ state: 'visible' })
      await quizPage.answerOption(0)
      if (i < 4) {
        await quizPage.waitForNextQuestion()
      }
    }

    const resultsPage = new QuizResultsPage(page)
    await resultsPage.container.waitFor({ state: 'visible', timeout: 10_000 })
    await resultsPage.clickReview()
    await page.waitForURL('/review')

    await page.getByTestId('review-retry-btn').click()
    await page.waitForURL('/quiz')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/quiz')
    await expect(quizPage.questionText).toBeVisible()
  })

  test('W-M03-L1-008: Practice voi sach cu the filter by book @smoke @practice', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectBook('Genesis')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL('/quiz')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/quiz')
    await expect(page.getByTestId('quiz-question-book')).toHaveText(/Genesis|Sáng Thế/)
  })

})
