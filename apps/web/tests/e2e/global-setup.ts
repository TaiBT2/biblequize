/**
 * Playwright global setup — runs once before all tests.
 *
 * 1. Seeds test data via POST /api/admin/seed/test-data
 * 2. Logs in each test user (test1-6@dev.local + admin) via the web auth
 *    endpoint so that the httpOnly refresh_token cookie is set
 * 3. Saves storageState (cookies + localStorage) for each user
 *
 * The storageState files are consumed by fixtures/auth.ts to create
 * pre-authenticated browser contexts without re-logging in each test.
 */

import { chromium, type FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const API_BASE = 'http://localhost:8080'
const APP_BASE = 'http://localhost:5173'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORAGE_DIR = path.join(__dirname, 'fixtures', 'storage-states')

const TEST_USERS = [
  { email: 'test1@dev.local', password: 'Test@123456', file: 'tier1.json' },
  { email: 'test2@dev.local', password: 'Test@123456', file: 'tier2.json' },
  { email: 'test3@dev.local', password: 'Test@123456', file: 'tier3.json' },
  { email: 'test4@dev.local', password: 'Test@123456', file: 'tier4.json' },
  { email: 'test5@dev.local', password: 'Test@123456', file: 'tier5.json' },
  { email: 'test6@dev.local', password: 'Test@123456', file: 'tier6.json' },
  { email: 'admin@biblequiz.test', password: 'Test@123456', file: 'admin.json' },
]

async function globalSetup(_config: FullConfig): Promise<void> {
  // Ensure storage-states directory exists
  fs.mkdirSync(STORAGE_DIR, { recursive: true })

  // ── Step 1: Seed test data ───────────────────────────────────────────

  // Login admin first to get bearer token for seed endpoint
  const adminLogin = await fetch(`${API_BASE}/api/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@biblequiz.test',
      password: 'Test@123456',
    }),
  })
  if (!adminLogin.ok) {
    throw new Error(
      `Admin login failed during global-setup: ${adminLogin.status} ${await adminLogin.text()}`,
    )
  }
  const { accessToken: adminToken } = (await adminLogin.json()) as {
    accessToken: string
  }

  const seedRes = await fetch(`${API_BASE}/api/admin/seed/test-data`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!seedRes.ok) {
    console.warn(
      `[global-setup] Seed endpoint returned ${seedRes.status} — test data may already exist`,
    )
  }

  // ── Step 2: Create storageState files ────────────────────────────────

  const browser = await chromium.launch()

  for (const user of TEST_USERS) {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Navigate to app origin so cookies are scoped correctly
    await page.goto(APP_BASE, { waitUntil: 'domcontentloaded' })

    // Login via the web auth endpoint (sets httpOnly refresh_token cookie)
    const loginRes = await page.request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: user.email,
        password: user.password,
        rememberMe: 'true',
      },
    })

    if (!loginRes.ok()) {
      throw new Error(
        `Login failed for ${user.email}: ${loginRes.status()} ${await loginRes.text()}`,
      )
    }

    const loginData = (await loginRes.json()) as {
      accessToken: string
      name: string
      email: string
      avatar?: string
      role?: string
    }

    // Set localStorage entries the app expects (authStore.login reads these on checkAuth)
    await page.evaluate(
      ({ name, email: e, avatar }) => {
        localStorage.setItem('userName', name)
        localStorage.setItem('userEmail', e)
        if (avatar) localStorage.setItem('userAvatar', avatar)
      },
      {
        name: loginData.name,
        email: loginData.email,
        avatar: loginData.avatar ?? '',
      },
    )

    // Save storageState — captures cookies (including httpOnly refresh_token) + localStorage
    const storagePath = path.join(STORAGE_DIR, user.file)
    await context.storageState({ path: storagePath })

    await context.close()
  }

  await browser.close()
}

export default globalSetup
