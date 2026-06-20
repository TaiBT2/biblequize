import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
vi.mock('../../../api/client', () => ({
  api: { get: (...a: any[]) => mockApiGet(...a) },
}))

// i18n stub — returns the key so we can assert group keys, and book labels fall
// back to the English canonical name (useBookName returns the key when books=[]).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'vi' } }),
}))

import BookScopeOptions, { BOOK_GROUP_SCOPES } from '../BookScopeOptions'

function renderInSelect() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <select data-testid="sel"><BookScopeOptions /></select>
    </QueryClientProvider>,
  )
}

describe('BookScopeOptions — MBV-4', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ data: [] }) // no /api/books data → English fallback labels
  })

  it('offers themed groups plus all 66 individual books', () => {
    renderInSelect()
    const sel = screen.getByTestId('sel') as HTMLSelectElement
    // 9 group sentinels + 66 books = 75 options total.
    expect(sel.options.length).toBe(BOOK_GROUP_SCOPES.length + 66)
    expect(BOOK_GROUP_SCOPES.length).toBe(9)
  })

  it('includes group sentinels and individual book values', () => {
    renderInSelect()
    const sel = screen.getByTestId('sel') as HTMLSelectElement
    const values = Array.from(sel.options).map(o => o.value)
    // Group sentinels expanded server-side by BookScopes.java
    expect(values).toContain('ALL')
    expect(values).toContain('PENTATEUCH')
    expect(values).toContain('GOSPELS')
    expect(values).toContain('EPISTLES')
    // Individual books (English canonical names matching Question.book)
    expect(values).toContain('Genesis')
    expect(values).toContain('Psalms')
    expect(values).toContain('Revelation')
  })

  it('groups books under OT/NT optgroups (39 + 27)', () => {
    renderInSelect()
    const sel = screen.getByTestId('sel') as HTMLSelectElement
    const groups = sel.querySelectorAll('optgroup')
    // groupHeading + otHeading + ntHeading
    expect(groups.length).toBe(3)
    const ot = Array.from(groups).find(g => g.label === 'createRoom.scope.otHeading')!
    const nt = Array.from(groups).find(g => g.label === 'createRoom.scope.ntHeading')!
    expect(ot.querySelectorAll('option').length).toBe(39)
    expect(nt.querySelectorAll('option').length).toBe(27)
  })
})
