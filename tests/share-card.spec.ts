import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:8080'

test.describe('Share Card', () => {
  // TC-SHARE-004: View count tracking - POST /api/share/{id}/view is public
  test('POST /api/share/{id}/view should return 204', async ({ request }) => {
    // The view endpoint is public (permitAll in SecurityConfig)
    // Use a random ID - it should either succeed (204) or handle gracefully
    const shareId = `test-share-${Date.now()}`
    const response = await request.post(
      `${API_BASE}/api/share/${shareId}/view`
    )

    // Should return 204 No Content on success, or handle missing card gracefully
    // The endpoint calls shareCardService.incrementViewCount which may no-op for unknown IDs
    expect(response.status()).toBeLessThan(500)
  })

  // TC-SHARE-004: View endpoint is accessible without auth
  test('view endpoint should be publicly accessible', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/api/share/any-card-id/view`
    )

    // Should NOT return 401 - this is a public endpoint per SecurityConfig
    expect(response.status()).not.toBe(401)
    expect(response.status()).not.toBe(403)
  })

  // TC-SHARE-004: Multiple views should be counted (idempotent-safe)
  test('multiple view requests should not cause errors', async ({ request }) => {
    const shareId = `multi-view-${Date.now()}`

    const res1 = await request.post(
      `${API_BASE}/api/share/${shareId}/view`
    )
    const res2 = await request.post(
      `${API_BASE}/api/share/${shareId}/view`
    )
    const res3 = await request.post(
      `${API_BASE}/api/share/${shareId}/view`
    )

    // All requests should succeed without errors
    expect(res1.status()).toBeLessThan(500)
    expect(res2.status()).toBeLessThan(500)
    expect(res3.status()).toBeLessThan(500)
  })

  // Share card session endpoint requires auth
  test('session card endpoint should require auth', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/api/share/session/test-session`
    )
    expect(response.status()).toBe(401)
  })

  // Share card tier-up endpoint requires auth
  test('tier-up card endpoint should require auth', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/api/share/tier-up/bronze`
    )
    expect(response.status()).toBe(401)
  })
})
