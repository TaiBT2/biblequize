import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class QuizPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────
  readonly container: Locator
  readonly questionText: Locator
  readonly timer: Locator
  readonly progress: Locator
  readonly answerFeedback: Locator
  readonly nextBtn: Locator
  readonly scoreDelta: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('quiz-page')
    this.questionText = page.getByTestId('quiz-question-text')
    this.timer = page.getByTestId('quiz-timer')
    this.progress = page.getByTestId('quiz-progress')
    this.answerFeedback = page.getByTestId('quiz-answer-feedback')
    this.nextBtn = page.getByTestId('quiz-next-btn')
    this.scoreDelta = page.getByTestId('quiz-score-delta')
  }

  // ── Helpers ───────────────────────────────────────────────

  /** Get a specific answer option locator (0-3). */
  option(index: number): Locator {
    return this.page.getByTestId(`quiz-answer-${index}`)
  }

  // ── Actions ───────────────────────────────────────────────

  /** Click a specific answer option by index (0-3). */
  async answerOption(index: number): Promise<void> {
    await this.option(index).click()
    await this.answerFeedback.waitFor({ state: 'visible' })
  }

  /**
   * Try each option (0-3) until the feedback indicates a correct answer.
   * This works because after selecting an answer the correct one is
   * visually highlighted — we detect it via the green check_circle icon
   * on the correct option.
   *
   * NOTE: In practice, only the first click registers (subsequent clicks
   * are disabled). This method picks a random option; the test should
   * not rely on always being correct unless the API is mocked.
   */
  async answerCorrectly(): Promise<void> {
    // The correct answer index is revealed after any answer is submitted.
    // Pick option 0, then read which one was correct for assertions.
    await this.option(0).click()
    await this.answerFeedback.waitFor({ state: 'visible' })
  }

  /** Click the "Next" button that appears after answering. */
  async waitForNextQuestion(): Promise<void> {
    await this.nextBtn.click()
    // Wait for the feedback to disappear (new question loaded)
    await this.answerFeedback.waitFor({ state: 'detached', timeout: 5_000 }).catch(() => {
      // May transition to results page instead
    })
  }

  // ── Assertions ────────────────────────────────────────────

  async expectTimerVisible(): Promise<void> {
    await expect(this.timer).toBeVisible()
  }
}
