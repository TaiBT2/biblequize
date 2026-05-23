import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import JoinRoom from '../JoinRoom'
import { api } from '../../api/client'

vi.mock('../../api/client', () => ({
  api: { post: vi.fn() },
}))

describe('JoinRoom (QR landing)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /multiplayer when no ?code query', () => {
    render(
      <MemoryRouter initialEntries={['/room/join']}>
        <Routes>
          <Route path="/room/join" element={<JoinRoom />} />
          <Route path="/multiplayer" element={<div data-testid="multiplayer">Multiplayer</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('multiplayer')).toBeInTheDocument()
  })

  it('auto-joins room when ?code present and navigates to lobby', async () => {
    ;(api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { room: { id: 'room-1', status: 'WAITING', mode: 'SPEED_RACE' }, viewerUserId: 'u1' },
    })
    render(
      <MemoryRouter initialEntries={['/room/join?code=ABC123']}>
        <Routes>
          <Route path="/room/join" element={<JoinRoom />} />
          <Route path="/room/:id/lobby" element={<div data-testid="lobby">Lobby</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/rooms/join', { roomCode: 'ABC123' })
    })
    await waitFor(() => {
      expect(screen.getByTestId('lobby')).toBeInTheDocument()
    })
  })

  it('shows error UI when join fails', async () => {
    ;(api.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { data: { message: 'Phòng không tồn tại' } },
    })
    render(
      <MemoryRouter initialEntries={['/room/join?code=BADCODE']}>
        <Routes>
          <Route path="/room/join" element={<JoinRoom />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Phòng không tồn tại')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Về Multiplayer/i })).toBeInTheDocument()
  })
})
