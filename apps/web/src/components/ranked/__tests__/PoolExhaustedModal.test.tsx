import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Key-passthrough i18n so assertions are decoupled from translation content.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import PoolExhaustedModal from '../PoolExhaustedModal'

describe('PoolExhaustedModal', () => {
  it('renders 2 CTAs when canUnlockNext=true', () => {
    render(
      <PoolExhaustedModal
        isOpen
        onClose={() => {}}
        canUnlockNext
        onUnlockNextWeek={() => {}}
      />
    )
    expect(screen.getByText('ranked.pool_exhausted.unlock_cta')).toBeInTheDocument()
    expect(screen.getByText('ranked.pool_exhausted.defer_cta')).toBeInTheDocument()
    expect(screen.getByText('ranked.pool_exhausted.body')).toBeInTheDocument()
  })

  it('renders 1 close CTA when canUnlockNext=false', () => {
    render(
      <PoolExhaustedModal
        isOpen
        onClose={() => {}}
        canUnlockNext={false}
        onUnlockNextWeek={() => {}}
      />
    )
    expect(screen.getByText('ranked.pool_exhausted.close_cta')).toBeInTheDocument()
    expect(screen.queryByText('ranked.pool_exhausted.unlock_cta')).not.toBeInTheDocument()
    expect(screen.getByText('ranked.pool_exhausted.no_unlock_body')).toBeInTheDocument()
  })

  it('unlock CTA calls onUnlockNextWeek then onClose', () => {
    const onUnlock = vi.fn()
    const onClose = vi.fn()
    render(
      <PoolExhaustedModal
        isOpen
        onClose={onClose}
        canUnlockNext
        onUnlockNextWeek={onUnlock}
      />
    )
    fireEvent.click(screen.getByText('ranked.pool_exhausted.unlock_cta'))
    expect(onUnlock).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('defer CTA calls onClose only', () => {
    const onUnlock = vi.fn()
    const onClose = vi.fn()
    render(
      <PoolExhaustedModal
        isOpen
        onClose={onClose}
        canUnlockNext
        onUnlockNextWeek={onUnlock}
      />
    )
    fireEvent.click(screen.getByText('ranked.pool_exhausted.defer_cta'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <PoolExhaustedModal
        isOpen
        onClose={onClose}
        canUnlockNext={false}
        onUnlockNextWeek={() => {}}
      />
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
