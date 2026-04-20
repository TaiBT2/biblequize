import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Help from '../Help'
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../../data/faqData'

/**
 * Tests for the /help FAQ page.
 *
 * Covers: render, accordion toggle, category filter, deep-link
 * anchor handling, content completeness (every FAQ_ITEMS entry has
 * a rendered question).
 */

function renderHelp(initialPath = '/help') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Help />
    </MemoryRouter>,
  )
}

describe('Help / FAQ page', () => {
  beforeEach(() => {
    // requestAnimationFrame used by deep-link scroll — stub to run synchronously
    // so tests don't have to await animation frames.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
  })

  it('renders title and subtitle', () => {
    renderHelp()
    expect(screen.getByText(/Câu hỏi thường gặp|Frequently Asked Questions/i)).toBeInTheDocument()
  })

  it('renders at least one item from every FAQ_ITEMS entry (questions loaded from i18n)', () => {
    renderHelp()
    // Every item should have its <button> rendered with the question text.
    for (const item of FAQ_ITEMS) {
      const el = screen.getByTestId(`faq-item-${item.id}`)
      expect(el).toBeInTheDocument()
    }
  })

  it('renders a section per category when "all" filter is active', () => {
    renderHelp()
    for (const cat of FAQ_CATEGORIES) {
      expect(screen.getByTestId(`faq-category-${cat}`)).toBeInTheDocument()
    }
  })

  it('clicking a question expands its answer (accordion)', async () => {
    renderHelp()
    const user = userEvent.setup()
    const first = FAQ_ITEMS[0]
    const item = screen.getByTestId(`faq-item-${first.id}`)
    expect(item.getAttribute('data-open')).toBe('false')

    const btn = item.querySelector('button')!
    await user.click(btn)
    expect(item.getAttribute('data-open')).toBe('true')
  })

  it('only one item open at a time', async () => {
    renderHelp()
    const user = userEvent.setup()
    const [a, b] = FAQ_ITEMS

    await user.click(screen.getByTestId(`faq-item-${a.id}`).querySelector('button')!)
    expect(screen.getByTestId(`faq-item-${a.id}`).getAttribute('data-open')).toBe('true')

    await user.click(screen.getByTestId(`faq-item-${b.id}`).querySelector('button')!)
    expect(screen.getByTestId(`faq-item-${a.id}`).getAttribute('data-open')).toBe('false')
    expect(screen.getByTestId(`faq-item-${b.id}`).getAttribute('data-open')).toBe('true')
  })

  it('clicking a category pill filters the list', async () => {
    renderHelp()
    const user = userEvent.setup()
    // Match on the 🎯 emoji prefix — it's unique to the tiers category
    // pill label (see i18n help.categories.tiers) and survives VI↔EN
    // switching. Plain /Hạng|Tiers/ collides with other buttons whose
    // accessible name embeds "Xếp Hạng" / "Tier" (FAQ answers, nav),
    // which throws "Found multiple elements…".
    const pill = screen.getByRole('button', { name: /🎯/ })
    await user.click(pill)
    // In single-category mode, category section headers are not rendered
    expect(screen.queryByTestId('faq-category-gettingStarted')).not.toBeInTheDocument()
    // But tier items are still visible
    expect(screen.getByTestId('faq-item-howUnlockRanked')).toBeInTheDocument()
  })

  it('deep link /help#howUnlockRanked auto-expands that item', async () => {
    renderHelp('/help#howUnlockRanked')
    const item = screen.getByTestId('faq-item-howUnlockRanked')
    expect(item.getAttribute('data-open')).toBe('true')
  })

  it('deep link to unknown id does not crash or expand anything', () => {
    renderHelp('/help#doesNotExist')
    for (const item of FAQ_ITEMS) {
      const el = screen.getByTestId(`faq-item-${item.id}`)
      expect(el.getAttribute('data-open')).toBe('false')
    }
  })

  it('renders a contact footer with mailto link', () => {
    renderHelp()
    const mailto = document.querySelector('a[href^="mailto:"]')
    expect(mailto).toBeTruthy()
  })
})
