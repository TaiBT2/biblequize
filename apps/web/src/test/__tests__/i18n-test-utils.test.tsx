import { describe, it, expect } from 'vitest'
import { renderWithI18n, useKey, screen } from '../i18n-test-utils'

describe('renderWithI18n helper smoke', () => {
  it('useKey returns Vietnamese by default', () => {
    expect(useKey('header.nav.home')).toBe('Trang chủ')
  })
  it('useKey returns English when lang=en', () => {
    expect(useKey('header.nav.home', 'en')).toBe('Home')
  })
  it('interpolates count into time string', () => {
    expect(useKey('header.time.minutesAgo', 'vi', { count: 5 })).toBe('5 phút trước')
  })
  it('renderWithI18n renders plain React and wraps providers', () => {
    renderWithI18n(<div>hello-i18n</div>)
    expect(screen.getByText('hello-i18n')).toBeInTheDocument()
  })
})
