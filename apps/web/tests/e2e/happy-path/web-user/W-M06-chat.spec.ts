/**
 * W-M06-MPM-8 — Chat over STOMP (RoomWebSocketController:625)
 *
 * Contract:
 *   - Send `/app/room/{id}/chat` body `{text}`.
 *   - Server stamps sender + broadcasts `CHAT_MESSAGE` `{sender, senderId, text}`.
 *   - Empty/whitespace → silently dropped (no event, no error).
 *   - >500 chars → trimmed to 500.
 *   - Rate limit owned by WebSocketRateLimitInterceptor (shared SEND budget).
 *
 * Source: docs/todo/active/2026-05-23-mp-test-mode-edge-quan-tro-chat.md (MPM-8)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, joinRoom, deleteRoom,
} from '../../helpers/multiplayer-api'
import { MultiplayerSession } from '../../helpers/multiplayer-session'

const WAIT_FOR_BROADCAST_MS = 1500

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

test.describe('W-M06-MPM-8 Chat over STOMP — L3 @happy-path @multiplayer @chat @websocket', () => {

  test('W-M06-MPM-8-001: Send chat → all players receive CHAT_MESSAGE with sender + text @write @serial @websocket', async () => {
    test.setTimeout(60_000)

    const [host] = await provisionUsers('e2e-chat-host-', 1)
    const players = await provisionUsers('e2e-chat-player-', 2)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Chat broadcast',
        mode: 'SPEED_RACE', maxPlayers: 4,
        hostPlaysGame: false,
      })
      roomId = room.id

      for (const p of players) await joinRoom(p.token, room.roomCode)
      session = await MultiplayerSession.fromRoom(host, players, room.id)

      // Player A sends a chat message.
      session.players[0].client.send(`/app/room/${room.id}/chat`, { text: 'Hello world' })

      // Both players + observer should receive the broadcast.
      const event = await session.players[1].client.waitForEvent('CHAT_MESSAGE', 10_000)
      expect(event.data.text).toBe('Hello world')
      expect(event.data.sender).toBeTruthy()
      expect(event.data.senderId).toBeTruthy()

      // Observer (host) receives the same broadcast.
      expect(session.observer!.count('CHAT_MESSAGE')).toBeGreaterThanOrEqual(1)
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPM-8-002: Empty / whitespace text silently dropped (no CHAT_MESSAGE event) @write @serial @websocket', async () => {
    test.setTimeout(60_000)

    const [host] = await provisionUsers('e2e-chat-empty-host-', 1)
    const players = await provisionUsers('e2e-chat-empty-player-', 2)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Chat empty drop',
        mode: 'SPEED_RACE', maxPlayers: 4,
        hostPlaysGame: false,
      })
      roomId = room.id

      for (const p of players) await joinRoom(p.token, room.roomCode)
      session = await MultiplayerSession.fromRoom(host, players, room.id)

      // Send empty + whitespace.
      session.players[0].client.send(`/app/room/${room.id}/chat`, { text: '' })
      session.players[0].client.send(`/app/room/${room.id}/chat`, { text: '   \t  ' })

      // Wait briefly — server should drop both, no event.
      await sleep(WAIT_FOR_BROADCAST_MS)
      expect(
        session.players[1].client.count('CHAT_MESSAGE'),
        'empty/whitespace chat must be silently dropped',
      ).toBe(0)
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPM-8-003: Text >500 chars trimmed to exactly 500 @write @serial @websocket', async () => {
    test.setTimeout(60_000)

    const [host] = await provisionUsers('e2e-chat-trim-host-', 1)
    const players = await provisionUsers('e2e-chat-trim-player-', 2)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Chat trim 500',
        mode: 'SPEED_RACE', maxPlayers: 4,
        hostPlaysGame: false,
      })
      roomId = room.id

      for (const p of players) await joinRoom(p.token, room.roomCode)
      session = await MultiplayerSession.fromRoom(host, players, room.id)

      const longText = 'x'.repeat(600)
      session.players[0].client.send(`/app/room/${room.id}/chat`, { text: longText })

      const event = await session.players[1].client.waitForEvent('CHAT_MESSAGE', 10_000)
      expect(event.data.text.length, 'BE trims to 500 chars').toBe(500)
      expect(event.data.text).toBe('x'.repeat(500))
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

})
