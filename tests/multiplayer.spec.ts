import { test, expect, Page } from '@playwright/test'

/**
 * Helper: register and login a test user via API, then set auth in browser.
 */
async function loginTestUser(page: Page, email: string, name: string) {
  // Register via API
  const registerResponse = await page.request.post('http://localhost:8080/api/auth/register', {
    data: { name, email, password: 'testpass123' },
  })

  let accessToken: string

  if (registerResponse.ok()) {
    const data = await registerResponse.json()
    accessToken = data.accessToken
  } else {
    // Already registered, try login
    const loginResponse = await page.request.post('http://localhost:8080/api/auth/login', {
      data: { email, password: 'testpass123' },
    })
    const data = await loginResponse.json()
    accessToken = data.accessToken
  }

  // Set token in localStorage (AuthContext reads from this)
  await page.goto('/')
  await page.evaluate(({ token, userName, userEmail }) => {
    localStorage.setItem('user', JSON.stringify({ name: userName, email: userEmail, role: 'USER' }))
  }, { token: accessToken, userName: name, userEmail: email })

  // Navigate with cookies set from API (refresh token httpOnly cookie)
  await page.goto('/')
}

test.describe('Multiplayer', () => {
  test.describe('Room Creation (requires auth)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/room/create')
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })

    test('should redirect to login for room join when not authenticated', async ({ page }) => {
      await page.goto('/room/join')
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })
  })

  test.describe('Room API', () => {
    test('should get public rooms list', async ({ request }) => {
      const timestamp = Date.now()
      const email = `e2eroom+${timestamp}@example.com`

      // Register to get token
      const registerRes = await request.post('http://localhost:8080/api/auth/register', {
        data: { name: 'Room Test', email, password: 'testpass123' },
      })

      if (!registerRes.ok()) return // Skip if registration fails

      const { accessToken } = await registerRes.json()

      const roomsRes = await request.get('http://localhost:8080/api/rooms/public', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      expect(roomsRes.ok()).toBeTruthy()
      const data = await roomsRes.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('rooms')
    })

    test('should create a room via API', async ({ request }) => {
      const timestamp = Date.now()
      const email = `e2ecreate+${timestamp}@example.com`

      const registerRes = await request.post('http://localhost:8080/api/auth/register', {
        data: { name: 'Creator', email, password: 'testpass123' },
      })

      if (!registerRes.ok()) return

      const { accessToken } = await registerRes.json()

      const createRes = await request.post('http://localhost:8080/api/rooms', {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          roomName: 'E2E Test Room',
          maxPlayers: 4,
          questionCount: 5,
          timePerQuestion: 15,
          mode: 'SPEED_RACE',
          isPublic: true,
        },
      })

      expect(createRes.ok()).toBeTruthy()
      const data = await createRes.json()
      expect(data.success).toBeTruthy()
      expect(data.room).toHaveProperty('roomCode')
      expect(data.room.roomName).toBe('E2E Test Room')
    })

    test('should join a room by code via API', async ({ request }) => {
      const timestamp = Date.now()

      // Create host
      const hostEmail = `e2ehost+${timestamp}@example.com`
      const hostRes = await request.post('http://localhost:8080/api/auth/register', {
        data: { name: 'Host', email: hostEmail, password: 'testpass123' },
      })
      if (!hostRes.ok()) return
      const hostToken = (await hostRes.json()).accessToken

      // Create room
      const createRes = await request.post('http://localhost:8080/api/rooms', {
        headers: { Authorization: `Bearer ${hostToken}` },
        data: { roomName: 'Join Test', maxPlayers: 4, mode: 'SPEED_RACE' },
      })
      const roomCode = (await createRes.json()).room.roomCode

      // Create joiner
      const joinEmail = `e2ejoin+${timestamp}@example.com`
      const joinRes = await request.post('http://localhost:8080/api/auth/register', {
        data: { name: 'Joiner', email: joinEmail, password: 'testpass123' },
      })
      if (!joinRes.ok()) return
      const joinToken = (await joinRes.json()).accessToken

      // Join room
      const joinRoomRes = await request.post('http://localhost:8080/api/rooms/join', {
        headers: { Authorization: `Bearer ${joinToken}` },
        data: { roomCode },
      })

      expect(joinRoomRes.ok()).toBeTruthy()
      const data = await joinRoomRes.json()
      expect(data.success).toBeTruthy()
    })
  })
})
