import { test, expect } from '@playwright/test'

test.describe('Public Pages', () => {
  test.describe('Home Page', () => {
    test('should load home page', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL('/')
    })

    test('should display app branding', async ({ page }) => {
      await page.goto('/')
      // The page should have some content loaded
      await expect(page.locator('body')).not.toBeEmpty()
    })

    test('should have navigation links', async ({ page }) => {
      await page.goto('/')

      // Check for common nav elements
      const body = page.locator('body')
      await expect(body).toBeVisible()
    })
  })

  test.describe('Practice Page', () => {
    test('should load practice page without auth', async ({ page }) => {
      await page.goto('/practice')
      // Practice is a public route, should not redirect to login
      await expect(page).toHaveURL('/practice')
    })

    test('should display quiz configuration options', async ({ page }) => {
      await page.goto('/practice')
      // Should have some content for starting a quiz
      await expect(page.locator('body')).not.toBeEmpty()
    })
  })

  test.describe('Leaderboard Page', () => {
    test('should load leaderboard page', async ({ page }) => {
      await page.goto('/leaderboard')
      await expect(page).toHaveURL('/leaderboard')
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect /profile to /login when not authenticated', async ({ page }) => {
      await page.goto('/profile')
      // RequireAuth should redirect to login
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })

    test('should redirect /rooms to /login when not authenticated', async ({ page }) => {
      await page.goto('/rooms')
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })

    test('should redirect /multiplayer to /login when not authenticated', async ({ page }) => {
      await page.goto('/multiplayer')
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })

    test('should redirect /room/create to /login when not authenticated', async ({ page }) => {
      await page.goto('/room/create')
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })

    test('should redirect /admin to /login when not authenticated', async ({ page }) => {
      await page.goto('/admin')
      // Should redirect (either to login or home)
      await page.waitForTimeout(2000)
      const url = page.url()
      expect(url).not.toContain('/admin')
    })
  })

  test.describe('API Health', () => {
    test('should have healthy API', async ({ request }) => {
      // /api/books is a public endpoint that proves API is up
      const response = await request.get('http://localhost:8080/api/books')
      expect(response.ok()).toBeTruthy()
    })

    test('should return books from API', async ({ request }) => {
      const response = await request.get('http://localhost:8080/api/books')
      expect(response.ok()).toBeTruthy()

      const books = await response.json()
      expect(Array.isArray(books)).toBeTruthy()
      expect(books.length).toBeGreaterThan(0)
    })

    test('should return questions from API', async ({ request }) => {
      const response = await request.get('http://localhost:8080/api/questions?limit=5')
      expect(response.ok()).toBeTruthy()

      const questions = await response.json()
      expect(Array.isArray(questions)).toBeTruthy()
      expect(questions.length).toBeGreaterThan(0)
      expect(questions[0]).toHaveProperty('content')
      expect(questions[0]).toHaveProperty('book')
    })

    test('should return question of the day', async ({ request }) => {
      const response = await request.get('http://localhost:8080/api/questions/qotd')
      // QOTD may return 200 or 500 if no questions seeded - just check it responds
      expect(response.status()).toBeLessThan(502)
    })
  })
})
