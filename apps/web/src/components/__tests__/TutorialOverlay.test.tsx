import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockSetHasDoneTutorial = vi.fn()
let mockHasDoneTutorial = false

vi.mock('../../store/onboardingStore', () => ({
  useOnboardingStore: () => ({
    hasDoneTutorial: mockHasDoneTutorial,
    setHasDoneTutorial: mockSetHasDoneTutorial,
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'onboarding.tutorialDaily': 'Try the daily challenge!',
        'onboarding.tutorialStreak': 'Build your streak!',
        'onboarding.tutorialModes': 'Explore game modes!',
        'onboarding.tutorialGotIt': 'Got it',
      }
      return map[key] ?? key
    },
  }),
}))

import TutorialOverlay from '../TutorialOverlay'

describe('TutorialOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasDoneTutorial = false
  })

  // 1. Renders first tip
  it('renders first tutorial tip', () => {
    render(<TutorialOverlay />)
    expect(screen.getByText('Try the daily challenge!')).toBeInTheDocument()
  })

  // 2. Shows step counter
  it('shows step counter 1/3', () => {
    render(<TutorialOverlay />)
    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  // 3. Advances to next tip on button click
  it('advances to next tip when Got it button is clicked', () => {
    render(<TutorialOverlay />)
    fireEvent.click(screen.getByText('Got it'))
    expect(screen.getByText('Build your streak!')).toBeInTheDocument()
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  // 4. Advances through all tips
  it('advances through all tips and calls setHasDoneTutorial on last', () => {
    render(<TutorialOverlay />)
    fireEvent.click(screen.getByText('Got it'))
    fireEvent.click(screen.getByText('Got it'))
    // Third step - clicking should finish tutorial
    fireEvent.click(screen.getByText('Got it'))
    expect(mockSetHasDoneTutorial).toHaveBeenCalledWith(true)
  })

  // 5. Renders nothing when tutorial is done
  it('renders nothing when hasDoneTutorial is true', () => {
    mockHasDoneTutorial = true
    const { container } = render(<TutorialOverlay />)
    expect(container.innerHTML).toBe('')
  })

  // 6. Clicking backdrop advances step
  it('advances step when clicking the backdrop overlay', () => {
    render(<TutorialOverlay />)
    // Click the outer fixed div (backdrop)
    const backdrop = screen.getByText('Try the daily challenge!').closest('.fixed')!
    fireEvent.click(backdrop)
    expect(screen.getByText('Build your streak!')).toBeInTheDocument()
  })

  // 7. Shows third tip content
  it('shows third tip content after two advances', () => {
    render(<TutorialOverlay />)
    fireEvent.click(screen.getByText('Got it'))
    fireEvent.click(screen.getByText('Got it'))
    expect(screen.getByText('Explore game modes!')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
  })
})
