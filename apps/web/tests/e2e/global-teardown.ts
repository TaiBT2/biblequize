/**
 * Playwright global teardown — runs once after all tests.
 *
 * Deletes seeded test data via DELETE /api/admin/seed/test-data.
 */

const API_BASE = 'http://localhost:8080'

async function globalTeardown(): Promise<void> {
  // Login admin to get bearer token
  const loginRes = await fetch(`${API_BASE}/api/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@biblequiz.test',
      password: 'Test@123456',
    }),
  })

  if (!loginRes.ok) {
    console.warn(
      `[global-teardown] Admin login failed: ${loginRes.status} — skipping cleanup`,
    )
    return
  }

  const { accessToken } = (await loginRes.json()) as { accessToken: string }

  const deleteRes = await fetch(`${API_BASE}/api/admin/seed/test-data`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!deleteRes.ok) {
    console.warn(
      `[global-teardown] Seed cleanup returned ${deleteRes.status}`,
    )
  }
}

export default globalTeardown
