import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Routing layout invariant test.
 *
 * Asserts that pages with "navigation chrome" requirements (header + sidebar +
 * bottom nav on mobile) are declared INSIDE the <Route element={<AppLayout />}>
 * block in main.tsx, and that full-screen / auth / gameplay pages are declared
 * OUTSIDE that block.
 *
 * This guards against regressions like: a lobby/content page being accidentally
 * put in the full-screen branch, leaving the user with no way to navigate
 * (no header, no sidebar) — the exact bug that motivated this test.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const mainTsxPath = resolve(__dirname, '..', 'main.tsx')
const mainTsx = readFileSync(mainTsxPath, 'utf-8')

/** Extract text between `<Route element={<AppLayout />}>` and its matching `</Route>`.
 *  Assumes children are self-closing `<Route path="..." ... />` (current convention). */
function extractAppLayoutBlock(src: string): string {
  const openMarker = '<Route element={<AppLayout />}>'
  const start = src.indexOf(openMarker)
  if (start === -1) throw new Error('AppLayout route wrapper not found in main.tsx')
  const after = src.slice(start + openMarker.length)
  const end = after.indexOf('</Route>')
  if (end === -1) throw new Error('Closing </Route> for AppLayout wrapper not found')
  return after.slice(0, end)
}

describe('main.tsx routing layout structure', () => {
  const appLayoutBlock = extractAppLayoutBlock(mainTsx)

  /** Pages that MUST live inside AppLayout — user needs nav/header/sidebar to get around. */
  const INSIDE_APP_LAYOUT: string[] = [
    // Pre-existing
    '/leaderboard',
    '/profile',
    '/groups',
    '/groups/:id',
    '/groups/:id/analytics',
    '/tournaments',
    '/tournaments/:id',
    '/tournaments/:id/match/:matchId',
    '/achievements',
    '/journey',
    '/cosmetics',
    '/weekly-quiz',
    '/mystery-mode',
    '/speed-round',
    '/ranked',
    '/daily',
    // Moved into AppLayout by this fix
    '/practice',
    '/review',
    '/multiplayer',
    '/rooms',
    '/room/create',
    '/room/join',
    // FAQ / help center
    '/help',
  ]

  /** Pages that MUST stay full-screen — immersive gameplay / auth / marketing. */
  const OUTSIDE_APP_LAYOUT: string[] = [
    '/landing',
    '/login',
    '/register',
    '/auth/callback',
    '/quiz',
    '/room/:roomId/lobby',
    '/room/:roomId/quiz',
  ]

  describe('pages rendered inside AppLayout (have header + sidebar + bottom nav)', () => {
    it.each(INSIDE_APP_LAYOUT)('route %s is declared inside <Route element={<AppLayout />}>', (p) => {
      expect(appLayoutBlock).toContain(`path="${p}"`)
    })
  })

  describe('pages rendered full-screen (no AppLayout chrome)', () => {
    it.each(OUTSIDE_APP_LAYOUT)('route %s is NOT inside AppLayout block', (p) => {
      expect(appLayoutBlock).not.toContain(`path="${p}"`)
    })

    it.each(OUTSIDE_APP_LAYOUT)('route %s still exists somewhere in main.tsx', (p) => {
      expect(mainTsx).toContain(`path="${p}"`)
    })
  })

  describe('regression guards', () => {
    it('Multiplayer page is routed through AppLayout (so user has nav back to Home)', () => {
      expect(appLayoutBlock).toContain('path="/multiplayer"')
      expect(appLayoutBlock).toContain('<Multiplayer')
    })

    it('Practice page is routed through AppLayout (so user has sidebar + header)', () => {
      expect(appLayoutBlock).toContain('path="/practice"')
      expect(appLayoutBlock).toContain('<Practice')
    })

    it('CreateRoom page is routed through AppLayout', () => {
      expect(appLayoutBlock).toContain('path="/room/create"')
      expect(appLayoutBlock).toContain('<CreateRoom')
    })

    it('Review page is routed through AppLayout (so user has nav to go back Home)', () => {
      expect(appLayoutBlock).toContain('path="/review"')
      expect(appLayoutBlock).toContain('<Review')
    })

    it('Quiz gameplay page stays full-screen (immersive)', () => {
      expect(appLayoutBlock).not.toContain('path="/quiz"')
    })

    it('RoomQuiz gameplay page stays full-screen (immersive)', () => {
      expect(appLayoutBlock).not.toContain('path="/room/:roomId/quiz"')
    })
  })
})

/**
 * Layout-wrapper cleanup invariants.
 *
 * When a page is routed through AppLayout, it must NOT duplicate layout
 * concerns that AppLayout already provides — specifically:
 *   - max-w-7xl mx-auto (AppLayout wraps <Outlet/> in this)
 *   - min-h-screen + bg-[#11131e] (AppLayout sets these at the root)
 *
 * Duplicating them either has no visual effect (redundant) or causes
 * visible regressions (CreateRoom's `min-h-screen flex items-start
 * justify-center` stacking inside AppLayout's own min-h-screen).
 */

const pagesDir = resolve(__dirname, '..', 'pages')

function readPage(filename: string): string {
  return readFileSync(resolve(pagesDir, filename), 'utf-8')
}

/** Find the JSX element that has a given data-testid — return the opening tag text. */
function findRootTagByTestId(source: string, testId: string): string | null {
  const idx = source.indexOf(`data-testid="${testId}"`)
  if (idx === -1) return null
  const before = source.lastIndexOf('<', idx)
  const after = source.indexOf('>', idx)
  if (before === -1 || after === -1) return null
  return source.slice(before, after + 1)
}

describe('Pages inside AppLayout do not duplicate layout wrappers', () => {
  it('Multiplayer root wrapper does not include max-w-7xl (AppLayout provides it)', () => {
    const src = readPage('Multiplayer.tsx')
    const tag = findRootTagByTestId(src, 'multiplayer-page')
    expect(tag).not.toBeNull()
    expect(tag).not.toContain('max-w-7xl')
    expect(tag).not.toContain('min-h-screen')
  })

  it('Practice root wrapper does not include max-w-7xl (AppLayout provides it)', () => {
    const src = readPage('Practice.tsx')
    const tag = findRootTagByTestId(src, 'practice-page')
    expect(tag).not.toBeNull()
    expect(tag).not.toContain('max-w-7xl')
    expect(tag).not.toContain('min-h-screen')
  })

  it('CreateRoom root wrapper does not include min-h-screen or page-level background', () => {
    const src = readPage('CreateRoom.tsx')
    const tag = findRootTagByTestId(src, 'create-room-page')
    expect(tag).not.toBeNull()
    expect(tag).not.toContain('min-h-screen')
    expect(tag).not.toContain('bg-[#11131e]')
  })

  it('Review root wrapper does not include min-h-screen or page-level background', () => {
    const src = readPage('Review.tsx')
    const tag = findRootTagByTestId(src, 'review-page')
    expect(tag).not.toBeNull()
    expect(tag).not.toContain('min-h-screen')
    expect(tag).not.toContain('bg-[#11131e]')
  })
})
