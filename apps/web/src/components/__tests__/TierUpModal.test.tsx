import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../services/soundManager', () => ({
  soundManager: { play: vi.fn() },
}))

vi.mock('../../utils/haptics', () => ({
  haptic: { tierUp: vi.fn() },
}))

import TierUpModal from '../TierUpModal'
import { soundManager } from '../../services/soundManager'
import { haptic } from '../../utils/haptics'

describe('TierUpModal', () => {
  const defaultProps = {
    tierName: 'Hiền Triết',
    tierIcon: '🔥',
    tierColor: 'text-purple-500',
    onClose: vi.fn(),
  }

  // 1. Renders with tier name and icon
  it('renders tier name and icon', () => {
    render(<TierUpModal {...defaultProps} />)
    expect(screen.getByText('🔥')).toBeInTheDocument()
    expect(screen.getByText(/Hiền Triết/)).toBeInTheDocument()
  })

  // 2. Has data-testid
  it('has data-testid="tier-up-modal"', () => {
    render(<TierUpModal {...defaultProps} />)
    expect(screen.getByTestId('tier-up-modal')).toBeInTheDocument()
  })

  // 3. Plays sound and haptic on mount
  it('plays tier up sound and haptic on mount', () => {
    render(<TierUpModal {...defaultProps} />)
    expect(soundManager.play).toHaveBeenCalledWith('tierUp')
    expect(haptic.tierUp).toHaveBeenCalled()
  })

  // 4. Shows XP multiplier when provided
  it('shows XP multiplier when xpMultiplier is provided', () => {
    render(<TierUpModal {...defaultProps} xpMultiplier={2} />)
    expect(screen.getByText('🎁 2x XP')).toBeInTheDocument()
  })

  // 5. Shows energy regen when provided
  it('shows energy regen when energyRegen is provided', () => {
    render(<TierUpModal {...defaultProps} energyRegen={5} />)
    expect(screen.getByText('⚡ 5 energy/giờ')).toBeInTheDocument()
  })

  // 6. Shows unlocked mode when provided
  it('shows unlocked mode when unlockedMode is provided', () => {
    render(<TierUpModal {...defaultProps} unlockedMode="Ranked" />)
    expect(screen.getByText('🔓 Mở khóa: Ranked!')).toBeInTheDocument()
  })

  // 7. Does not show optional rewards when not provided
  it('does not show optional rewards when not provided', () => {
    render(<TierUpModal {...defaultProps} />)
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument()
    expect(screen.queryByText(/energy/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Mở khóa/)).not.toBeInTheDocument()
  })

  // 8. Close button calls onClose
  it('calls onClose when continue button is clicked', () => {
    render(<TierUpModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Tiếp tục hành trình'))
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  // 9. Shows congratulations text
  it('shows congratulations heading', () => {
    render(<TierUpModal {...defaultProps} />)
    expect(screen.getByText('Chúc mừng!')).toBeInTheDocument()
  })
})
