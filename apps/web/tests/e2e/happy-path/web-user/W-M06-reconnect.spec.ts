/**
 * W-M06-MPL-2 — Reconnect during 60s grace: LEFT → ACTIVE flow
 *
 * Spec: SPEC_MULTIPLAYER §6.1 + RoomService:120-121, :224-225, :597.
 *
 * Flow validated:
 *   IN_PROGRESS game → player /leave OR STOMP disconnect → status=LEFT →
 *   POST /join again (within grace) → addPlayerToRoom flips back ACTIVE.
 *
 * Strategy: start game via WS (need IN_PROGRESS for /leave→LEFT semantics
 * — RoomService:424 `setPlayerStatus(LEFT)` only fires mid-game), then
 * use REST /leave for deterministic LEFT timing (no flaky WS presence
 * timing), then REST /join for ACTIVE flip.
 *
 * Source: docs/todo/active/2026-05-23-mp-test-lifecycle-reconnect-kick.md (MPL-2)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, joinRoom, startRoom, leaveRoom, getRoom, deleteRoom,
} from '../../helpers/multiplayer-api'
import { MultiplayerSession } from '../../helpers/multiplayer-session'

test.describe('W-M06-MPL-2 Reconnect 60s grace — L3 @happy-path @multiplayer @reconnect @websocket', () => {

  test('W-M06-MPL-2-001: Mid-game /leave → LEFT, then POST /join → ACTIVE (status restored) @write @serial @websocket', async () => {
    test.setTimeout(120_000)

    const [host] = await provisionUsers('e2e-rc-host-', 1)
    const players = await provisionUsers('e2e-rc-player-', 2)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Reconnect',
        mode: 'SPEED_RACE', maxPlayers: 4,
        questionCount: 5, timePerQuestion: 30, // long timer → game stays IN_PROGRESS while we leave+rejoin
        hostPlaysGame: false,
      })
      roomId = room.id

      for (const p of players) await joinRoom(p.token, room.roomCode)
      session = await MultiplayerSession.fromRoom(host, players, room.id)
      session.readyAll()

      await expect
        .poll(async () => {
          const r = await getRoom(host.token, room.id)
          return r.players.filter((p) => p.isReady).length
        }, { timeout: 20_000, intervals: [400] })
        .toBe(2)

      // Start game → IN_PROGRESS.
      const startRes = await startRoom(host.token, room.id)
      expect(startRes.ok).toBe(true)

      // Wait QUESTION_START so game is fully IN_PROGRESS on both sides.
      await session.players[0].client.waitForEvent('QUESTION_START', 15_000)

      // Capture player B userId BEFORE leaving (after leave the row stays
      // but it's cleaner to grab it now).
      const detailBefore = await getRoom(host.token, room.id)
      const playerB = detailBefore.players[1]
      expect(playerB).toBeTruthy()
      const playerBId = playerB.userId

      // ── Step 1: Player B /leave mid-game → status flips to LEFT.
      const leaveRes = await leaveRoom(players[1].token, room.id)
      expect(leaveRes.ok, 'mid-game leave should succeed').toBe(true)

      const detailAfterLeave = await getRoom(host.token, room.id)
      const bAfterLeave = detailAfterLeave.players.find((p) => p.userId === playerBId)
      expect(bAfterLeave, 'LEFT player row preserved (not deleted) mid-game').toBeTruthy()
      expect(bAfterLeave?.playerStatus, 'status should be LEFT').toBe('LEFT')

      // ── Step 2: Player B rejoin within grace → ACTIVE flip (RoomService:224-225).
      const rejoinRes = await joinRoom(players[1].token, room.roomCode)
      expect(rejoinRes.ok, 'rejoin within grace should succeed').toBe(true)

      const detailAfterRejoin = await getRoom(host.token, room.id)
      const bAfterRejoin = detailAfterRejoin.players.find((p) => p.userId === playerBId)
      expect(bAfterRejoin?.playerStatus, 'rejoin flips LEFT → ACTIVE').toBe('ACTIVE')
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPL-2-002: LOBBY /leave deletes row (not LEFT) — confirms mid-game semantics @write @serial', async () => {
    // Spec: LOBBY /leave → row deleted; IN_PROGRESS /leave → status LEFT.
    // This negative-style test pins the LOBBY behavior, ensuring MPL-2-001
    // really exercised the IN_PROGRESS path.
    const [host] = await provisionUsers('e2e-rc-lobby-host-', 1)
    const [b] = await provisionUsers('e2e-rc-lobby-b-', 1)
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Reconnect LOBBY',
        mode: 'SPEED_RACE', maxPlayers: 4,
        hostPlaysGame: false,
      })
      roomId = room.id

      const joinRes = await joinRoom(b.token, room.roomCode)
      const bId = (await joinRes.json()).viewerUserId

      const before = await getRoom(host.token, room.id)
      expect(before.players.length).toBe(1)

      await leaveRoom(b.token, room.id)

      const after = await getRoom(host.token, room.id)
      // LOBBY /leave → row deleted (not LEFT).
      expect(after.players.find((p) => p.userId === bId), 'LOBBY /leave deletes row entirely').toBeUndefined()
      expect(after.players.length).toBe(0)
    } finally {
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

})
