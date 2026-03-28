import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:8080'

test.describe('Daily Challenge', () => {
  // TC-DAILY-001: Same 5 questions for all users
  test('should return 5 questions via API', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/daily-challenge`)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.questions).toBeDefined()
    expect(body.questions.length).toBe(5)
    expect(body.date).toBeDefined()
    expect(body.totalQuestions).toBe(5)
  })

  // TC-DAILY-002: Guest can access daily challenge without authentication
  test('should allow guest access without auth', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/daily-challenge`)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.alreadyCompleted).toBe(false)
  })

  // TC-DAILY-001: Same questions for different requests on same day
  test('should return same questions for two requests on same day', async ({ request }) => {
    const res1 = await request.get(`${API_BASE}/api/daily-challenge`)
    const res2 = await request.get(`${API_BASE}/api/daily-challenge`)

    expect(res1.status()).toBe(200)
    expect(res2.status()).toBe(200)

    const body1 = await res1.json()
    const body2 = await res2.json()

    // Same date
    expect(body1.date).toBe(body2.date)

    // Same question IDs in same order
    if (body1.questions?.length > 0 && body2.questions?.length > 0) {
      const ids1 = body1.questions.map((q: { id: string }) => q.id)
      const ids2 = body2.questions.map((q: { id: string }) => q.id)
      expect(ids1).toEqual(ids2)
    }
  })

  // TC-DAILY-001: Questions have expected structure (no answers leaked)
  test('should not expose correct answers in response', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/daily-challenge`)
    expect(response.status()).toBe(200)

    const body = await response.json()
    for (const q of body.questions) {
      expect(q.id).toBeDefined()
      expect(q.content).toBeDefined()
      expect(q.book).toBeDefined()
      expect(q.options).toBeDefined()
      // Correct answer should be stripped from response
      expect(q.correctAnswer).toBeUndefined()
      expect(q.answer).toBeUndefined()
    }
  })

  // TC-DAILY-004: Start daily challenge session
  test('should start a daily challenge session via POST', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/daily-challenge/start`)

    // May require auth or be public - handle both
    if (response.status() === 200) {
      const body = await response.json()
      expect(body.sessionId).toBeDefined()
      expect(body.date).toBeDefined()
      expect(body.totalQuestions).toBeDefined()
    } else {
      // If auth required, expect 401/403
      expect([401, 403]).toContain(response.status())
    }
  })

  // TC-DAILY-002: Result endpoint requires authentication
  test('should require auth to view results', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/daily-challenge/result`)
    expect(response.status()).toBe(401)
  })
})
