import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EditProfileModal } from '../EditProfileModal'
import type { UserProfile } from '../types'
import { useAuthStore } from '../../../store/authStore'

const mockPatch = vi.fn()
vi.mock('../../../api/client', () => ({
  api: { patch: (...args: any[]) => mockPatch(...args) },
}))

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderModal(profile: UserProfile, onClose = vi.fn()) {
  const qc = makeQc()
  const utils = render(
    <QueryClientProvider client={qc}>
      <EditProfileModal open onClose={onClose} profile={profile} />
    </QueryClientProvider>,
  )
  return { ...utils, onClose, qc }
}

const BASE_PROFILE: UserProfile = {
  name: 'Trần Văn B',
  email: 'b@test.com',
  avatarUrl: undefined,
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  role: 'USER',
}

beforeEach(() => {
  mockPatch.mockReset()
  mockPatch.mockResolvedValue({ data: { name: 'updated', email: 'b@test.com', avatarUrl: '' } })
})

describe('EditProfileModal', () => {
  it('renders preview with Cormorant initial fallback when avatar is empty', () => {
    renderModal(BASE_PROFILE)
    const preview = screen.getByTestId('edit-profile-avatar-preview')
    expect(preview.textContent).toBe('T')
    expect(preview.querySelector('.font-verse')).not.toBeNull()
  })

  it('does NOT render an avatar URL input (regression: legacy field removed)', () => {
    renderModal(BASE_PROFILE)
    expect(screen.queryByTestId('edit-profile-avatar-input')).toBeNull()
  })

  it('opens preset grid via "Đổi ảnh" toggle and picks a preset', async () => {
    renderModal(BASE_PROFILE)
    fireEvent.click(screen.getByTestId('edit-profile-avatar-toggle'))
    expect(screen.getByTestId('edit-profile-preset-grid')).toBeTruthy()
    fireEvent.click(screen.getByTestId('edit-profile-preset-disciple'))
    // Preview switches from initial to preset emoji
    const preview = screen.getByTestId('edit-profile-avatar-preview')
    expect(preview.textContent).toBe('🧔')
  })

  it('submits PATCH with preset:<id> when a preset is selected', async () => {
    renderModal(BASE_PROFILE)
    fireEvent.click(screen.getByTestId('edit-profile-avatar-toggle'))
    fireEvent.click(screen.getByTestId('edit-profile-preset-king'))
    fireEvent.click(screen.getByTestId('edit-profile-submit'))
    await waitFor(() => expect(mockPatch).toHaveBeenCalled())
    expect(mockPatch).toHaveBeenCalledWith('/api/me', { name: 'Trần Văn B', avatarUrl: 'preset:king' })
  })

  it('shows Google avatar tile in preset grid only when profile uses an OAuth picture', () => {
    const { unmount } = renderModal(BASE_PROFILE)
    fireEvent.click(screen.getByTestId('edit-profile-avatar-toggle'))
    expect(screen.queryByTestId('edit-profile-avatar-google')).toBeNull()
    unmount()

    renderModal({ ...BASE_PROFILE, avatarUrl: 'https://lh3.googleusercontent.com/a/foo=s96-c' })
    fireEvent.click(screen.getByTestId('edit-profile-avatar-toggle'))
    expect(screen.getByTestId('edit-profile-avatar-google')).toBeTruthy()
  })

  it('closes via X button', () => {
    const { onClose } = renderModal(BASE_PROFILE)
    fireEvent.click(screen.getByTestId('edit-profile-close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('syncs authStore (header/sidebar) avatar on successful save', async () => {
    useAuthStore.setState({
      user: { name: 'Trần Văn B', email: 'b@test.com', avatar: undefined },
    })
    mockPatch.mockResolvedValue({ data: { name: 'Trần Văn B', email: 'b@test.com', avatarUrl: 'preset:king' } })
    renderModal(BASE_PROFILE)
    fireEvent.click(screen.getByTestId('edit-profile-avatar-toggle'))
    fireEvent.click(screen.getByTestId('edit-profile-preset-king'))
    fireEvent.click(screen.getByTestId('edit-profile-submit'))
    await waitFor(() => expect(useAuthStore.getState().user?.avatar).toBe('preset:king'))
  })

  it('blocks submit when name is empty', () => {
    renderModal(BASE_PROFILE)
    fireEvent.change(screen.getByTestId('edit-profile-name-input'), { target: { value: '   ' } })
    fireEvent.click(screen.getByTestId('edit-profile-submit'))
    expect(mockPatch).not.toHaveBeenCalled()
    expect(screen.getByTestId('edit-profile-error').textContent).toContain('không được để trống')
  })
})
