import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:8080'

test.describe('Security Tests', () => {
  test.describe('TC-AUTH-008: Guest can access public endpoints', () => {
    test('guest can access /api/daily-challenge', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/daily-challenge`)
      expect(response.status()).toBe(200)
    })

    test('guest can access /api/books', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/books`)
      expect(response.status()).toBe(200)

      const body = await response.json()
      expect(Array.isArray(body)).toBeTruthy()
    })

    test('guest can access /api/questions', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/questions?limit=5`)
      expect(response.status()).toBe(200)

      const body = await response.json()
      expect(Array.isArray(body)).toBeTruthy()
    })

    test('guest can access /health', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`)
      expect(response.ok()).toBeTruthy()
    })
  })

  test.describe('TC-AUTH-009: Guest blocked from auth-required endpoints', () => {
    test('guest cannot access /api/me -> 401', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/me`)
      expect(response.status()).toBe(401)
    })

    test('guest cannot POST /api/ranked/sessions -> 401', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/ranked/sessions`)
      expect(response.status()).toBe(401)
    })

    test('guest cannot access /api/me/ranked-status -> 401', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/me/ranked-status`)
      expect(response.status()).toBe(401)
    })

    test('guest cannot access /api/me/tier -> 401', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/me/tier`)
      expect(response.status()).toBe(401)
    })

    test('guest cannot POST /api/groups -> 401', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/groups`, {
        data: { name: 'Test Group' },
      })
      expect(response.status()).toBe(401)
    })

    test('guest cannot POST /api/groups/join -> 401', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/groups/join`, {
        data: { code: 'ABC123' },
      })
      expect(response.status()).toBe(401)
    })
  })

  test.describe('TC-SEC-004: SQL injection prevention', () => {
    test('SQL injection in questions query should be safe', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/api/questions?q=' OR '1'='1`
      )
      // Should not return 500 or expose SQL errors
      expect([200, 400]).toContain(response.status())
      const body = await response.text()
      expect(body.toLowerCase()).not.toContain('sql')
      expect(body.toLowerCase()).not.toContain('syntax error')
      expect(body.toLowerCase()).not.toContain('jdbc')
    })

    test('SQL injection in book parameter should be safe', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/api/questions?book=Genesis'; DROP TABLE questions;--`
      )
      expect([200, 400]).toContain(response.status())
      const body = await response.text()
      expect(body.toLowerCase()).not.toContain('sql')
      expect(body.toLowerCase()).not.toContain('syntax error')
    })

    test('SQL injection in limit parameter should be safe', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/api/questions?limit=1 OR 1=1`
      )
      // Should handle gracefully - 200 with default or 400
      expect(response.status()).toBeLessThan(500)
    })
  })

  test.describe('TC-SEC-002: XSS prevention', () => {
    test('XSS in query parameter should be sanitized', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/api/questions?q=<script>alert('xss')</script>`
      )
      if (response.status() === 200) {
        const body = await response.text()
        expect(body).not.toContain('<script>')
      }
    })
  })

  test.describe('TC-SEC-008: Error responses do not leak stack traces', () => {
    test('invalid session ID should not expose stack trace', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/api/sessions/nonexistent-id-12345`
      )
      if (response.status() >= 400) {
        const body = await response.text()
        expect(body).not.toContain('at com.')
        expect(body).not.toContain('at java.')
        expect(body).not.toContain('at org.springframework')
        expect(body).not.toContain('NullPointerException')
        expect(body).not.toContain('.java:')
      }
    })

    test('invalid endpoint should not expose internal paths', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/api/nonexistent-endpoint`
      )
      if (response.status() >= 400) {
        const body = await response.text()
        expect(body).not.toContain('at com.biblequiz')
        expect(body).not.toContain('StackTrace')
        expect(body).not.toContain('.java:')
      }
    })

    test('malformed JSON body should not expose internals', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth/login`, {
        headers: { 'Content-Type': 'application/json' },
        data: '{"invalid json',
      })
      if (response.status() >= 400) {
        const body = await response.text()
        expect(body).not.toContain('at com.')
        expect(body).not.toContain('Jackson')
        expect(body).not.toContain('.java:')
      }
    })
  })

  test.describe('Security Headers', () => {
    test('should include security headers in response', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/books`)

      const headers = response.headers()
      // X-Content-Type-Options
      expect(headers['x-content-type-options']).toBe('nosniff')
      // X-Frame-Options
      expect(headers['x-frame-options']).toBe('DENY')
    })
  })
})
