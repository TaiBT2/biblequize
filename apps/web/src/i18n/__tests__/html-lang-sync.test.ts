import { describe, it, expect, afterEach } from 'vitest'
import i18n from '../index'

// Restore the default test language so sibling tests keep seeing Vietnamese.
afterEach(async () => {
  await i18n.changeLanguage('vi')
})

describe('i18n: <html lang> sync', () => {
  it('updates document.documentElement.lang on language change', async () => {
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')
    await i18n.changeLanguage('vi')
    expect(document.documentElement.lang).toBe('vi')
  })

  it('strips region subtags (en-US → en)', async () => {
    await i18n.changeLanguage('en-US')
    expect(document.documentElement.lang).toBe('en')
  })
})
