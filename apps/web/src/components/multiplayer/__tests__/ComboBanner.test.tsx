import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ComboBanner from '../ComboBanner'

describe('ComboBanner', () => {
  it('renders count and multiplier text', () => {
    render(<ComboBanner count={5} multiplier={1.2} onDismiss={() => {}} />)
    expect(screen.getByTestId('combo-banner')).toBeInTheDocument()
    expect(screen.getByText(/COMBO ×5/)).toBeInTheDocument()
    expect(screen.getByText(/5 câu đúng liên tiếp/)).toBeInTheDocument()
    expect(screen.getByText(/×1\.2/)).toBeInTheDocument()
  })

  it('renders 10x variant', () => {
    render(<ComboBanner count={10} multiplier={1.5} onDismiss={() => {}} />)
    expect(screen.getByText(/COMBO ×10/)).toBeInTheDocument()
    expect(screen.getByText(/×1\.5/)).toBeInTheDocument()
  })

  it('calls onDismiss after ~2.4s', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<ComboBanner count={5} multiplier={1.2} onDismiss={onDismiss} />)
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(2500) })
    expect(onDismiss).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})
