/**
 * W-M06 — Multiplayer Lobby (L2 Happy Path)
 *
 * Routes: /rooms, /multiplayer, /room/create, /room/join, /room/:id/lobby
 * Spec ref: SPEC_USER §5.4
 * Note: Gameplay (round flow, elimination) deferred to Phase 5 WebSocket.
 */

import { test, expect } from '../../fixtures/auth'
import { LoginPage } from '../../pages/LoginPage'

const BASE_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'
const TEST3_EMAIL = 'test3@dev.local'
const TEST4_EMAIL = 'test4@dev.local'
const TEST5_EMAIL = 'test5@dev.local'
const PASSWORD = 'Test@123456'

// ── Helpers ─────────────────────────────────────────────────────────

async function loginAndGetToken(email: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  const data = await res.json()
  return data.accessToken
}

// POST /api/rooms responds with { success, room, viewerUserId } — the helper
// returns the inner `room` object (fields: id, roomCode, roomName, mode,
// maxPlayers, status, hostId, players).
async function createRoomRaw(
  token: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
}

async function createRoom(
  token: string,
  body: Record<string, unknown> = { roomName: 'E2E Test Room', mode: 'SPEED_RACE', maxPlayers: 4 },
): Promise<any> {
  return (await (await createRoomRaw(token, body)).json()).room
}

async function joinRoom(token: string, roomCode: string): Promise<Response> {
  return fetch(`${BASE_URL}/api/rooms/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ roomCode }),
  })
}

// GET /api/rooms/{id} responds with { success, viewerUserId, room }.
async function getRoom(token: string, roomId: string): Promise<Response> {
  return fetch(`${BASE_URL}/api/rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// Best-effort cleanup: there is no delete-room endpoint, so the host leaves
// instead. Stale LOBBY rooms are reaped by the abandonment scheduler.
async function leaveRoom(token: string, roomId: string): Promise<Response> {
  return fetch(`${BASE_URL}/api/rooms/${roomId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ── Tests ───────────────────────────────────────────────────────────

test.describe('W-M06 Multiplayer Lobby — L2 Happy Path @happy-path @multiplayer', () => {

  // Rooms touched during a test, drained in afterEach. Registering cleanup
  // *as soon as* a room is created/joined (not at the end of the test) means
  // a mid-test assertion failure can't strand the shared test accounts in a
  // lobby — which would cascade ALREADY_IN_ANOTHER_ROOM into later tests.
  const createdRooms: Array<{ roomId: string; tokens: string[] }> = []

  function trackRoom(roomId: string, ...tokens: string[]): string[] {
    const entry = { roomId, tokens: [...tokens] }
    createdRooms.push(entry)
    return entry.tokens
  }

  test.afterEach(async () => {
    for (const { roomId, tokens } of createdRooms.splice(0)) {
      for (const token of tokens) {
        try {
          await leaveRoom(token, roomId)
        } catch {
          /* room already deleted — fine */
        }
      }
    }
  })

  test('W-M06-L2-001: Create room POST /api/rooms returns room with join code @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const room = await createRoom(token)
    trackRoom(room.id, token)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A (API-only test)
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(room.id).toBeTruthy()
    expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/)
    expect(room).toMatchObject({
      roomName: 'E2E Test Room',
      mode: 'SPEED_RACE',
      maxPlayers: 4,
      status: 'LOBBY',
    })
    expect(room).toHaveProperty('hostId')
    // players is an array (host is NOT a RoomPlayer in Quản trò mode default).
    expect(Array.isArray(room.players)).toBe(true)
  })

  test('W-M06-L2-002: UI create room flow — fill form, submit, redirect to lobby @write @serial', async ({
    page,
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginWithCredentials(TEST3_EMAIL, PASSWORD)
    await page.waitForURL('/')

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    await page.goto('/room/create')
    await page.waitForSelector('[data-testid="create-room-page"]')

    // Fill room name
    const nameInput = page.getByTestId('create-room-name-input')
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E UI Room')
    }

    // Select mode — create-room-mode-select is a div grid of buttons, not <select>
    const modeSelect = page.getByTestId('create-room-mode-select')
    if (await modeSelect.isVisible()) {
      await modeSelect.locator('button').filter({ hasText: /speed|race|tốc/i }).first().click().catch(() => {})
    }

    // Submit
    await page.getByTestId('create-room-submit-btn').click()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await page.waitForURL(/\/room\/[a-z0-9-]+\/lobby/)
    await expect(page).toHaveURL(/\/room\/[a-z0-9-]+\/lobby/)

    // Room code visible on lobby
    const roomCode = page.getByTestId('lobby-room-code')
    await expect(roomCode).toBeVisible()
    await expect(roomCode).toHaveText(/[A-Z0-9]{6}/)

    // Host visible in player list
    const playerGrid = page.getByTestId('lobby-player-grid')
    await expect(playerGrid).toBeVisible()

    // ============================================================
    // SECTION 4: API VERIFICATION — room exists server-side
    // ============================================================
    // Extract roomId from URL
    const url = page.url()
    const roomId = url.match(/\/room\/([a-z0-9-]+)\/lobby/)?.[1]
    expect(roomId).toBeTruthy()
    if (roomId) trackRoom(roomId, await loginAndGetToken(TEST3_EMAIL))
  })

  test('W-M06-L2-003: Join room by code — POST /api/rooms/join @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — test3 creates room
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const room = await createRoom(token3)
    const cleanupTokens = trackRoom(room.id, token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS — test4 joins
    // ============================================================
    const joinRes = await joinRoom(token4, room.roomCode)
    cleanupTokens.push(token4)
    expect(joinRes.ok).toBe(true)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    const roomRes = await getRoom(token3, room.id)
    const roomData = (await roomRes.json()).room
    expect(roomData.players?.length).toBe(1)
  })

  test('W-M06-L2-004: Join invalid code is rejected @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const res = await joinRoom(token, 'XXXXXX')

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION — joinRoom rejects unknown code with 400
    // ============================================================
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('W-M06-L2-005: Join full room is rejected @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — create room maxPlayers=2, fill it with 2 players
    //   (Quản trò mode: host is not a player, so 2 joiners fill maxPlayers=2)
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const room = await createRoom(token3, {
      roomName: 'E2E Full Room',
      mode: 'SPEED_RACE',
      maxPlayers: 2,
    })
    const cleanupTokens = trackRoom(room.id, token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const token5 = await loginAndGetToken(TEST5_EMAIL)
    const j4 = await joinRoom(token4, room.roomCode)
    cleanupTokens.push(token4)
    const j5 = await joinRoom(token5, room.roomCode)
    cleanupTokens.push(token5)
    expect(j4.ok).toBe(true)
    expect(j5.ok).toBe(true)

    // ============================================================
    // SECTION 2: ACTIONS — a 3rd player tries to join the full room
    // ============================================================
    const token6 = await loginAndGetToken('test6@dev.local')
    const res = await joinRoom(token6, room.roomCode)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION — full room rejected with 400
    // ============================================================
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('đầy')
  })

  test('W-M06-L2-006: Public room list GET /api/rooms/public returns rooms @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — create one public room so the list is non-empty
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)
    const room = await createRoom(token, {
      roomName: 'E2E Public Room',
      mode: 'SPEED_RACE',
      maxPlayers: 4,
      isPublic: true,
    })
    trackRoom(room.id, token)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const res = await fetch(`${BASE_URL}/api/rooms/public`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.ok).toBe(true)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.rooms)).toBe(true)
    const listed = body.rooms.find((r: any) => r.id === room.id)
    expect(listed).toBeTruthy()
    expect(listed).toHaveProperty('maxPlayers')
  })

  test('W-M06-L2-007: Host (legacy mode) leaving lobby drops their player row @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — legacy-mode room (hostPlaysGame: true) so the host
    //   is a real RoomPlayer; test4 joins → 2 players
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const room = await createRoom(token3, {
      roomName: 'E2E Host Leave Room',
      mode: 'SPEED_RACE',
      maxPlayers: 4,
      hostPlaysGame: true,
    })
    const cleanupTokens = trackRoom(room.id, token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const joined = await joinRoom(token4, room.roomCode)
    cleanupTokens.push(token4)
    expect(joined.ok).toBe(true)

    // ============================================================
    // SECTION 2: ACTIONS — host leaves the lobby
    // ============================================================
    const leaveRes = await leaveRoom(token3, room.id)
    expect(leaveRes.ok).toBe(true)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION — room survives with the remaining
    //   player; the host's RoomPlayer row is gone.
    // ============================================================
    const roomRes = await getRoom(token4, room.id)
    expect(roomRes.ok).toBe(true)
    const roomData = (await roomRes.json()).room
    // room.hostId is test3's user id (the creator of a hostPlaysGame room).
    expect(roomData.players.some((p: any) => p.userId === room.hostId)).toBe(false)
  })

  test('W-M06-L2-008: Gameplay flow deferred to Phase 5 WebSocket @deferred', async () => {
    test.skip(true, 'DEFERRED: Multiplayer gameplay requires Phase 5 WebSocket')
  })

  // ── Survival mode (BATTLE_ROYALE / "Sinh tồn") — SPEC_MULTIPLAYER §3.2 ──

  test('W-M06-L2-009: Create survival room (BATTLE_ROYALE) — mode persisted @write @serial @survival', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const room = await createRoom(token, {
      roomName: 'E2E Survival Room',
      mode: 'BATTLE_ROYALE',
      maxPlayers: 8,
    })
    trackRoom(room.id, token)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A (API-only test)
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/)
    expect(room).toMatchObject({
      mode: 'BATTLE_ROYALE',
      maxPlayers: 8,
      status: 'LOBBY',
    })
  })

  test('W-M06-L2-010: UI create survival room — select "Sinh tồn" card, redirect to lobby @write @serial @survival', async ({
    page,
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginWithCredentials(TEST3_EMAIL, PASSWORD)
    await page.waitForURL('/')

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    await page.goto('/room/create')
    await page.waitForSelector('[data-testid="create-room-page"]')

    const nameInput = page.getByTestId('create-room-name-input')
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Survival UI Room')
    }

    // Select survival mode — label is "Sinh tồn" (vi) / "Battle Royale" (en)
    const modeSelect = page.getByTestId('create-room-mode-select')
    await modeSelect
      .locator('button')
      .filter({ hasText: /sinh tồn|battle\s*royale/i })
      .first()
      .click()

    await page.getByTestId('create-room-submit-btn').click()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await page.waitForURL(/\/room\/[a-z0-9-]+\/lobby/)
    await expect(page.getByTestId('lobby-room-code')).toHaveText(/[A-Z0-9]{6}/)
    await expect(page.getByTestId('lobby-player-grid')).toBeVisible()

    // ============================================================
    // SECTION 4: API VERIFICATION — room created with survival mode
    // ============================================================
    const roomId = page.url().match(/\/room\/([a-z0-9-]+)\/lobby/)?.[1]
    expect(roomId).toBeTruthy()
    const token = await loginAndGetToken(TEST3_EMAIL)
    if (roomId) trackRoom(roomId, token)
    const roomRes = await getRoom(token, roomId!)
    const roomData = (await roomRes.json()).room
    expect(roomData.mode).toBe('BATTLE_ROYALE')
  })

  test('W-M06-L2-011: Join survival room — 3 players (BR minimum) @write @serial @survival', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — test3 creates a BATTLE_ROYALE room
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const room = await createRoom(token3, {
      roomName: 'E2E Survival Join Room',
      mode: 'BATTLE_ROYALE',
      maxPlayers: 8,
    })
    const cleanupTokens = trackRoom(room.id, token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const token5 = await loginAndGetToken(TEST5_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS — test4 + test5 join (Quản trò mode: host is not
    //   a player, so 2 joiners is the BR-viable non-host count)
    // ============================================================
    const join4 = await joinRoom(token4, room.roomCode)
    cleanupTokens.push(token4)
    const join5 = await joinRoom(token5, room.roomCode)
    cleanupTokens.push(token5)
    expect(join4.ok).toBe(true)
    expect(join5.ok).toBe(true)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION — 2 players joined, mode still BATTLE_ROYALE
    // ============================================================
    const roomRes = await getRoom(token3, room.id)
    const roomData = (await roomRes.json()).room
    expect(roomData.mode).toBe('BATTLE_ROYALE')
    expect(roomData.players?.length).toBe(2)
  })

  test('W-M06-L2-012: Survival elimination gameplay deferred to Phase 5 WebSocket @deferred @survival', async () => {
    // SPEC_MULTIPLAYER §3.2 — PLAYER_ELIMINATED / BATTLE_ROYALE_UPDATE events,
    // amnesty round (all-wrong), finalRank leaderboard. Requires STOMP gameplay.
    test.skip(true, 'DEFERRED: Battle Royale elimination flow requires Phase 5 WebSocket')
  })

  // ── Create-room coverage: remaining modes + roomName validation + bounds ──

  test('W-M06-L2-014: Create Team vs Team room — mode persisted @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const room = await createRoom(token, {
      roomName: 'E2E Team Room',
      mode: 'TEAM_VS_TEAM',
      maxPlayers: 8,
    })
    trackRoom(room.id, token)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A (API-only test)
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/)
    expect(room).toMatchObject({ mode: 'TEAM_VS_TEAM', maxPlayers: 8, status: 'LOBBY' })
  })

  test('W-M06-L2-015: Create Sudden Death room — mode persisted @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const room = await createRoom(token, {
      roomName: 'E2E Sudden Death Room',
      mode: 'SUDDEN_DEATH',
      maxPlayers: 6,
    })
    trackRoom(room.id, token)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A (API-only test)
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/)
    expect(room).toMatchObject({ mode: 'SUDDEN_DEATH', maxPlayers: 6, status: 'LOBBY' })
  })

  test('W-M06-L2-016: Create room rejects roomName shorter than 5 chars @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const res = await createRoomRaw(token, { roomName: 'abc', mode: 'SPEED_RACE' })

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toContain('5 ký tự')
  })

  test('W-M06-L2-017: Create room rejects roomName longer than 60 chars @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const res = await createRoomRaw(token, { roomName: 'A'.repeat(61), mode: 'SPEED_RACE' })

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toContain('60 ký tự')
  })

  test('W-M06-L2-018: Create room rejects roomName of a single repeated char @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS — "aaaaaa" passes the length gate but is invalid
    // ============================================================
    const res = await createRoomRaw(token, { roomName: 'aaaaaa', mode: 'SPEED_RACE' })

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toContain('không hợp lệ')
  })

  test('W-M06-L2-019: Create room with blank roomName falls back to a default name @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS — omit roomName entirely
    // ============================================================
    const room = await createRoom(token, { mode: 'SPEED_RACE', maxPlayers: 4 })
    trackRoom(room.id, token)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION — server-generated "Phòng của {name}"
    // ============================================================
    expect(room.roomName).toMatch(/^Phòng của /)
  })

  test('W-M06-L2-020: Create room accepts maxPlayers at both bounds (2 and 100) @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS — lower bound + the raised 100-player cap
    // ============================================================
    const small = await createRoom(token, {
      roomName: 'E2E Min Players Room',
      mode: 'SPEED_RACE',
      maxPlayers: 2,
    })
    trackRoom(small.id, token)
    const large = await createRoom(token, {
      roomName: 'E2E Max Players Room',
      mode: 'BATTLE_ROYALE',
      maxPlayers: 100,
    })
    trackRoom(large.id, token)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(small.maxPlayers).toBe(2)
    expect(large.maxPlayers).toBe(100)
  })

})
