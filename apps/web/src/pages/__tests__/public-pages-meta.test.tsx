import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PrivacyPolicy from '../PrivacyPolicy'
import TermsOfService from '../TermsOfService'
import Help from '../Help'

/**
 * These public, crawlable pages must each set their own canonical via PageMeta
 * (prerender bakes this into the static HTML). react-helmet-async is mocked to
 * render inline; React 19 hoists the <link> into <head>.
 */
const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')

describe('public pages set a per-page canonical', () => {
  it.each([
    ['/privacy', PrivacyPolicy],
    ['/terms', TermsOfService],
    ['/help', Help],
  ])('%s emits its own canonical link', (path, Page) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Page />
      </MemoryRouter>,
    )
    expect(canonical()).toBe(`https://forbible.org${path}`)
  })
})
