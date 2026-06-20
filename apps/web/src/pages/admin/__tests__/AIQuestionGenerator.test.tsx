import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
const mockAiApiPost = vi.fn()
vi.mock('../../../api/client', () => ({
  api: { get: (...a: any[]) => mockApiGet(...a), post: (...a: any[]) => mockApiPost(...a) },
  aiApi: { post: (...a: any[]) => mockAiApiPost(...a) },
}))

// react-i18next minimal stub — returns the key (no translation needed for assertions).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'vi' } }),
}))

import AIQuestionGenerator from '../AIQuestionGenerator'

const FULL_INFO = {
  providers: {
    deepseek: { configured: true, model: 'deepseek.v3.2' },
    gemini:   { configured: true, model: 'gemini-2.5-flash' },
    claude:   { configured: true, model: 'claude-haiku-4-5-20251001' },
  },
  defaultProvider: 'deepseek',
  quotaToday: { used: 0, limit: 200, remaining: 200 },
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><AIQuestionGenerator /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AIQuestionGenerator — Phase C', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // useBookName fetches /api/books (expects Book[]); the page fetches /api/admin/ai/info.
    mockApiGet.mockImplementation((url: string) =>
      Promise.resolve({ data: url.includes('/api/books') ? [] : FULL_INFO }),
    )
  })

  it('renders 3 provider options including DeepSeek', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('ai-provider-deepseek')).toBeTruthy())
    expect(screen.getByTestId('ai-provider-gemini')).toBeTruthy()
    expect(screen.getByTestId('ai-provider-claude')).toBeTruthy()
  })

  it('marks DeepSeek as DEFAULT via badge', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('ai-provider-default-badge')).toBeTruthy())
    // Badge lives inside the DeepSeek button
    const deepseekBtn = screen.getByTestId('ai-provider-deepseek')
    expect(deepseekBtn.querySelector('[data-testid="ai-provider-default-badge"]')).toBeTruthy()
  })

  it('DeepSeek is selected by default (active class)', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('ai-provider-deepseek')).toBeTruthy())
    expect(screen.getByTestId('ai-provider-deepseek').className).toMatch(/active/)
    expect(screen.getByTestId('ai-provider-gemini').className).not.toMatch(/\bactive\b/)
  })

  it('offers an "all books" option that disables the chapter selector', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('ai-provider-deepseek')).toBeTruthy())

    // The book <select> is the first combobox in the scripture selector.
    const bookSelect = screen.getByTestId('ai-scripture-selector').querySelector('select') as HTMLSelectElement
    const allOption = Array.from(bookSelect.options).find(o => o.value === 'ALL')
    expect(allOption).toBeTruthy()

    // Chapter select is disabled until a real book is chosen; after picking ALL it stays disabled.
    fireEvent.change(bookSelect, { target: { value: 'ALL' } })
    const selects = screen.getByTestId('ai-scripture-selector').querySelectorAll('select')
    // selects[1] = chapter, selects[2] = chapterEnd — both must be disabled in all-books mode.
    expect((selects[1] as HTMLSelectElement).disabled).toBe(true)
    expect((selects[2] as HTMLSelectElement).disabled).toBe(true)
  })

  it('falls back gracefully when /info omits deepseek (backwards compat)', async () => {
    mockApiGet.mockImplementation((url: string) =>
      Promise.resolve({ data: url.includes('/api/books') ? [] : {
        providers: {
          gemini: { configured: true, model: 'gemini-2.5-flash' },
          claude: { configured: false, model: 'claude-haiku-4-5-20251001' },
        },
      } }),
    )
    renderPage()
    // Provider buttons still render — deepseek section just shows as not-configured
    await waitFor(() => expect(screen.getByTestId('ai-provider-deepseek')).toBeTruthy())
  })
})
