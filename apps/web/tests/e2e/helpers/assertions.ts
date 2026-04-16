/**
 * Custom assertion helpers for Playwright e2e tests.
 *
 * These avoid flakiness by using proper waits instead of magic timeouts.
 */

import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Wait for all skeleton loading placeholders to disappear.
 * Skeletons are identified by class names containing "skeleton".
 */
export async function waitForLoaded(page: Page): Promise<void> {
  await expect(page.locator('[class*="skeleton"]')).toHaveCount(0, {
    timeout: 10_000,
  })
}

/**
 * Wait for a CSS animation or transition to finish on a specific element.
 * Falls back after 1 second if no animation event fires (element might
 * not have an active animation).
 */
export async function waitForAnimationEnd(locator: Locator): Promise<void> {
  await locator.evaluate((el) =>
    new Promise<void>((resolve) => {
      const done = () => resolve()
      el.addEventListener('animationend', done, { once: true })
      el.addEventListener('transitionend', done, { once: true })
      // Fallback — no animation detected
      setTimeout(done, 1_000)
    }),
  )
}

/**
 * Collect JS errors from the page and assert that none occurred.
 *
 * Usage:
 * ```ts
 * const errors = expectNoConsoleErrors(page)
 * // ... perform actions ...
 * errors.assert()
 * ```
 *
 * Known/expected errors can be filtered via the `ignore` parameter.
 */
export function expectNoConsoleErrors(
  page: Page,
  ignore: RegExp[] = [],
): { assert: () => void } {
  const errors: string[] = []

  page.on('pageerror', (error) => {
    const msg = error.message
    const isIgnored = ignore.some((re) => re.test(msg))
    if (!isIgnored) {
      errors.push(msg)
    }
  })

  return {
    assert() {
      expect(
        errors,
        `Unexpected browser JS errors:\n${errors.join('\n')}`,
      ).toHaveLength(0)
    },
  }
}
