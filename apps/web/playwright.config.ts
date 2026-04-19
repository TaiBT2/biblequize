import { defineConfig, devices } from '@playwright/test'

// PLAYWRIGHT_BASE_URL = URL để target tests:
//   unset → http://localhost:5173 (dev local, Playwright tự bật `npm run dev`)
//   http://localhost:3000 → docker compose deploy
//   https://staging.example.com → remote env (CI, staging)
// Khi URL không phải dev local :5173, tự tắt webServer để không clash với
// server đang chạy ở nơi khác.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
const shouldStartDevServer = baseURL === 'http://localhost:5173'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 1,
  reporter: [['html', { open: 'never' }]],
  timeout: 30_000,

  expect: { timeout: 5_000 },

  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'smoke-parallel',
      testMatch: /smoke\/.*\.spec\.ts/,
      fullyParallel: true,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'happy-path-serial',
      testMatch: /happy-path\/.*\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: shouldStartDevServer
    ? [
        {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          timeout: 30_000,
        },
      ]
    : undefined,
})
