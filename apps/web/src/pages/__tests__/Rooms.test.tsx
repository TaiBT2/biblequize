import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

/**
 * Phase B.5 — Rooms redirects to /multiplayer (deprecated page).
 */

import Rooms from '../Rooms'

describe('Rooms (deprecated)', () => {
  it('redirects to /multiplayer', () => {
    render(
      <MemoryRouter initialEntries={['/rooms']}>
        <Routes>
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/multiplayer" element={<div data-testid="multiplayer">Multiplayer</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(document.querySelector('[data-testid="multiplayer"]')).toBeInTheDocument()
  })
})
