import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain .mjs build helper, no types
import { staticDefaults, dedupeHead } from '../../scripts/seo-dedupe.mjs'

/**
 * Guards the prerender head-dedupe: React 19 hoists PageMeta tags next to the
 * static index.html defaults, so the prerendered output must collapse to one
 * per-page title/og and exactly one correct canonical.
 */
const SHELL = `<!doctype html><html><head>
  <title>BibleQuiz Default</title>
  <meta property="og:title" content="BibleQuiz Default" />
  <meta name="description" content="Default description" />
</head><body></body></html>`

describe('prerender dedupeHead', () => {
  const defaults = staticDefaults(SHELL)

  it('keeps the per-page title/og over the static default', () => {
    const rendered = `<!doctype html><html><head>
      <title>Per Page Title</title>
      <title>BibleQuiz Default</title>
      <meta property="og:title" content="BibleQuiz Default" />
      <meta property="og:title" content="Per Page Title" />
    </head><body><div id="root">content</div></body></html>`
    const out = dedupeHead(rendered, defaults, 'https://forbible.org/privacy')
    const titles = [...out.matchAll(/<title[^>]*>([^<]*)<\/title>/g)].map((m) => m[1])
    const ogTitles = [...out.matchAll(/property="og:title" content="([^"]*)"/g)].map((m) => m[1])
    expect(titles).toEqual(['Per Page Title'])
    expect(ogTitles).toEqual(['Per Page Title'])
  })

  it('forces exactly one canonical with the route href, dropping empties/wrong ones', () => {
    const rendered = `<!doctype html><html><head>
      <link rel="canonical" />
      <link rel="canonical" href="https://forbible.org/wrong" />
    </head><body><div id="root">x</div></body></html>`
    const out = dedupeHead(rendered, defaults, 'https://forbible.org/privacy')
    const canon = [...out.matchAll(/<link[^>]*rel="canonical"[^>]*>/g)]
    expect(canon).toHaveLength(1)
    expect(out).toContain('href="https://forbible.org/privacy"')
    expect(out).not.toContain('/wrong')
  })

  it('leaves JSON-LD and other head tags untouched', () => {
    const rendered = `<!doctype html><html><head>
      <title>BibleQuiz Default</title>
      <script type="application/ld+json">{"@type":"WebSite"}</script>
      <link rel="icon" href="/favicon.svg" />
    </head><body><div id="root">x</div></body></html>`
    const out = dedupeHead(rendered, defaults, 'https://forbible.org/')
    expect(out).toContain('application/ld+json')
    expect(out).toContain('rel="icon"')
  })
})
