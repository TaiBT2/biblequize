/**
 * W-M06-MPL-4 — Host kick + rejoin-after-kick + permission negatives
 *
 * BE: RoomController:332 + RoomService.kickPlayer:456
 * Rules: host-only (403 FORBIDDEN); LOBBY only (reject IN_PROGRESS);
 *        host can't kick self; RoomPlayer row deleted + currentPlayers
 *        synced + ROOM_STATE broadcast. No explicit rejoin block — test
 *        validates current behavior.
 *
 * Source: docs/todo/active/2026-05-23-mp-test-lifecycle-reconnect-kick.md (MPL-4)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, joinRoom, getRoom, kickPlayer, deleteRoom,
} from '../../helpers/multiplayer-api'

test.describe('W-M06-MPL-4 Host kick — L2 Happy Path @happy-path @multiplayer @kick', () => {

  test('W-M06-MPL-4-001: Host kick player in LOBBY → row removed + count synced @write @serial', async () => {
    const [host] = await provisionUsers('e2e-kick-host-', 1)
    const [target] = await provisionUsers('e2e-kick-target-', 1)
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Kick test', mode: 'SPEED_RACE', maxPlayers: 4,
      })
      roomId = room.id

      // Target joins via code.
      const joinRes = await joinRoom(target.token, room.roomCode)
      expect(joinRes.ok).toBe(true)
      const joinBody = await joinRes.json()
      const targetUserId = joinBody.viewerUserId
      expect(targetUserId).toBeTruthy()

      // Pre-kick: 2 players.
      let detail = await getRoom(host.token, room.id)
      expect(detail.players.length).toBe(2)

      // Kick.
      const kickRes = await kickPlayer(host.token, room.id, targetUserId)
      expect(kickRes.ok).toBe(true)

      // Post-kick: target row gone.
      detail = await getRoom(host.token, room.id)
      expect(detail.players.length).toBe(1)
      expect(detail.players.find((p) => p.userId === targetUserId)).toBeUndefined()
    } finally {
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPL-4-002: Non-host kick → 403 FORBIDDEN @write @serial', async () => {
    const [host] = await provisionUsers('e2e-kick-host-', 1)
    const [a, b] = await provisionUsers('e2e-kick-bystander-', 2)
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Kick non-host', mode: 'SPEED_RACE', maxPlayers: 4,
      })
      roomId = room.id

      const joinA = await joinRoom(a.token, room.roomCode)
      const joinB = await joinRoom(b.token, room.roomCode)
      expect(joinA.ok && joinB.ok).toBe(true)
      const bUserId = (await joinB.json()).viewerUserId

      // Player A (non-host) tries to kick Player B.
      const kickRes = await kickPlayer(a.token, room.id, bUserId)
      expect(kickRes.status).toBe(403)
      const body = await kickRes.json()
      expect(body.success).toBe(false)
      expect(String(body.message ?? '')).toMatch(/host|kick/i)

      // Both players still present.
      const detail = await getRoom(host.token, room.id)
      expect(detail.players.length).toBe(2)
    } finally {
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPL-4-003: Host kick self → rejected @write @serial', async () => {
    const [host] = await provisionUsers('e2e-kick-self-', 1)
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Kick self', mode: 'SPEED_RACE', maxPlayers: 4,
      })
      roomId = room.id

      const detail = await getRoom(host.token, room.id)
      const hostUserId = detail.players[0]?.userId
      expect(hostUserId).toBeTruthy()

      const kickRes = await kickPlayer(host.token, room.id, hostUserId!)
      expect(kickRes.ok).toBe(false)
      // RoomService throws RuntimeException → typically surfaces as 400/500.
      // Accept any non-2xx with "không thể kick chính mình" message intent.
      const body = await kickRes.json().catch(() => ({}))
      const msg = String(body.message ?? body.error ?? '')
      expect(msg).toMatch(/chính mình|self|kick/i)
    } finally {
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPL-4-004: Kicked user can POST /join lại bằng cùng roomCode (current BE behavior — no explicit block) @write @serial', async () => {
    // BE RoomService.kickPlayer just deletes the RoomPlayer row + syncs
    // count + broadcasts ROOM_STATE. No persistent ban list. So a kicked
    // user can /join again immediately. This test pins current behavior;
    // future spec change (if BL-N adds ban-list) will need test update.
    const [host] = await provisionUsers('e2e-kick-rejoin-host-', 1)
    const [target] = await provisionUsers('e2e-kick-rejoin-target-', 1)
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Kick rejoin', mode: 'SPEED_RACE', maxPlayers: 4,
      })
      roomId = room.id

      const joinRes = await joinRoom(target.token, room.roomCode)
      const targetUserId = (await joinRes.json()).viewerUserId

      const kickRes = await kickPlayer(host.token, room.id, targetUserId)
      expect(kickRes.ok).toBe(true)

      // Rejoin attempt — current BE allows.
      const rejoinRes = await joinRoom(target.token, room.roomCode)
      expect(rejoinRes.ok).toBe(true)

      const detail = await getRoom(host.token, room.id)
      expect(detail.players.length).toBe(2)
    } finally {
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

})
