import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SoundHapticsSettings } from '../SoundHapticsSettings'

// Lighthouse a11y regression guard: the toggle buttons (icon-only) and the
// volume range input must expose accessible names, otherwise screen readers
// announce them as a bare "button"/"slider".
describe('SoundHapticsSettings — accessible names', () => {
  it('labels both toggles and the volume slider', () => {
    render(<SoundHapticsSettings />)

    // soundManager defaults to enabled → both toggles + slider render.
    expect(screen.getByRole('button', { name: 'Âm thanh hiệu ứng' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rung phản hồi' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Âm lượng' })).toBeInTheDocument()
  })
})
