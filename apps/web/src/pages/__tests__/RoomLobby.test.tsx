import { describe, it, expect, vi } from 'vitest'

/**
 * Phase 2 Task 2.3 — Room Lobby.
 * Component requires WebSocket connection + API on mount.
 * Module structure tests here; full rendering tests are E2E scope.
 */

describe('Room Lobby', () => {
  it('module exports default component', async () => {
    const mod = await import('../RoomLobby')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('component name is defined', async () => {
    const mod = await import('../RoomLobby')
    expect(mod.default.name).toBeTruthy()
  })
})
