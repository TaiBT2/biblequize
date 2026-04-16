import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class PracticePage extends BasePage {
  // ── Locators ──────────────────────────────────────────────
  readonly container: Locator
  readonly bookSelect: Locator
  readonly startBtn: Locator
  readonly showExplanationToggle: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('practice-page')
    this.bookSelect = page.getByTestId('practice-book-select')
    this.startBtn = page.getByTestId('practice-start-btn')
    this.showExplanationToggle = page.getByTestId('practice-show-explanation-toggle')
  }

  // ── Helpers ───────────────────────────────────────────────

  /** Get a difficulty button locator. */
  difficultyBtn(level: 'all' | 'easy' | 'medium' | 'hard'): Locator {
    return this.page.getByTestId(`practice-difficulty-${level}`)
  }

  /** Get a question-count button locator. */
  countBtn(count: 5 | 10 | 20 | 50): Locator {
    return this.page.getByTestId(`practice-count-${count}`)
  }

  // ── Actions ───────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/practice')
    await this.waitForLoaded()
  }

  /**
   * Select a book using the SearchableSelect component.
   * Types the book name into the search input and picks the matching option.
   */
  async selectBook(name: string): Promise<void> {
    // The SearchableSelect is inside [data-testid="practice-book-select"]
    const searchInput = this.bookSelect.locator('input')
    await searchInput.click()
    await searchInput.fill(name)
    // Click the matching option in the dropdown
    await this.page.locator(`text="${name}"`).first().click()
  }

  async selectDifficulty(level: 'all' | 'easy' | 'medium' | 'hard'): Promise<void> {
    await this.difficultyBtn(level).click()
  }

  async selectCount(count: 5 | 10 | 20 | 50): Promise<void> {
    await this.countBtn(count).click()
  }

  async startQuiz(): Promise<void> {
    await this.startBtn.click()
  }
}
