import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class RankedPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────
  readonly container: Locator
  readonly startBtn: Locator
  readonly noEnergyMsg: Locator
  readonly energyDisplay: Locator
  readonly resetTimer: Locator
  readonly tierBadge: Locator
  readonly questionsCounted: Locator
  readonly pointsToday: Locator
  readonly userRank: Locator
  readonly currentBook: Locator
  readonly seasonCard: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('ranked-page')
    this.startBtn = page.getByTestId('ranked-start-btn')
    this.noEnergyMsg = page.getByTestId('ranked-no-energy-msg')
    this.energyDisplay = page.getByTestId('ranked-energy-display')
    this.resetTimer = page.getByTestId('ranked-reset-timer')
    this.tierBadge = page.getByTestId('ranked-tier-badge')
    this.questionsCounted = page.getByTestId('ranked-questions-counted')
    this.pointsToday = page.getByTestId('ranked-points-today')
    this.userRank = page.getByTestId('ranked-user-rank')
    this.currentBook = page.getByTestId('ranked-current-book')
    this.seasonCard = page.getByTestId('ranked-season-card')
  }

  // ── Actions ───────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/ranked')
    await this.waitForLoaded()
  }

  async startQuiz(): Promise<void> {
    await this.startBtn.click()
  }

  // ── Assertions ────────────────────────────────────────────

  async expectEnergyToBe(n: number): Promise<void> {
    // The energy display shows "N/dailyLives" — check the leading number
    await expect(this.energyDisplay).toContainText(String(n))
  }

  async expectStartDisabled(): Promise<void> {
    await expect(this.startBtn).not.toBeVisible()
    await expect(this.noEnergyMsg).toBeVisible()
  }
}
