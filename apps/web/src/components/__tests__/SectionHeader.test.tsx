import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import SectionHeader from '../SectionHeader'

describe('SectionHeader (HRV-8 vintage)', () => {
  it('renders Yeseva One display title (font-display class)', () => {
    render(<SectionHeader title="Khám phá thêm" />)
    const title = screen.getByTestId('section-header-title')
    expect(title).toHaveTextContent('Khám phá thêm')
    expect(title.className).toContain('font-display')
  })

  it('title uses responsive display size (22px → 28px on md)', () => {
    render(<SectionHeader title="Test" />)
    const title = screen.getByTestId('section-header-title')
    expect(title.className).toContain('text-[22px]')
    expect(title.className).toContain('md:text-[28px]')
  })

  it('omits tag and meta when props are undefined', () => {
    render(<SectionHeader title="Test" />)
    expect(screen.queryByTestId('section-header-tag')).not.toBeInTheDocument()
    expect(screen.queryByTestId('section-header-meta')).not.toBeInTheDocument()
  })

  it('renders tag wrapped with em-dashes when provided', () => {
    render(<SectionHeader title="Hành trình 66 cuốn" tag="Quest Map" />)
    const tagEl = screen.getByTestId('section-header-tag')
    expect(tagEl.textContent).toBe('— Quest Map —')
    expect(tagEl.className).toContain('uppercase')
    expect(tagEl.className).toContain('text-secondary')
    expect(tagEl.className).toContain('tracking-[0.24em]')
  })

  it('renders meta when prop is provided', () => {
    render(<SectionHeader title="Khám phá thêm" meta="0 / 66 sách" />)
    const meta = screen.getByTestId('section-header-meta')
    expect(meta).toHaveTextContent('0 / 66 sách')
    expect(meta.className).toContain('ml-auto')
  })

  it('renders all three slots together in source order', () => {
    render(
      <SectionHeader title="Hành trình 66 cuốn" tag="Quest Map" meta="0 / 66 sách" />,
    )
    expect(screen.getByTestId('section-header-title')).toBeInTheDocument()
    expect(screen.getByTestId('section-header-tag')).toBeInTheDocument()
    expect(screen.getByTestId('section-header-meta')).toBeInTheDocument()
  })

  it('accepts className prop', () => {
    render(<SectionHeader title="Test" className="extra-class" />)
    expect(screen.getByTestId('section-header').className).toContain('extra-class')
  })
})
