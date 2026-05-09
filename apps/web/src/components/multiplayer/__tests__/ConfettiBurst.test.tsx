import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConfettiBurst from '../ConfettiBurst'

describe('ConfettiBurst', () => {
  it('renders the requested number of confetti pieces', () => {
    const { container } = render(<ConfettiBurst count={25} />)
    expect(container.querySelectorAll('.confetti-piece').length).toBe(25)
  })

  it('default count is 40 (host view)', () => {
    const { container } = render(<ConfettiBurst />)
    expect(container.querySelectorAll('.confetti-piece').length).toBe(40)
  })

  it('disabled flag suppresses the burst entirely', () => {
    const { container } = render(<ConfettiBurst disabled />)
    expect(container.firstChild).toBeNull()
  })

  it('outer container is aria-hidden + pointer-events-none', () => {
    render(<ConfettiBurst count={1} />)
    const layer = screen.getByTestId('confetti-burst')
    expect(layer.getAttribute('aria-hidden')).toBe('true')
    expect(layer.className).toContain('pointer-events-none')
  })
})
