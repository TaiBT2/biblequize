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
  readonly currentBook: Locator
  readonly seasonCard: Locator
  readonly capReachedMsg: Locator
  readonly energyTimer: Locator
  readonly seasonRank: Locator
  readonly seasonPoints: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('ranked-page')
    // E2E runs on a desktop viewport — the action-card CTA (`ranked-start-btn-desktop`)
    // is the visible one; `ranked-start-btn` belongs to the mobile sticky footer.
    this.startBtn = page.getByTestId('ranked-start-btn-desktop')
    this.noEnergyMsg = page.getByTestId('ranked-no-energy-msg')
    this.energyDisplay = page.getByTestId('ranked-energy-display')
    this.resetTimer = page.getByTestId('ranked-reset-timer')
    this.tierBadge = page.getByTestId('ranked-tier-badge')
    this.questionsCounted = page.getByTestId('ranked-questions-counted')
    this.pointsToday = page.getByTestId('ranked-points-today')
    this.currentBook = page.getByTestId('ranked-current-book')
    this.seasonCard = page.getByTestId('ranked-season-card')
    this.capReachedMsg = page.getByTestId('ranked-cap-reached-msg')
    this.energyTimer = page.getByTestId('ranked-reset-timer')
    this.seasonRank = page.getByTestId('ranked-season-rank')
    this.seasonPoints = page.getByTestId('ranked-season-points')
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
    // The desktop CTA stays in the DOM when out of energy — it renders
    // disabled rather than being removed.
    await expect(this.startBtn).toBeDisabled()
  }
}
