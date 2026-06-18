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

describe('Help page FAQPage structured data', () => {
  it('emits valid FAQPage JSON-LD matching the FAQ registry', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/help']}>
        <Help />
      </MemoryRouter>,
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    const data = JSON.parse(script!.textContent!)
    expect(data['@type']).toBe('FAQPage')
    expect(Array.isArray(data.mainEntity)).toBe(true)
    expect(data.mainEntity.length).toBeGreaterThanOrEqual(10)
    expect(data.mainEntity[0]['@type']).toBe('Question')
    expect(data.mainEntity[0].name).toBeTruthy()
    expect(data.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
    expect(data.mainEntity[0].acceptedAnswer.text).toBeTruthy()
  })
})
