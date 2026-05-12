import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

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
  return render(<MemoryRouter><AIQuestionGenerator /></MemoryRouter>)
}

describe('AIQuestionGenerator — Phase C', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ data: FULL_INFO })
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

  it('falls back gracefully when /info omits deepseek (backwards compat)', async () => {
    mockApiGet.mockResolvedValue({ data: {
      providers: {
        gemini: { configured: true, model: 'gemini-2.5-flash' },
        claude: { configured: false, model: 'claude-haiku-4-5-20251001' },
      },
    }})
    renderPage()
    // Provider buttons still render — deepseek section just shows as not-configured
    await waitFor(() => expect(screen.getByTestId('ai-provider-deepseek')).toBeTruthy())
  })
})
