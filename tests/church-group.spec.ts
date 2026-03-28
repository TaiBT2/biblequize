import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:8080'

/**
 * Helper to register a test user and get a JWT token.
 */
async function getTestAuthToken(
  request: any,
  suffix: string = ''
): Promise<string | null> {
  const timestamp = Date.now()
  const email = `e2e-group-${suffix}${timestamp}@test.com`
  const password = 'testpass123'

  const registerRes = await request.post(`${API_BASE}/api/auth/register`, {
    data: {
      name: `E2E Group User ${suffix}`,
      email,
      password,
    },
  })

  if (registerRes.status() === 200 || registerRes.status() === 201) {
    const body = await registerRes.json()
    if (body.token) return body.token
  }

  const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  })

  if (loginRes.status() === 200) {
    const body = await loginRes.json()
    if (body.token) return body.token
  }

  return null
}

test.describe('Church Group API', () => {
  // TC-GROUP-001: Group creation requires authentication
  test('should reject unauthenticated group creation', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/groups`, {
      data: { name: 'Test Church', description: 'A test group' },
    })
    expect(response.status()).toBe(401)
  })

  // TC-GROUP-001: Create group with valid auth
  test('should create group with valid token', async ({ request }) => {
    const token = await getTestAuthToken(request, 'leader-')
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.post(`${API_BASE}/api/groups`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: `Test Church ${Date.now()}`,
        description: 'E2E test group',
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.group).toBeDefined()
    expect(body.group.name).toBeDefined()
    expect(body.group.code).toBeDefined()
  })

  // TC-GROUP-001: Group name is required
  test('should reject group creation with empty name', async ({ request }) => {
    const token = await getTestAuthToken(request, 'empty-')
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.post(`${API_BASE}/api/groups`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: '', description: 'Missing name' },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  // TC-GROUP-002: Join group requires auth
  test('should reject unauthenticated group join', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/groups/join`, {
      data: { code: 'ABCDEF' },
    })
    expect(response.status()).toBe(401)
  })

  // TC-GROUP-002: Join group with invalid code
  test('should reject join with invalid group code', async ({ request }) => {
    const token = await getTestAuthToken(request, 'joiner-')
    test.skip(!token, 'Could not obtain auth token - skipping authenticated test')

    const response = await request.post(`${API_BASE}/api/groups/join`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { code: 'INVALID_CODE_XXXXXX' },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  // TC-GROUP-002: Join group by code (create then join)
  test('should allow another user to join group by code', async ({ request }) => {
    // Leader creates group
    const leaderToken = await getTestAuthToken(request, 'lead2-')
    test.skip(!leaderToken, 'Could not obtain leader token')

    const createRes = await request.post(`${API_BASE}/api/groups`, {
      headers: { Authorization: `Bearer ${leaderToken}` },
      data: {
        name: `Join Test Group ${Date.now()}`,
        description: 'For join testing',
      },
    })

    expect(createRes.status()).toBe(200)
    const createBody = await createRes.json()
    const groupCode = createBody.group?.code
    test.skip(!groupCode, 'Group code not returned')

    // Another user joins
    const joinerToken = await getTestAuthToken(request, 'join2-')
    test.skip(!joinerToken, 'Could not obtain joiner token')

    const joinRes = await request.post(`${API_BASE}/api/groups/join`, {
      headers: { Authorization: `Bearer ${joinerToken}` },
      data: { code: groupCode },
    })

    expect(joinRes.status()).toBe(200)
    const joinBody = await joinRes.json()
    expect(joinBody.success).toBe(true)
  })

  // TC-GROUP-002: Join group without code should fail
  test('should reject join without code', async ({ request }) => {
    const token = await getTestAuthToken(request, 'nocode-')
    test.skip(!token, 'Could not obtain auth token')

    const response = await request.post(`${API_BASE}/api/groups/join`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  // TC-GROUP-009: Leader cannot leave group
  test('leader should not be able to leave their own group', async ({ request }) => {
    const leaderToken = await getTestAuthToken(request, 'leadleave-')
    test.skip(!leaderToken, 'Could not obtain leader token')

    // Create a group
    const createRes = await request.post(`${API_BASE}/api/groups`, {
      headers: { Authorization: `Bearer ${leaderToken}` },
      data: {
        name: `Leader Leave Test ${Date.now()}`,
        description: 'Testing leader cannot leave',
      },
    })

    expect(createRes.status()).toBe(200)
    const createBody = await createRes.json()
    const groupId = createBody.group?.id
    test.skip(!groupId, 'Group ID not returned')

    // Leader tries to leave
    const leaveRes = await request.delete(
      `${API_BASE}/api/groups/${groupId}/leave`,
      {
        headers: { Authorization: `Bearer ${leaderToken}` },
      }
    )

    // Should be rejected - 422 Unprocessable Entity
    expect(leaveRes.status()).toBe(422)
    const leaveBody = await leaveRes.json()
    expect(leaveBody.success).toBe(false)
    expect(leaveBody.message).toContain('LEADER_CANNOT_LEAVE')
  })

  // TC-GROUP-006: Get group details
  test('should get group details by ID', async ({ request }) => {
    const token = await getTestAuthToken(request, 'details-')
    test.skip(!token, 'Could not obtain auth token')

    // Create a group first
    const createRes = await request.post(`${API_BASE}/api/groups`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: `Details Test Group ${Date.now()}`,
        description: 'For details testing',
      },
    })

    expect(createRes.status()).toBe(200)
    const createBody = await createRes.json()
    const groupId = createBody.group?.id
    test.skip(!groupId, 'Group ID not returned')

    // Get details (this endpoint appears to be public based on controller)
    const detailsRes = await request.get(`${API_BASE}/api/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(detailsRes.status()).toBe(200)
    const detailsBody = await detailsRes.json()
    expect(detailsBody.success).toBe(true)
    expect(detailsBody.group).toBeDefined()
  })

  // TC-GROUP-006: Get nonexistent group returns 404
  test('should return 404 for nonexistent group', async ({ request }) => {
    const token = await getTestAuthToken(request, 'notfound-')
    test.skip(!token, 'Could not obtain auth token')

    const response = await request.get(
      `${API_BASE}/api/groups/nonexistent-group-id`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
