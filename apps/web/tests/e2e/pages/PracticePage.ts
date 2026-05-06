import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class PracticePage extends BasePage {
  // ── Locators ──────────────────────────────────────────────
  readonly container: Locator
  readonly bookSelect: Locator
  readonly startBtn: Locator
  readonly showExplanationToggle: Locator
  readonly timeSlider: Locator
  readonly chapterFromInput: Locator
  readonly chapterToInput: Locator
  readonly verseFromInput: Locator
  readonly verseToInput: Locator
  readonly rangeError: Locator
  readonly retryWrongBanner: Locator
  readonly retryWrongBtn: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('practice-page')
    this.bookSelect = page.getByTestId('practice-book-select')
    this.startBtn = page.getByTestId('practice-start-btn')
    this.showExplanationToggle = page.getByTestId('practice-show-explanation-toggle')
    this.timeSlider = page.getByTestId('practice-time-slider')
    this.chapterFromInput = page.getByTestId('practice-chapter-from')
    this.chapterToInput = page.getByTestId('practice-chapter-to')
    this.verseFromInput = page.getByTestId('practice-verse-from')
    this.verseToInput = page.getByTestId('practice-verse-to')
    this.rangeError = page.getByTestId('practice-range-error')
    this.retryWrongBanner = page.getByTestId('practice-retry-wrong')
    this.retryWrongBtn = page.getByTestId('practice-retry-wrong-btn')
  }

  async setTimePerQuestion(seconds: number): Promise<void> {
    await this.timeSlider.evaluate((el, s) => {
      const input = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(input, String(s))
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, seconds)
  }

  async setChapterRange(from: number, to: number): Promise<void> {
    await this.chapterFromInput.fill(String(from))
    await this.chapterToInput.fill(String(to))
  }

  async setVerseRange(from: number, to: number): Promise<void> {
    await this.verseFromInput.fill(String(from))
    await this.verseToInput.fill(String(to))
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
