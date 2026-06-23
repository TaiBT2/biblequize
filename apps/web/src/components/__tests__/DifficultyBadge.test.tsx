import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DifficultyBadge, { difficultyMeta } from '../DifficultyBadge'

describe('difficultyMeta', () => {
  it('maps easy/medium/hard to badge class + i18n key', () => {
    expect(difficultyMeta('easy')).toEqual({ cls: 'badge-easy', labelKey: 'practice.easy' })
    expect(difficultyMeta('medium')).toEqual({ cls: 'badge-medium', labelKey: 'practice.medium' })
    expect(difficultyMeta('hard')).toEqual({ cls: 'badge-hard', labelKey: 'practice.hard' })
  })

  it('is case-insensitive (BE may send EASY or easy)', () => {
    expect(difficultyMeta('EASY')?.cls).toBe('badge-easy')
    expect(difficultyMeta('Hard')?.cls).toBe('badge-hard')
  })

  it('returns null for missing/unknown values', () => {
    expect(difficultyMeta()).toBeNull()
    expect(difficultyMeta(null)).toBeNull()
    expect(difficultyMeta('')).toBeNull()
    expect(difficultyMeta('mixed')).toBeNull()
    expect(difficultyMeta('legendary')).toBeNull()
  })
})

describe('<DifficultyBadge>', () => {
  it('renders a labelled badge for a valid difficulty', () => {
    render(<DifficultyBadge difficulty="easy" />)
    const badge = screen.getByTestId('question-difficulty-badge')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-easy')
  })

  it('renders nothing when difficulty is unknown/missing', () => {
    const { container } = render(<DifficultyBadge difficulty={undefined} />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByTestId('question-difficulty-badge')).toBeNull()
  })
})
