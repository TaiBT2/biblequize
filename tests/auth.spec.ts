import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login page with brand and form', async ({ page }) => {
      await page.goto('/login')

      // Brand
      await expect(page.getByText('Bible Quiz').first()).toBeVisible()
      // Heading
      await expect(page.getByText('Chào mừng trở lại')).toBeVisible()
      // Google OAuth button
      await expect(page.getByTestId('login-google-btn')).toBeVisible()
      await expect(page.getByText('Tiếp tục với Google')).toBeVisible()
      // Divider
      await expect(page.getByText('hoặc đăng nhập với')).toBeVisible()
      // Email/password form (always visible, no tabs)
      await expect(page.getByTestId('login-email-input')).toBeVisible()
      await expect(page.getByTestId('login-password-input')).toBeVisible()
      await expect(page.getByTestId('login-submit-btn')).toBeVisible()
    })

    test('should show Google login button', async ({ page }) => {
      await page.goto('/login')

      const googleBtn = page.getByTestId('login-google-btn')
      await expect(googleBtn).toBeVisible()
      await expect(googleBtn).toBeEnabled()
      await expect(googleBtn).toContainText('Tiếp tục với Google')
    })

    test('should show email login form fields', async ({ page }) => {
      await page.goto('/login')

      await expect(page.getByPlaceholder('email@example.com')).toBeVisible()
      await expect(page.getByPlaceholder('••••••••')).toBeVisible()
      await expect(page.getByTestId('login-submit-btn')).toContainText('Đăng nhập')
    })

    test('should show guest play link', async ({ page }) => {
      await page.goto('/login')

      const guestLink = page.getByTestId('login-guest-link')
      await expect(guestLink).toBeVisible()
      await expect(guestLink).toContainText('Chơi thử không cần đăng nhập')
    })

    test('should navigate to home as guest', async ({ page }) => {
      await page.goto('/login')
      await page.getByTestId('login-guest-link').click()
      await expect(page).toHaveURL('/')
    })

    test('should have register link', async ({ page }) => {
      await page.goto('/login')

      await expect(page.getByText('Chưa có tài khoản?')).toBeVisible()
      await expect(page.getByText('Đăng ký ngay')).toBeVisible()
    })
  })

  test.describe('Email Login Flow', () => {
    test('should login with valid credentials and redirect to home', async ({ page, request }) => {
      // Register via API first (no UI register page)
      const timestamp = Date.now()
      const email = `e2etest+${timestamp}@example.com`
      const password = 'Test@123456'

      await request.post('http://localhost:8080/api/auth/register', {
        data: { name: 'E2E Test User', email, password },
      })

      // Login via UI
      await page.goto('/login')
      await page.getByTestId('login-email-input').fill(email)
      await page.getByTestId('login-password-input').fill(password)
      await page.getByTestId('login-submit-btn').click()

      await expect(page).toHaveURL('/', { timeout: 10000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByTestId('login-email-input').fill('nonexistent@example.com')
      await page.getByTestId('login-password-input').fill('wrongpassword123')
      await page.getByTestId('login-submit-btn').click()

      await expect(page.getByTestId('login-error-msg')).toBeVisible({ timeout: 5000 })
    })

    test('should keep user on login page after failed login', async ({ page }) => {
      await page.goto('/login')

      await page.getByTestId('login-email-input').fill('bad@example.com')
      await page.getByTestId('login-password-input').fill('badpass123')
      await page.getByTestId('login-submit-btn').click()

      await page.waitForTimeout(2000)
      await expect(page).toHaveURL(/login/)
      await expect(page.getByTestId('login-submit-btn')).toBeEnabled()
    })
  })
})
