import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Base Page Object — shared utilities for all page objects.
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  /**
   * Wait for skeleton / loading indicators to disappear,
   * meaning the page content has fully loaded.
   */
  async waitForLoaded(): Promise<void> {
    // Wait for any animate-pulse skeleton to detach / become hidden
    const skeleton = this.page.locator('.animate-pulse').first()
    await skeleton.waitFor({ state: 'detached', timeout: 15_000 }).catch(() => {
      // No skeleton found — page loaded without one
    })
  }

  /**
   * Wait for a CSS animation / transition to finish on a locator.
   */
  async waitForAnimationEnd(locator: Locator): Promise<void> {
    await locator.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished)),
    )
  }
}
