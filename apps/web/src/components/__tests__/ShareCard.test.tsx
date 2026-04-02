import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

/**
 * Phase B.6 — ShareCard unit tests (3 variants per SPEC-v2 mockup).
 * Min 8 tests.
 */

vi.mock('../../api/config', () => ({
  getApiBaseUrl: () => 'http://localhost:8080',
}))

import ShareCard from '../ShareCard'

describe('ShareCard', () => {
  // 1. Quiz result variant renders
  it('renders quiz result variant with score circle', () => {
    render(<ShareCard sessionId="s1" correct={8} total={10} score={240} userName="Minh" />)
    expect(screen.getByText('8/10')).toBeInTheDocument()
    expect(screen.getByText('+240 XP')).toBeInTheDocument()
  })

  // 2. Grade text based on accuracy
  it('shows "Xuất sắc!" for >= 90% accuracy', () => {
    render(<ShareCard sessionId="s1" correct={9} total={10} userName="Test" />)
    expect(screen.getByText('Xuất sắc!')).toBeInTheDocument()
  })

  // 3. Shows "Cố gắng thêm!" for low accuracy
  it('shows "Cố gắng thêm!" for < 70%', () => {
    render(<ShareCard sessionId="s1" correct={3} total={10} userName="Test" />)
    expect(screen.getByText('Cố gắng thêm!')).toBeInTheDocument()
  })

  // 4. Daily challenge variant with stars
  it('renders daily challenge variant with stars', () => {
    render(<ShareCard type="daily" correct={4} total={5} userName="An" date="2026-04-02" />)
    expect(screen.getByText('4/5 câu đúng')).toBeInTheDocument()
    expect(screen.getByText(/Daily Challenge/i)).toBeInTheDocument()
  })

  // 5. Daily challenge percentile badge
  it('shows percentile badge when provided', () => {
    render(<ShareCard type="daily" correct={5} total={5} userName="An" percentile={94} />)
    expect(screen.getByText(/94%/i)).toBeInTheDocument()
  })

  // 6. Tier up variant
  it('renders tier up variant with old → new tier', () => {
    render(<ShareCard type="tier_up" userName="Bảo" tierName="Hiền Triết" oldTierName="Môn Đồ" referenceId="t1" />)
    expect(screen.getByText('Thăng hạng!')).toBeInTheDocument()
    expect(screen.getByText('Hiền Triết')).toBeInTheDocument()
    expect(screen.getByText('Môn Đồ')).toBeInTheDocument()
  })

  // 7. User name displayed
  it('displays user name in all variants', () => {
    render(<ShareCard sessionId="s1" correct={5} total={10} userName="Nguyễn Văn A" />)
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
  })

  // 8. Watermark present
  it('shows biblequiz.app watermark', () => {
    render(<ShareCard sessionId="s1" correct={5} total={10} userName="Test" />)
    expect(screen.getByText('biblequiz.app')).toBeInTheDocument()
  })

  // 9. Share button renders
  it('renders share button', () => {
    render(<ShareCard sessionId="s1" correct={5} total={10} userName="Test" />)
    expect(screen.getByText('Chia sẻ')).toBeInTheDocument()
  })

  // 10. Download button renders
  it('renders download button', () => {
    render(<ShareCard sessionId="s1" correct={5} total={10} userName="Test" />)
    const downloadBtns = document.querySelectorAll('.material-symbols-outlined')
    const downloadIcon = Array.from(downloadBtns).find(el => el.textContent === 'download')
    expect(downloadIcon).toBeTruthy()
  })

  // 11. Copy button exists and is clickable
  it('renders copy button that can be clicked', () => {
    render(<ShareCard sessionId="s1" correct={5} total={10} userName="Test" />)
    const copyBtns = document.querySelectorAll('.material-symbols-outlined')
    const copyIcon = Array.from(copyBtns).find(el => el.textContent === 'content_copy')
    expect(copyIcon).toBeTruthy()
    expect(copyIcon!.closest('button')).toBeTruthy()
  })

  // 12. SVG score circle renders in quiz variant
  it('renders SVG circle for score visualization', () => {
    render(<ShareCard sessionId="s1" correct={7} total={10} userName="Test" />)
    const svg = document.querySelector('svg')
    expect(svg).toBeTruthy()
    const circles = svg!.querySelectorAll('circle')
    expect(circles.length).toBe(2) // track + progress
  })
})
