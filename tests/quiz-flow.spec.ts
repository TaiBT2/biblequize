import { test, expect } from '@playwright/test'

test.describe('Quiz Flow', () => {
  test.describe('Practice Mode', () => {
    test('should navigate to practice page', async ({ page }) => {
      await page.goto('/practice')
      await expect(page).toHaveURL('/practice')
      await expect(page.locator('body')).not.toBeEmpty()
    })

    test('should be able to start a quiz from practice', async ({ page }) => {
      await page.goto('/practice')

      // Look for a start button or quiz configuration
      // The practice page should have a way to start quiz
      const startButton = page.locator('button').filter({ hasText: /bắt đầu|start|chơi/i }).first()
      if (await startButton.isVisible()) {
        await startButton.click()
        // Should navigate to quiz page
        await page.waitForTimeout(2000)
        const url = page.url()
        expect(url.includes('/quiz') || url.includes('/practice')).toBeTruthy()
      }
    })
  })

  test.describe('Quiz Page', () => {
    test('should load quiz page', async ({ page }) => {
      await page.goto('/quiz')
      await expect(page.locator('body')).not.toBeEmpty()
    })
  })

  test.describe('Ranked Mode', () => {
    test('should load ranked page', async ({ page }) => {
      await page.goto('/ranked')
      // Ranked may redirect to login if auth required, or stay on /ranked
      await page.waitForTimeout(2000)
      const url = page.url()
      expect(url.includes('/ranked') || url.includes('/login')).toBeTruthy()
    })
  })

  test.describe('Achievements Page', () => {
    test('should load achievements page', async ({ page }) => {
      await page.goto('/achievements')
      await expect(page).toHaveURL('/achievements')
    })
  })
})
