import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'journey.celebration': 'Celebration!',
        'journey.mastery': `Mastery: ${opts?.percent ?? ''}%`,
        'journey.continueBtn': 'Continue',
        'common.close': 'Close',
      }
      if (key === 'journey.unlockNext') return `Unlock: ${opts?.book}`
      return map[key] ?? key
    },
  }),
}))

import BookCompletionModal from '../BookCompletionModal'

describe('BookCompletionModal', () => {
  const defaultProps = {
    bookName: 'Genesis',
    masteryPercent: 85,
    onContinue: vi.fn(),
    onClose: vi.fn(),
  }

  // 1. Renders modal with book name and mastery
  it('renders with book name and mastery percentage', () => {
    render(<BookCompletionModal {...defaultProps} />)
    expect(screen.getByText('Genesis')).toBeInTheDocument()
    expect(screen.getByText('Mastery: 85%')).toBeInTheDocument()
  })

  // 2. Shows celebration heading
  it('shows celebration heading', () => {
    render(<BookCompletionModal {...defaultProps} />)
    expect(screen.getByText('Celebration!')).toBeInTheDocument()
  })

  // 3. Shows next book when provided
  it('shows next book unlock message when nextBookName is provided', () => {
    render(<BookCompletionModal {...defaultProps} nextBookName="Exodus" />)
    expect(screen.getByText(/Unlock: Exodus/)).toBeInTheDocument()
  })

  // 4. Does not show next book when not provided
  it('does not show next book section when nextBookName is null', () => {
    render(<BookCompletionModal {...defaultProps} nextBookName={null} />)
    expect(screen.queryByText(/Unlock:/)).not.toBeInTheDocument()
  })

  // 5. Close button calls onClose
  it('calls onClose when close button is clicked', () => {
    render(<BookCompletionModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Close'))
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  // 6. Continue button calls onContinue
  it('calls onContinue when continue button is clicked', () => {
    render(<BookCompletionModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Continue'))
    expect(defaultProps.onContinue).toHaveBeenCalledOnce()
  })

  // 7. Clicking backdrop calls onClose
  it('calls onClose when clicking the backdrop overlay', () => {
    render(<BookCompletionModal {...defaultProps} />)
    // The outer overlay div
    const backdrop = screen.getByText('Celebration!').closest('.fixed')!
    fireEvent.click(backdrop)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  // 8. Clicking modal content does NOT close (stopPropagation)
  it('does not close when clicking inside modal content', () => {
    const onClose = vi.fn()
    render(<BookCompletionModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Genesis'))
    expect(onClose).not.toHaveBeenCalled()
  })

  // 9. Renders book emoji
  it('renders the book emoji icon', () => {
    render(<BookCompletionModal {...defaultProps} />)
    expect(screen.getByText('📖')).toBeInTheDocument()
  })
})
