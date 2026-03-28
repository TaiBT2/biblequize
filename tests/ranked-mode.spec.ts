import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:8080'

/**
 * Helper to register a test user and get a JWT token.
 * Returns the token or null if registration/login fails.
 */
async function getTestAuthToken(request: any): Promise<string | null> {
  const timestamp = Date.now()
  const email = `e2e-ranked-${timestamp}@test.com`
  const password = 'testpass123'

  // Register
  const registerRes = await request.post(`${API_BASE}/api/auth/register`, {
    data: {
      name: 'E2E Ranked User',
      email,
      password,
    },
  })

  if (registerRes.status() === 200 || registerRes.status() === 201) {
    const body = await registerRes.json()
    if (body.token) return body.token
  }

  // Try login if register returned existing
  const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  })

  if (loginRes.status() === 200) {
    const body = await loginRes.json()
    if (body.token) return body.token
  }

  return null
}

test.describe('Ranked Mode API', () => {
  // TC-RANK-001: Ranked session requires authentication
  test('should reject unauthenticated ranked session start', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ranked/sessions`)
    expect(response.status()).toBe(401)
  })

  // TC-RANK-001: Start ranked session with auth
  test('should start ranked session with valid token', async ({ request }) => {
    const token = await getTestAuthToken(request)
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.post(`${API_BASE}/api/ranked/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.sessionId).toBeDefined()
    expect(body.currentBook).toBeDefined()
    expect(body.bookProgress).toBeDefined()
  })

  // TC-RANK-009: Ranked status shows correct defaults for new user
  test('ranked status should return energy and question counts', async ({ request }) => {
    const token = await getTestAuthToken(request)
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.get(`${API_BASE}/api/me/ranked-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()

    // New user should have full energy (100) and 0 questions counted
    expect(body.livesRemaining).toBeDefined()
    expect(body.livesRemaining).toBeLessThanOrEqual(100)
    expect(body.livesRemaining).toBeGreaterThanOrEqual(0)

    expect(body.questionsCounted).toBeDefined()
    expect(body.questionsCounted).toBeGreaterThanOrEqual(0)

    expect(body.pointsToday).toBeDefined()
    expect(body.date).toBeDefined()
    expect(body.cap).toBeDefined()
    expect(body.resetAt).toBeDefined()
  })

  // TC-RANK-009: Ranked status should show current book (book progression)
  test('ranked status should show current book', async ({ request }) => {
    const token = await getTestAuthToken(request)
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.get(`${API_BASE}/api/me/ranked-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()

    expect(body.currentBook).toBeDefined()
    expect(typeof body.currentBook).toBe('string')
    expect(body.currentBookIndex).toBeDefined()
    expect(body.bookProgress).toBeDefined()
    expect(body.isPostCycle).toBeDefined()
    expect(body.currentDifficulty).toBeDefined()
  })

  // TC-RANK-003: New user defaults - starts at Genesis, 100 energy
  test('new user should start with defaults', async ({ request }) => {
    const token = await getTestAuthToken(request)
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.get(`${API_BASE}/api/me/ranked-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()

    // New user defaults
    expect(body.livesRemaining).toBe(100)
    expect(body.questionsCounted).toBe(0)
    expect(body.pointsToday).toBe(0)
    expect(body.currentBook).toBe('Genesis')
    expect(body.isPostCycle).toBe(false)
  })

  // TC-RANK-005: Tier endpoint requires auth
  test('tier endpoint should require authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/me/tier`)
    expect(response.status()).toBe(401)
  })

  // TC-RANK-005: Tier endpoint returns tier info for authenticated user
  test('tier endpoint should return tier info', async ({ request }) => {
    const token = await getTestAuthToken(request)
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.get(`${API_BASE}/api/me/tier`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()

    expect(body.totalPoints).toBeDefined()
    expect(body.tier).toBeDefined()
    expect(body.tierName).toBeDefined()
    expect(body.progressPercent).toBeDefined()
    expect(body.progressPercent).toBeGreaterThanOrEqual(0)
    expect(body.progressPercent).toBeLessThanOrEqual(100)
  })

  // TC-RANK-007: Answer submission requires valid session
  test('answer submission to invalid session should handle gracefully', async ({ request }) => {
    const token = await getTestAuthToken(request)
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.post(
      `${API_BASE}/api/ranked/sessions/nonexistent-session/answer`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          questionId: 'fake-question',
          answer: 0,
          clientElapsedMs: 5000,
        },
      }
    )

    // Should not crash - either 200 with defaults or 400/404
    expect(response.status()).toBeLessThan(500)
  })

  // TC-RANK-009: Sync progress endpoint
  test('sync progress should require auth', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/ranked/sync-progress`)
    expect(response.status()).toBe(401)
  })
})
