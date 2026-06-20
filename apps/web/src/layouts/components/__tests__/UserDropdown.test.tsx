import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UserDropdown from '../UserDropdown'

// Mutable auth state so each test can set a different avatar shape.
const authState: { user: any; logout: () => Promise<void> } = {
  user: { name: 'Tai', email: 'a@b.com', avatar: undefined },
  logout: vi.fn().mockResolvedValue(undefined),
}
vi.mock('../../../store/authStore', () => ({
  useAuthStore: (s?: (st: any) => any) => (s ? s(authState) : authState),
  useAuth: () => authState,
}))

function renderDropdown(trigger: 'compact' | 'card' = 'compact') {
  return render(
    <MemoryRouter>
      <UserDropdown trigger={trigger} />
    </MemoryRouter>,
  )
}

describe('UserDropdown avatar', () => {
  beforeEach(() => {
    authState.user = { name: 'Tai', email: 'a@b.com', avatar: undefined }
  })

  it('renders the initial when there is no avatar', () => {
    renderDropdown()
    expect(screen.getByTestId('user-dropdown-avatar-initial').textContent).toBe('T')
  })

  it('renders a preset emoji (not the initial) when avatar is a preset value', () => {
    authState.user = { name: 'Tai', email: 'a@b.com', avatar: 'preset:angel' }
    renderDropdown()
    const preset = screen.getByTestId('user-dropdown-avatar-preset')
    expect(preset.textContent).toBe('👼')
    expect(screen.queryByTestId('user-dropdown-avatar-initial')).toBeNull()
  })

  // Lighthouse a11y guard: the compact icon trigger's avatar is aria-hidden,
  // so the button needs its own accessible name.
  it('gives the compact trigger an accessible name', () => {
    authState.user = { name: 'Tai', email: 'a@b.com', avatar: 'preset:angel' }
    renderDropdown()
    expect(screen.getByRole('button', { name: 'Menu người dùng' })).toBeInTheDocument()
  })

  it('renders an <img> when avatar is an http(s) URL', () => {
    authState.user = { name: 'Tai', email: 'a@b.com', avatar: 'https://lh3.googleusercontent.com/a/foo=s96-c' }
    renderDropdown()
    const img = screen.getByRole('img') as HTMLImageElement
    expect(img.getAttribute('src')).toContain('googleusercontent.com')
    expect(screen.queryByTestId('user-dropdown-avatar-initial')).toBeNull()
  })

  it('renders the preset emoji in the "card" trigger variant too', () => {
    authState.user = { name: 'Tai', email: 'a@b.com', avatar: 'preset:king' }
    renderDropdown('card')
    expect(screen.getByText('🤴')).toBeInTheDocument()
  })
})
