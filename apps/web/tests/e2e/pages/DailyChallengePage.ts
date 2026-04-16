import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class DailyChallengePage extends BasePage {
  // ── Locators ──────────────────────────────────────────────
  readonly container: Locator
  readonly countdown: Locator
  readonly startBtn: Locator
  readonly leaderboard: Locator
  readonly completedBadge: Locator
  readonly streakDisplay: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('daily-page')
    this.countdown = page.getByTestId('daily-countdown')
    this.startBtn = page.getByTestId('daily-start-btn')
    this.leaderboard = page.getByTestId('daily-leaderboard')
    this.completedBadge = page.getByTestId('daily-completed-badge')
    this.streakDisplay = page.getByTestId('daily-streak-display')
  }

  // ── Actions ───────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/daily')
    await this.waitForLoaded()
  }

  async startChallenge(): Promise<void> {
    await this.startBtn.click()
  }

  // ── Assertions ────────────────────────────────────────────

  async expectCompleted(): Promise<void> {
    await expect(this.completedBadge).toBeVisible()
  }
}
