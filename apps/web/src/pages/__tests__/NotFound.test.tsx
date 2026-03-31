import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * Tests for the 404 Not Found page.
 * Covers: rendering, navigation links, Bible verse.
 */

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import NotFound from '../NotFound'

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  )
}

describe('NotFound (404 Page)', () => {
  it('renders 404 text', () => {
    renderNotFound()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders Vietnamese error message', () => {
    renderNotFound()
    expect(screen.getByText(/Trang Không Tìm Thấy/i)).toBeInTheDocument()
  })

  it('renders "Về Trang Chủ" link pointing to /', () => {
    renderNotFound()
    const homeLink = screen.getByText(/Về Trang Chủ/i)
    expect(homeLink).toBeInTheDocument()
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders "Quay Lại" button that navigates back', () => {
    renderNotFound()
    const backBtn = screen.getByText(/Quay Lại/i)
    fireEvent.click(backBtn)
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('renders Bible verse (Ma-thi-ơ 7:7)', () => {
    renderNotFound()
    expect(screen.getByText(/Ma-thi-ơ 7:7/i)).toBeInTheDocument()
  })
})
