import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class QuizResultsPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────
  readonly container: Locator
  readonly scoreDisplay: Locator
  readonly reviewBtn: Locator
  readonly homeBtn: Locator

  // Accuracy & grade are rendered inline — use text selectors
  readonly accuracyText: Locator
  readonly gradeText: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('quiz-results-page')
    this.scoreDisplay = page.getByTestId('quiz-results-score')
    this.reviewBtn = page.getByTestId('quiz-results-review-btn')
    this.homeBtn = page.getByTestId('quiz-results-home-btn')

    // TODO [NEEDS TESTID: quiz-results-accuracy] — accuracy percentage text
    this.accuracyText = this.container.locator('.text-secondary.font-bold.text-lg')

    // TODO [NEEDS TESTID: quiz-results-grade] — grade heading (e.g. "Excellent")
    this.gradeText = this.container.locator('h1')
  }

  // ── Assertions ────────────────────────────────────────────

  async expectScore(correct: number, total: number): Promise<void> {
    await expect(this.scoreDisplay).toContainText(`${correct}/${total}`)
  }

  async expectAccuracy(percent: number): Promise<void> {
    await expect(this.accuracyText).toContainText(`${percent}%`)
  }

  async expectGrade(text: string): Promise<void> {
    await expect(this.gradeText).toContainText(text)
  }

  // ── Actions ───────────────────────────────────────────────

  async clickReview(): Promise<void> {
    await this.reviewBtn.click()
  }

  async clickHome(): Promise<void> {
    await this.homeBtn.click()
  }
}
