import { test, expect } from '@playwright/test'

test.describe('Ranked Mode API', () => {
  let accessToken: string
  const timestamp = Date.now()
  const email = `e2eranked+${timestamp}@example.com`

  test.beforeAll(async ({ request }) => {
    const registerRes = await request.post('http://localhost:8080/api/auth/register', {
      data: { name: 'Ranked Tester', email, password: 'testpass123' },
    })

    if (registerRes.ok()) {
      accessToken = (await registerRes.json()).accessToken
    } else {
      const loginRes = await request.post('http://localhost:8080/api/auth/login', {
        data: { email, password: 'testpass123' },
      })
      accessToken = (await loginRes.json()).accessToken
    }
  })

  test('should start a ranked session', async ({ request }) => {
    const res = await request.post('http://localhost:8080/api/ranked/sessions', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('sessionId')
    expect(data).toHaveProperty('currentBook')
    expect(data).toHaveProperty('bookProgress')
  })

  test('should get ranked status', async ({ request }) => {
    const res = await request.get('http://localhost:8080/api/me/ranked-status', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('livesRemaining')
    expect(data).toHaveProperty('questionsCounted')
    expect(data).toHaveProperty('pointsToday')
    expect(data).toHaveProperty('currentBook')
    expect(data.livesRemaining).toBeGreaterThanOrEqual(0)
    expect(data.livesRemaining).toBeLessThanOrEqual(30)
  })

  test('should get tier info', async ({ request }) => {
    const res = await request.get('http://localhost:8080/api/me/tier', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('totalPoints')
    expect(data).toHaveProperty('tier')
    expect(data).toHaveProperty('tierName')
  })

  test('should sync progress', async ({ request }) => {
    const res = await request.post('http://localhost:8080/api/ranked/sync-progress', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('success', true)
  })

  test('should get daily leaderboard', async ({ request }) => {
    const res = await request.get('http://localhost:8080/api/leaderboard/daily', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('should get weekly leaderboard', async ({ request }) => {
    const res = await request.get('http://localhost:8080/api/leaderboard/weekly', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(res.ok()).toBeTruthy()
  })

  test('should get all-time leaderboard', async ({ request }) => {
    const res = await request.get('http://localhost:8080/api/leaderboard/all-time', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(res.ok()).toBeTruthy()
  })

  test('should get my daily rank', async ({ request }) => {
    const res = await request.get('http://localhost:8080/api/leaderboard/daily/my-rank', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(res.ok()).toBeTruthy()
  })
})
