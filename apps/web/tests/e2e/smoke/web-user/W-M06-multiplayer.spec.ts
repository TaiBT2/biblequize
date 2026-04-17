/**
 * W-M06 — Multiplayer Lobby (L1 Smoke)
 *
 * Routes: /multiplayer, /room/create, /room/join, /room/:id/lobby
 * Spec ref: SPEC_USER §6
 * Note: Gameplay (/room/:id/quiz) — [DEFERRED - WEBSOCKET PHASE]
 */

import { test, expect } from '../../fixtures/auth'

test.describe('W-M06 Multiplayer Lobby — L1 Smoke @smoke @multiplayer', () => {

  test('W-M06-L1-001: Rooms list page render dung @smoke @multiplayer', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/multiplayer')
    await page.waitForSelector('[data-testid="multiplayer-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/multiplayer')
    // TODO [NEEDS TESTID: multiplayer-page] — wrapper trang Multiplayer
    await expect(page.getByTestId('multiplayer-page')).toBeVisible()
    // TODO [NEEDS TESTID: multiplayer-create-btn] — nut "Tao Phong"
    await expect(page.getByTestId('multiplayer-create-btn')).toBeVisible()
    // TODO [NEEDS TESTID: multiplayer-join-btn] — nut "Tham Gia Phong"
    await expect(page.getByTestId('multiplayer-join-btn')).toBeVisible()
  })

  test('W-M06-L1-002: Navigate to Create Room page @smoke @multiplayer', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/room/create')
    await page.waitForSelector('[data-testid="create-room-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/room/create')
    // TODO [NEEDS TESTID: create-room-page] — wrapper trang CreateRoom
    await expect(page.getByTestId('create-room-page')).toBeVisible()
    // TODO [NEEDS TESTID: create-room-mode-select] — selector loai game
    await expect(page.getByTestId('create-room-mode-select')).toBeVisible()
    // TODO [NEEDS TESTID: create-room-submit-btn] — nut "Tao Phong"
    await expect(page.getByTestId('create-room-submit-btn')).toBeVisible()
    await expect(page.getByTestId('create-room-submit-btn')).toBeEnabled()
  })

  // SKIP: UI component join-room-submit-btn not implemented yet
  test.skip('W-M06-L1-003: Navigate to Join Room page @smoke @multiplayer', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/room/join')
    await page.waitForSelector('[data-testid="join-room-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/room/join')
    // TODO [NEEDS TESTID: join-room-page] — wrapper trang JoinRoom
    await expect(page.getByTestId('join-room-page')).toBeVisible()
    // TODO [NEEDS TESTID: join-room-code-input] — input nhap ma phong
    await expect(page.getByTestId('join-room-code-input')).toBeVisible()
    // TODO [NEEDS TESTID: join-room-submit-btn] — nut "Tham Gia"
    await expect(page.getByTestId('join-room-submit-btn')).toBeVisible()
  })

  // SKIP: UI component join-room-submit-btn not implemented yet
  test.skip('W-M06-L1-004: Join room form submit empty code validation error @smoke @multiplayer', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/room/join')
    await page.waitForSelector('[data-testid="join-room-submit-btn"]')
    await page.getByTestId('join-room-submit-btn').click()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/room/join')
    // TODO [NEEDS TESTID: join-room-error] — error message khi code rong
    await expect(page.getByTestId('join-room-error')).toBeVisible()
  })

  test('W-M06-L1-005: Room Lobby room code hien thi va co the copy @smoke @multiplayer @critical', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — create room via API
    // ============================================================
    // [NOT IMPLEMENTED: need API setup to create room and get roomId]
    test.skip()

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    // await page.goto(`/room/${roomId}/lobby`)
    // await page.waitForSelector('[data-testid="lobby-room-code"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    // TODO [NEEDS TESTID: lobby-room-code] — hien thi ma phong (6 ky tu)
    // await expect(page.getByTestId('lobby-room-code')).toBeVisible()
    // await expect(page.getByTestId('lobby-room-code')).toHaveText(/[A-Z0-9]{6}/)
    // TODO [NEEDS TESTID: lobby-leave-btn] — nut "Roi Phong"
    // await expect(page.getByTestId('lobby-leave-btn')).toBeVisible()
    // TODO [NEEDS TESTID: lobby-player-grid] — grid hien thi players
    // await expect(page.getByTestId('lobby-player-grid')).toBeVisible()
  })

  test('W-M06-L1-006: Room Lobby nut San Sang visible cho non-host @smoke @multiplayer', async ({
    tier1Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — need admin to create room, join as non-host
    // ============================================================
    // [NOT IMPLEMENTED: need multi-user room setup via API]
    test.skip()

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier1Page
    // await page.goto(`/room/${roomId}/lobby`)
    // await page.waitForSelector('[data-testid="lobby-ready-btn"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    // TODO [NEEDS TESTID: lobby-ready-btn] — nut "San Sang" (non-host)
    // await expect(page.getByTestId('lobby-ready-btn')).toBeVisible()
    // TODO [NEEDS TESTID: lobby-start-btn] — nut "Bat Dau" (host only)
    // await expect(page.getByTestId('lobby-start-btn')).not.toBeVisible()
  })

})
