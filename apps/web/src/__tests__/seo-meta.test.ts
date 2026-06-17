import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Guards static SEO surfaces shipped from apps/web: index.html <head>, robots.txt,
 * sitemap.xml, manifest.json. These are invisible to component tests (the SPA is
 * client-rendered) yet are exactly what crawlers read, so assert them directly.
 * vitest runs with cwd = apps/web.
 */
const readRoot = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf-8')
const indexHtml = () => readRoot('index.html')

describe('SEO: index.html language/locale correctness', () => {
  // Strip HTML comments — crawlers ignore them, and so should these assertions.
  const html = indexHtml().replace(/<!--[\s\S]*?-->/g, '')

  it('declares no Greek (el) locale — the app is vi + en only (C4)', () => {
    expect(html).not.toMatch(/hreflang="el"/)
    expect(html).not.toContain('el_GR')
    expect(html).not.toContain('forbible.org/el')
    expect(html).not.toMatch(/"inLanguage":\s*\[\s*"vi",\s*"el"\s*\]/)
  })

  it('declares English as the alternate locale', () => {
    expect(html).toContain('content="en_US"')
    expect(html).toMatch(/"inLanguage":\s*\[\s*"vi",\s*"en"\s*\]/)
  })

  it('does not emit a static <link rel="canonical"> (set per-page via PageMeta)', () => {
    // A site-wide static canonical would conflict with the per-page Helmet tag.
    expect(html).not.toMatch(/<link[^>]*rel="canonical"/)
  })

  it('og/twitter images point to the raster .png, not .svg', () => {
    expect(html).toContain('property="og:image" content="https://forbible.org/og-image.png"')
    expect(html).toContain('name="twitter:image" content="https://forbible.org/og-image.png"')
    expect(html).not.toContain('og-image.svg')
  })
})
