import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from '../BasePage'

export class AdminDashboardPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────
  readonly container: Locator
  readonly kpiCards: Locator
  readonly activityLog: Locator

  readonly actionItems: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.getByTestId('admin-dashboard-page')
    this.kpiCards = page.getByTestId('admin-kpi-cards')
    this.activityLog = page.getByTestId('admin-activity-log')
    this.actionItems = page.locator('[data-testid="admin-action-items"]')
  }

  // ── Actions ───────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/admin')
    await this.waitForLoaded()
  }

  // ── Assertions ────────────────────────────────────────────

  /**
   * Assert that a KPI card with the given name contains the expected value.
   * KPI cards are inside [data-testid="admin-kpi-cards"]; individual cards
   * use data-testid="kpi-{name}" (e.g. "kpi-users", "kpi-questions").
   */
  async expectKpiValue(name: string, value: string): Promise<void> {
    const card = this.kpiCards.getByTestId(`kpi-${name}`)
    await expect(card).toContainText(value)
  }
}
