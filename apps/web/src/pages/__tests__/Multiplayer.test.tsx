import { describe, it, expect, vi } from 'vitest'

/**
 * Phase 2 Task 2.2 — Multiplayer Lobby List.
 * Component makes real API calls on mount — these tests verify module structure.
 * Full rendering tests require running backend (E2E scope).
 */

describe('Multiplayer Lobby List', () => {
  it('module exports default component', async () => {
    const mod = await import('../Multiplayer')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('component name is defined', async () => {
    const mod = await import('../Multiplayer')
    expect(mod.default.name).toBeTruthy()
  })
})
