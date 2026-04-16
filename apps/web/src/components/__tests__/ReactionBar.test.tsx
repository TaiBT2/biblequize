import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import ReactionBar from '../ReactionBar'

describe('ReactionBar', () => {
  let onSend: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    onSend = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all 6 emoji reaction buttons', () => {
    render(<ReactionBar onSend={onSend} incoming={null} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(6)
    expect(buttons.map(b => b.textContent)).toEqual(['👏', '😂', '😱', '🔥', '💪', '🙏'])
  })

  it('calls onSend with the correct emoji when a button is clicked', () => {
    render(<ReactionBar onSend={onSend} incoming={null} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0]) // 👏
    expect(onSend).toHaveBeenCalledWith('👏')
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it('enables cooldown after clicking, disabling buttons', () => {
    render(<ReactionBar onSend={onSend} incoming={null} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    // All buttons should be disabled during cooldown
    buttons.forEach(btn => {
      expect(btn).toBeDisabled()
    })
  })

  it('has opacity-40 class during cooldown', () => {
    render(<ReactionBar onSend={onSend} incoming={null} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    buttons.forEach(btn => {
      expect(btn.className).toContain('opacity-40')
    })
  })

  it('does not call onSend during cooldown', () => {
    render(<ReactionBar onSend={onSend} incoming={null} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onSend).toHaveBeenCalledTimes(1)

    // Try clicking during cooldown - button is disabled so click won't fire handler
    fireEvent.click(buttons[1])
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it('re-enables buttons after 1500ms cooldown expires', () => {
    render(<ReactionBar onSend={onSend} incoming={null} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    // Buttons are disabled
    expect(buttons[0]).toBeDisabled()

    // Advance past cooldown
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    // Buttons should be enabled again
    buttons.forEach(btn => {
      expect(btn).not.toBeDisabled()
    })
  })

  it('displays floating reaction when incoming reactions arrive', () => {
    const incoming = [{ senderId: 'user1', senderName: 'Alice', reaction: '🔥' }]
    const { container } = render(<ReactionBar onSend={onSend} incoming={incoming} />)
    const floatingReaction = container.querySelector('.animate-floatUp')
    expect(floatingReaction).toBeTruthy()
    expect(floatingReaction!.textContent).toContain('🔥')
    expect(floatingReaction!.textContent).toContain('Alice')
  })

  it('auto-removes floating reaction after 2000ms', () => {
    const incoming = [{ senderId: 'user1', senderName: 'Alice', reaction: '🔥' }]
    const { container } = render(<ReactionBar onSend={onSend} incoming={incoming} />)
    expect(container.querySelector('.animate-floatUp')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(container.querySelector('.animate-floatUp')).toBeNull()
  })

  it('renders nothing in floating area when incoming is null', () => {
    const { container } = render(<ReactionBar onSend={onSend} incoming={null} />)
    expect(container.querySelector('.animate-floatUp')).toBeNull()
  })

  it('limits floating reactions to max 6 (slices to last 5 + new)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { rerender, container } = render(
      <ReactionBar onSend={onSend} incoming={[{ senderId: 'u1', senderName: 'A', reaction: '👏' }]} />
    )
    for (let i = 2; i <= 8; i++) {
      rerender(
        <ReactionBar onSend={onSend} incoming={[{ senderId: `u${i}`, senderName: `P${i}`, reaction: '🔥' }]} />
      )
    }
    const floats = container.querySelectorAll('.animate-floatUp')
    expect(floats.length).toBeLessThanOrEqual(6)
    vi.restoreAllMocks()
  })

  it('positions floating reactions with inline style left percentage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const incoming = [{ senderId: 'user1', senderName: 'Alice', reaction: '🙏' }]
    const { container } = render(<ReactionBar onSend={onSend} incoming={incoming} />)
    const floatingEl = container.querySelector('.animate-floatUp') as HTMLElement
    // 20 + 0.5 * 60 = 50
    expect(floatingEl.style.left).toBe('50%')
    vi.restoreAllMocks()
  })
})
