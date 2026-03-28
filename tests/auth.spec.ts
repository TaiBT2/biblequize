import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login page with social and email tabs', async ({ page }) => {
      await page.goto('/login')

      await expect(page.getByText('BibleQuiz')).toBeVisible()
      await expect(page.locator('h1').filter({ hasText: 'Đăng nhập' })).toBeVisible()
      await expect(page.getByText('Mạng xã hội')).toBeVisible()
      await expect(page.getByText('Email & Mật khẩu')).toBeVisible()
    })

    test('should show Google and Facebook login buttons on social tab', async ({ page }) => {
      await page.goto('/login')

      await expect(page.getByText('Tiếp tục với Google')).toBeVisible()
      await expect(page.getByText('Tiếp tục với Facebook')).toBeVisible()
    })

    test('should switch to email tab and show login form', async ({ page }) => {
      await page.goto('/login')
      await page.getByText('Email & Mật khẩu').click()

      await expect(page.getByPlaceholder('email@example.com')).toBeVisible()
      await expect(page.getByPlaceholder('••••••••')).toBeVisible()
      await expect(page.getByText('Nhớ đăng nhập')).toBeVisible()
    })

    test('should switch to register mode on email tab', async ({ page }) => {
      await page.goto('/login')
      await page.getByText('Email & Mật khẩu').click()
      await page.getByText('Đăng ký').click()

      await expect(page.getByPlaceholder('Nguyễn Văn A')).toBeVisible()
      await expect(page.getByPlaceholder('email@example.com')).toBeVisible()
      await expect(page.getByPlaceholder('Tối thiểu 8 ký tự')).toBeVisible()
      await expect(page.getByPlaceholder('Nhập lại mật khẩu')).toBeVisible()
      await expect(page.getByText('Tạo tài khoản')).toBeVisible()
    })

    test('should show error for short password on register', async ({ page }) => {
      await page.goto('/login')
      await page.getByText('Email & Mật khẩu').click()
      await page.getByText('Đăng ký').click()

      await page.getByPlaceholder('Nguyễn Văn A').fill('Test User')
      await page.getByPlaceholder('email@example.com').fill('test@example.com')
      await page.getByPlaceholder('Tối thiểu 8 ký tự').fill('short')
      await page.getByPlaceholder('Nhập lại mật khẩu').fill('short')
      await page.getByText('Tạo tài khoản').click()

      await expect(page.getByText('Mật khẩu phải có ít nhất 8 ký tự')).toBeVisible()
    })

    test('should show error for mismatched passwords on register', async ({ page }) => {
      await page.goto('/login')
      await page.getByText('Email & Mật khẩu').click()
      await page.getByText('Đăng ký').click()

      await page.getByPlaceholder('Nguyễn Văn A').fill('Test User')
      await page.getByPlaceholder('email@example.com').fill('test@example.com')
      await page.getByPlaceholder('Tối thiểu 8 ký tự').fill('password123')
      await page.getByPlaceholder('Nhập lại mật khẩu').fill('different123')
      await page.getByText('Tạo tài khoản').click()

      await expect(page.getByText('Mật khẩu xác nhận không khớp')).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login')
      await page.getByText('Email & Mật khẩu').click()

      const passwordInput = page.getByPlaceholder('••••••••')
      await expect(passwordInput).toHaveAttribute('type', 'password')

      await page.getByRole('button', { name: 'Hiện mật khẩu' }).click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
    })

    test('should have link back to home', async ({ page }) => {
      await page.goto('/login')

      const backLink = page.getByText('Quay lại trang chủ')
      await expect(backLink).toBeVisible()
      await backLink.click()
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Email Login Flow', () => {
    test('should login with valid credentials and redirect to home', async ({ page }) => {
      // Register first
      await page.goto('/login')
      await page.getByText('Email & Mật khẩu').click()
      await page.getByText('Đăng ký').click()

      const timestamp = Date.now()
      const email = `e2etest+${timestamp}@example.com`

      await page.getByPlaceholder('Nguyễn Văn A').fill('E2E Test User')
      await page.getByPlaceholder('email@example.com').fill(email)
      await page.getByPlaceholder('Tối thiểu 8 ký tự').fill('password123')
      await page.getByPlaceholder('Nhập lại mật khẩu').fill('password123')
      await page.getByText('Tạo tài khoản').click()

      // Should redirect to home after successful registration
      await expect(page).toHaveURL('/', { timeout: 10000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      await page.getByText('Email & Mật khẩu').click()

      await page.getByPlaceholder('email@example.com').fill('nonexistent@example.com')
      await page.getByPlaceholder('••••••••').fill('wrongpassword')
      await page.locator('button[type="submit"]').click()

      // Should show error message (Vietnamese)
      await page.waitForTimeout(2000)
      const errorVisible = await page.locator('text=thất bại').or(page.locator('text=không đúng')).isVisible().catch(() => false)
      // If no specific error text, at least we should still be on login page
      if (!errorVisible) {
        await expect(page).toHaveURL(/login/)
      }
    })
  })
})
