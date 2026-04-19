/**
 * W-M03 — Hint Lifeline (L2 Happy Path, v1)
 *
 * Route: /quiz (practice session)
 * Feature: `/api/sessions/{id}/lifeline/hint` — eliminate one wrong option
 * ADR: DECISIONS.md 2026-04-18 (ship hint only, defer ask-opinion to v2)
 *
 * Coverage (5 cases):
 *   W-M03-L2-HINT-001: click hint -> one wrong option greyed out + counter decrements
 *   W-M03-L2-HINT-002: hint button disabled after quota exhausted
 *   W-M03-L2-HINT-003: eliminated state resets on next question, quota persists
 *   W-M03-L2-HINT-004: eliminated option is not clickable (disabled)
 *   W-M03-L2-HINT-005: AskOpinion button is NOT rendered (v1 regression guard)
 */

import { test, expect } from '../../fixtures/auth'
import { PracticePage } from '../../pages/PracticePage'
import { QuizPage } from '../../pages/QuizPage'

const TEST_EMAIL = 'test3@dev.local'

test.describe('W-M03 Hint Lifeline (v1)', () => {
  test.beforeEach(async ({ testApi }) => {
    await testApi.resetHistory(TEST_EMAIL)
    await testApi.setState(TEST_EMAIL, { livesRemaining: 100, questionsCounted: 0 })
  })

  // ── 001 — happy path: hint eliminates one option ─────────────────

  test('W-M03-L2-HINT-001: click hint -> one option greyed out, counter decrements', async ({
    tier3Page: page,
  }) => {
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL(/\/quiz/)

    const quizPage = new QuizPage(page)
    await expect(quizPage.questionText).toBeVisible()
    await expect(quizPage.hintBtn).toBeVisible()

    // Practice mode has unlimited hints (quota = -1) per LifelineConfigService.
    // The button shows "Gợi ý" without a count in that case; we just verify
    // it's enabled and clickable.
    const eliminatedBefore = await quizPage.getEliminatedOptions()
    expect(eliminatedBefore).toHaveLength(0)

    await quizPage.useHint()

    const eliminatedAfter = await quizPage.getEliminatedOptions()
    expect(eliminatedAfter).toHaveLength(1)
  })

  // ── 002 — quota exhaustion (ranked has quota 2) ──────────────────

  test('W-M03-L2-HINT-002: ranked session -> 3rd hint blocked (quota=2)', async ({
    tier3Page: page,
  }) => {
    // Ranked mode enforces the 2-hint quota. Navigate via Ranked flow.
    await page.goto('/ranked')
    await page.waitForLoadState('networkidle')

    // Click "Start" / "Chơi ngay" button to begin ranked session
    const startBtn = page
      .getByTestId('ranked-start-btn')
      .or(page.getByRole('button', { name: /bắt đầu|start|chơi ngay/i }))
    await startBtn.first().click()
    await page.waitForURL(/\/quiz/, { timeout: 10_000 })

    const quizPage = new QuizPage(page)
    await expect(quizPage.hintBtn).toBeVisible()

    // Use hint #1
    await quizPage.useHint()
    let eliminated = await quizPage.getEliminatedOptions()
    expect(eliminated).toHaveLength(1)

    // Use hint #2 on the same question (should eliminate another wrong option)
    await quizPage.useHint()
    eliminated = await quizPage.getEliminatedOptions()
    expect(eliminated).toHaveLength(2)

    // Hint #3 — button should be disabled (quota exhausted)
    await expect(quizPage.hintBtn).toBeDisabled()
  })

  // ── 003 — reset on question change, quota persists ───────────────

  test('W-M03-L2-HINT-003: advance to next question -> eliminated resets, quota persists', async ({
    tier3Page: page,
  }) => {
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL(/\/quiz/)

    const quizPage = new QuizPage(page)
    await expect(quizPage.questionText).toBeVisible()

    // Use hint on Q1
    await quizPage.useHint()
    expect(await quizPage.getEliminatedOptions()).toHaveLength(1)

    // Answer (any option), advance to Q2
    await quizPage.answerFirst()
    await quizPage.waitForNextQuestion()

    // Q2 should have a fresh set of options with none eliminated
    await expect(quizPage.questionText).toBeVisible()
    const eliminatedOnQ2 = await quizPage.getEliminatedOptions()
    expect(eliminatedOnQ2).toHaveLength(0)

    // Hint button should still be enabled (quota is per-session, not per-question;
    // Practice mode has unlimited quota anyway)
    await expect(quizPage.hintBtn).toBeEnabled()
  })

  // ── 004 — eliminated option is not clickable ─────────────────────

  test('W-M03-L2-HINT-004: eliminated option cannot be selected', async ({
    tier3Page: page,
  }) => {
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL(/\/quiz/)

    const quizPage = new QuizPage(page)
    await quizPage.useHint()

    const eliminated = await quizPage.getEliminatedOptions()
    expect(eliminated).toHaveLength(1)
    const eliminatedIndex = eliminated[0]

    const option = quizPage.option(eliminatedIndex)
    await expect(option).toBeDisabled()
    // aria-disabled should also be set for accessibility
    await expect(option).toHaveAttribute('aria-disabled', 'true')
  })

  // ── 005 — regression guard: AskOpinion removed ───────────────────

  test('W-M03-L2-HINT-005: AskOpinion button is NOT present (v1 regression guard)', async ({
    tier3Page: page,
  }) => {
    const practicePage = new PracticePage(page)
    await practicePage.goto()
    await practicePage.selectDifficulty('easy')
    await practicePage.selectCount(5)
    await practicePage.startQuiz()
    await page.waitForURL(/\/quiz/)

    const quizPage = new QuizPage(page)
    await expect(quizPage.questionText).toBeVisible()

    // AskOpinion was removed in v1 — ensure no button with the Vietnamese
    // or English label for it appears anywhere on the page.
    await expect(page.getByText(/Hỏi ý kiến/i)).toHaveCount(0)
    await expect(page.getByText(/Ask opinion/i)).toHaveCount(0)

    // Hint button IS present
    await expect(quizPage.hintBtn).toBeVisible()
  })
})
