import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PrivacyPolicy from '../PrivacyPolicy'

/**
 * Tests for Privacy Policy page.
 * Covers: rendering, content sections, navigation link.
 */

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivacyPolicy />
    </MemoryRouter>
  )
}

describe('PrivacyPolicy', () => {
  it('renders the page title', () => {
    renderPage()
    expect(screen.getByText('Chính sách Bảo mật')).toBeInTheDocument()
  })

  it('renders last updated date', () => {
    renderPage()
    expect(screen.getByText(/Cập nhật lần cuối/)).toBeInTheDocument()
  })

  it('renders all 7 sections', () => {
    renderPage()
    expect(screen.getByText('1. Thông tin chúng tôi thu thập')).toBeInTheDocument()
    expect(screen.getByText('2. Cách chúng tôi sử dụng thông tin')).toBeInTheDocument()
    expect(screen.getByText('3. Chia sẻ thông tin')).toBeInTheDocument()
    expect(screen.getByText('4. Lưu trữ dữ liệu')).toBeInTheDocument()
    expect(screen.getByText('5. Quyền của bạn')).toBeInTheDocument()
    expect(screen.getByText('6. Trẻ em')).toBeInTheDocument()
    expect(screen.getByText('7. Liên hệ')).toBeInTheDocument()
  })

  it('contains contact email', () => {
    renderPage()
    expect(screen.getByText(/privacy@biblequiz\.app/)).toBeInTheDocument()
  })

  it('has a back link to home page', () => {
    renderPage()
    const backLink = screen.getByRole('link', { name: /Quay lại/ })
    expect(backLink).toHaveAttribute('href', '/')
  })
})
