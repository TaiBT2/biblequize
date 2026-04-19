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
  readonly questionBook: Locator
  readonly explanation: Locator

  // ── Lifeline locators (v1 — hint only) ──
  readonly hintBtn: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('quiz-page')
    this.questionText = page.getByTestId('quiz-question-text')
    this.timer = page.getByTestId('quiz-timer')
    this.progress = page.getByTestId('quiz-progress')
    this.answerFeedback = page.getByTestId('quiz-answer-feedback')
    this.nextBtn = page.getByTestId('quiz-next-btn')
    this.scoreDelta = page.getByTestId('quiz-score-delta')
    this.questionBook = page.getByTestId('quiz-question-book')
    this.explanation = page.getByTestId('quiz-explanation')
    this.hintBtn = page.getByTestId('quiz-hint-btn')
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
   * Click the first answer option (index 0). The result may be correct
   * or incorrect — use this when the test doesn't care about correctness.
   */
  async answerFirst(): Promise<void> {
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

  /** Click the Hint lifeline. Waits for the hint response to complete. */
  async useHint(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/lifeline/hint') && res.request().method() === 'POST',
    )
    await this.hintBtn.click()
    await responsePromise
  }

  /** Returns the hint count displayed on the button (parses "Gợi ý (N)"). */
  async getHintsRemaining(): Promise<number | null> {
    const attr = await this.hintBtn.getAttribute('data-hint-remaining')
    return attr ? parseInt(attr, 10) : null
  }

  /** Returns indices of answer options currently eliminated by hint. */
  async getEliminatedOptions(): Promise<number[]> {
    const indices: number[] = []
    for (let i = 0; i < 4; i++) {
      const eliminated = await this.option(i).getAttribute('data-eliminated')
      if (eliminated === 'true') indices.push(i)
    }
    return indices
  }

  // ── Assertions ────────────────────────────────────────────

  async expectTimerVisible(): Promise<void> {
    await expect(this.timer).toBeVisible()
  }
}
