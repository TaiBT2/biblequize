import { test, expect } from '@playwright/test'

test.describe('Admin Panel', () => {
  test.describe('Access Control', () => {
    test('should not allow unauthenticated access to admin', async ({ page }) => {
      await page.goto('/admin')
      await page.waitForTimeout(2000)
      expect(page.url()).not.toContain('/admin')
    })

    test('should not allow non-admin access to admin', async ({ page, request }) => {
      // Register via API (no UI register page)
      const timestamp = Date.now()
      const email = `e2eregular+${timestamp}@example.com`
      const password = 'Test@123456'

      await request.post('http://localhost:8080/api/auth/register', {
        data: { name: 'Regular User', email, password },
      })

      // Login via UI
      await page.goto('/login')
      await page.getByTestId('login-email-input').fill(email)
      await page.getByTestId('login-password-input').fill(password)
      await page.getByTestId('login-submit-btn').click()

      // Wait for redirect to home
      await expect(page).toHaveURL('/', { timeout: 10000 })

      // Try to access admin
      await page.goto('/admin')
      await page.waitForTimeout(2000)

      // Should be redirected away from admin
      expect(page.url()).not.toContain('/admin')
    })
  })

  test.describe('Admin API', () => {
    test('should reject unauthenticated admin API requests', async ({ request }) => {
      const response = await request.get('http://localhost:8080/api/admin/questions/ping')
      expect(response.status()).toBe(401)
    })

    test('should reject non-admin API requests', async ({ request }) => {
      const timestamp = Date.now()
      const email = `e2enonadmin+${timestamp}@example.com`

      const registerRes = await request.post('http://localhost:8080/api/auth/register', {
        data: { name: 'Non Admin', email, password: 'testpass123' },
      })

      if (!registerRes.ok()) return

      const { accessToken } = await registerRes.json()

      const adminRes = await request.get('http://localhost:8080/api/admin/questions/ping', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      expect(adminRes.status()).toBe(403)
    })
  })
})
