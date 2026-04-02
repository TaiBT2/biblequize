import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockApiGet = vi.fn()
vi.mock('../../../api/client', () => ({ api: { get: (...a: any[]) => mockApiGet(...a) } }))

import QuestionQuality from '../QuestionQuality'

describe('Question Quality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ data: { books: [{ book: 'Genesis', easy: 30, medium: 20, hard: 10 }] } })
  })

  it('renders title', async () => {
    render(<QuestionQuality />)
    await waitFor(() => { expect(screen.getByText('Chất lượng câu hỏi')).toBeInTheDocument() })
  })

  it('renders quality score', async () => {
    render(<QuestionQuality />)
    await waitFor(() => { expect(screen.getByText('72')).toBeInTheDocument() })
  })

  it('renders coverage map section', async () => {
    render(<QuestionQuality />)
    await waitFor(() => { expect(screen.getByText(/Coverage Map/)).toBeInTheDocument() })
  })

  it('renders problem categories', async () => {
    render(<QuestionQuality />)
    await waitFor(() => {
      expect(screen.getByText(/Quá khó/)).toBeInTheDocument()
      expect(screen.getByText(/Quá dễ/)).toBeInTheDocument()
      expect(screen.getByText(/Chưa sử dụng/)).toBeInTheDocument()
    })
  })

  it('handles error', () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    expect(() => render(<QuestionQuality />)).not.toThrow()
  })
})
