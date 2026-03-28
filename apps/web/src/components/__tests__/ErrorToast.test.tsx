import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ErrorToast from '../ErrorToast'

describe('ErrorToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the message', () => {
    render(<ErrorToast message="Something went wrong" onClose={vi.fn()} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('calls onClose after duration', () => {
    const onClose = vi.fn()
    render(<ErrorToast message="Error" onClose={onClose} duration={3000} />)

    act(() => { vi.advanceTimersByTime(3000) })
    // Wait for exit animation (300ms)
    act(() => { vi.advanceTimersByTime(300) })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ErrorToast message="Error" onClose={onClose} />)

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    act(() => { vi.advanceTimersByTime(300) })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders with error type by default', () => {
    const { container } = render(<ErrorToast message="Error" onClose={vi.fn()} />)
    expect(container.innerHTML).toContain('red')
  })

  it('renders with warning type', () => {
    const { container } = render(
      <ErrorToast message="Warning" onClose={vi.fn()} type="warning" />
    )
    expect(container.innerHTML).toContain('yellow')
  })

  it('renders with info type', () => {
    const { container } = render(
      <ErrorToast message="Info" onClose={vi.fn()} type="info" />
    )
    expect(container.innerHTML).toContain('blue')
  })

  it('uses default duration of 5000ms', () => {
    const onClose = vi.fn()
    render(<ErrorToast message="Error" onClose={onClose} />)

    act(() => { vi.advanceTimersByTime(4999) })
    expect(onClose).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(1) })
    act(() => { vi.advanceTimersByTime(300) })
    expect(onClose).toHaveBeenCalled()
  })

  it('has sr-only close button text', () => {
    render(<ErrorToast message="Error" onClose={vi.fn()} />)
    expect(screen.getByText('Đóng')).toBeInTheDocument()
  })
})
