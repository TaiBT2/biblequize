import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import SectionHeader from '../SectionHeader'

describe('SectionHeader (HR-6)', () => {
  it('renders uppercase tracked title with gold accent bar', () => {
    render(<SectionHeader title="Chế độ chơi chính" />)
    const title = screen.getByTestId('section-header-title')
    expect(title).toHaveTextContent('Chế độ chơi chính')
    expect(title.className).toContain('uppercase')
    expect(title.className).toContain('tracking-[0.16em]')
  })

  it('omits meta when prop is undefined', () => {
    render(<SectionHeader title="Test" />)
    expect(screen.queryByTestId('section-header-meta')).not.toBeInTheDocument()
  })

  it('renders meta when prop is provided', () => {
    render(<SectionHeader title="Khám phá thêm" meta="Luyện tập tự do" />)
    const meta = screen.getByTestId('section-header-meta')
    expect(meta).toHaveTextContent('Luyện tập tự do')
  })

  it('accepts className prop', () => {
    render(<SectionHeader title="Test" className="extra-class" />)
    expect(screen.getByTestId('section-header').className).toContain('extra-class')
  })
})
