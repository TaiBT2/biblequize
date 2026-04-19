import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import EarlyRankedUnlockModal from '../EarlyRankedUnlockModal'
import { renderWithI18n } from '../../test/i18n-test-utils'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('EarlyRankedUnlockModal', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders nothing when open=false', () => {
    renderWithI18n(<EarlyRankedUnlockModal open={false} onDismiss={vi.fn()} />)
    expect(screen.queryByTestId('early-unlock-modal')).not.toBeInTheDocument()
  })

  it('renders the celebration UI when open=true', () => {
    renderWithI18n(<EarlyRankedUnlockModal open={true} onDismiss={vi.fn()} />)
    expect(screen.getByTestId('early-unlock-modal')).toBeInTheDocument()
    expect(screen.getByTestId('early-unlock-title')).toHaveTextContent('Chúc mừng!')
    expect(screen.getByTestId('early-unlock-play-btn')).toBeInTheDocument()
    expect(screen.getByTestId('early-unlock-continue-btn')).toBeInTheDocument()
  })

  it('includes accuracy % in description when provided', () => {
    renderWithI18n(<EarlyRankedUnlockModal open={true} accuracyPct={92} onDismiss={vi.fn()} />)
    expect(screen.getByText(/92%/)).toBeInTheDocument()
  })

  it('falls back to description without % when accuracyPct is undefined', () => {
    renderWithI18n(<EarlyRankedUnlockModal open={true} onDismiss={vi.fn()} />)
    // Plain description (no interpolated percentage)
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('primary CTA navigates to /ranked and dismisses', () => {
    const onDismiss = vi.fn()
    renderWithI18n(<EarlyRankedUnlockModal open={true} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('early-unlock-play-btn'))
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith('/ranked')
  })

  it('secondary CTA dismisses without navigating', () => {
    const onDismiss = vi.fn()
    renderWithI18n(<EarlyRankedUnlockModal open={true} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('early-unlock-continue-btn'))
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('backdrop click dismisses the modal', () => {
    const onDismiss = vi.fn()
    renderWithI18n(<EarlyRankedUnlockModal open={true} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('early-unlock-modal'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('clicking the card body does NOT dismiss (stops propagation)', () => {
    const onDismiss = vi.fn()
    renderWithI18n(<EarlyRankedUnlockModal open={true} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('early-unlock-title'))
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('renders English strings when language=en', () => {
    renderWithI18n(<EarlyRankedUnlockModal open={true} onDismiss={vi.fn()} />, { language: 'en' })
    expect(screen.getByTestId('early-unlock-title')).toHaveTextContent('Congratulations!')
    expect(screen.getByTestId('early-unlock-play-btn')).toHaveTextContent('Play Ranked Now')
  })
})
