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

  it('renders coverage map section', async () => {
    render(<QuestionQuality />)
    await waitFor(() => { expect(screen.getByText(/Coverage Map/)).toBeInTheDocument() })
  })

  it('does not render removed placeholder blocks (ADM-5)', async () => {
    render(<QuestionQuality />)
    await waitFor(() => { expect(screen.getByText(/Coverage Map/)).toBeInTheDocument() })
    // hardcoded "overall score" + needs-API problem cards are gone
    expect(screen.queryByTestId('quality-overall-score')).not.toBeInTheDocument()
    expect(screen.queryByText(/Quá khó/)).not.toBeInTheDocument()
  })

  it('handles error', () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    expect(() => render(<QuestionQuality />)).not.toThrow()
  })
})
