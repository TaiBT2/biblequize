import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'

/**
 * Phase B.4 — JoinRoom redirects to /multiplayer (deprecated page).
 */

import JoinRoom from '../JoinRoom'

describe('JoinRoom (deprecated)', () => {
  it('redirects to /multiplayer', () => {
    let currentPath = ''
    render(
      <MemoryRouter initialEntries={['/room/join']}>
        <Routes>
          <Route path="/room/join" element={<JoinRoom />} />
          <Route path="/multiplayer" element={<div data-testid="multiplayer">Multiplayer</div>} />
        </Routes>
      </MemoryRouter>
    )
    const mp = document.querySelector('[data-testid="multiplayer"]')
    expect(mp).toBeInTheDocument()
  })

  it('module exports default component', async () => {
    const mod = await import('../JoinRoom')
    expect(mod.default).toBeDefined()
  })
})
