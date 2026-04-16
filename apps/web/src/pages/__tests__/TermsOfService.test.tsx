import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TermsOfService from '../TermsOfService'

/**
 * Tests for Terms of Service page.
 * Covers: rendering, content sections, navigation link.
 */

function renderPage() {
  return render(
    <MemoryRouter>
      <TermsOfService />
    </MemoryRouter>
  )
}

describe('TermsOfService', () => {
  it('renders the page title', () => {
    renderPage()
    expect(screen.getByText('Điều khoản Sử dụng')).toBeInTheDocument()
  })

  it('renders last updated date', () => {
    renderPage()
    expect(screen.getByText(/Cập nhật lần cuối/)).toBeInTheDocument()
  })

  it('renders all 8 sections', () => {
    renderPage()
    expect(screen.getByText('1. Chấp nhận điều khoản')).toBeInTheDocument()
    expect(screen.getByText('2. Tài khoản người dùng')).toBeInTheDocument()
    expect(screen.getByText('3. Nội dung và hành vi')).toBeInTheDocument()
    expect(screen.getByText('4. Quyền sở hữu trí tuệ')).toBeInTheDocument()
    expect(screen.getByText('5. Miễn trừ trách nhiệm')).toBeInTheDocument()
    expect(screen.getByText('6. Chấm dứt')).toBeInTheDocument()
    expect(screen.getByText('7. Thay đổi điều khoản')).toBeInTheDocument()
    expect(screen.getByText('8. Liên hệ')).toBeInTheDocument()
  })

  it('contains contact email', () => {
    renderPage()
    expect(screen.getByText(/support@biblequiz\.app/)).toBeInTheDocument()
  })

  it('has a back link to home page', () => {
    renderPage()
    const backLink = screen.getByRole('link', { name: /Quay lại/ })
    expect(backLink).toHaveAttribute('href', '/')
  })
})
