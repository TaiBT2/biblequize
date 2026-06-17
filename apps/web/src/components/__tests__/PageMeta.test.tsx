import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import PageMeta from '../PageMeta'

/**
 * react-helmet-async is globally mocked in src/test/setup.ts to render its
 * children inline, so the emitted <title>/<meta>/<link> land in the container
 * and can be asserted directly.
 */
const content = (c: HTMLElement, sel: string) => c.querySelector(sel)?.getAttribute('content')

describe('PageMeta', () => {
  it('emits the full OG + Twitter card set, canonical and og:url', () => {
    const { container } = render(
      <PageMeta title="Thử Thách" description="Mô tả trang" canonicalPath="/daily" />,
    )
    expect(container.querySelector('title')?.textContent).toBe('Thử Thách — BibleQuiz')

    expect(content(container, 'meta[property="og:type"]')).toBe('website')
    expect(content(container, 'meta[property="og:title"]')).toBe('Thử Thách — BibleQuiz')
    expect(content(container, 'meta[property="og:description"]')).toBe('Mô tả trang')
    expect(content(container, 'meta[property="og:url"]')).toBe('https://forbible.org/daily')
    expect(content(container, 'meta[property="og:image"]')).toBe('https://forbible.org/og-image.png')

    expect(content(container, 'meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(content(container, 'meta[name="twitter:title"]')).toBe('Thử Thách — BibleQuiz')
    expect(content(container, 'meta[name="twitter:description"]')).toBe('Mô tả trang')
    expect(content(container, 'meta[name="twitter:image"]')).toBe('https://forbible.org/og-image.png')

    expect(container.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://forbible.org/daily',
    )
  })

  it('honours an ogImage override and omits canonical/og:url when no path', () => {
    const { container } = render(
      <PageMeta title="X" ogImage="https://forbible.org/custom.png" />,
    )
    expect(content(container, 'meta[property="og:image"]')).toBe('https://forbible.org/custom.png')
    expect(content(container, 'meta[name="twitter:image"]')).toBe('https://forbible.org/custom.png')
    expect(container.querySelector('link[rel="canonical"]')).toBeNull()
    expect(container.querySelector('meta[property="og:url"]')).toBeNull()
  })
})
