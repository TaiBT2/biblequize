import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock react-helmet-async globally so PageMeta works without HelmetProvider in tests
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => children ?? null,
  HelmetProvider: ({ children }: { children?: React.ReactNode }) => children,
}))

// Initialize i18n for tests — use actual translations. Init is now async
// (resources load as chunks); await readiness so every test renders with both
// languages present. Node supports top-level await, so this is safe here even
// though the browser bundle cannot use it.
import i18n, { i18nReady } from '../i18n'

await i18nReady

// Ensure Vietnamese is active for tests
i18n.changeLanguage('vi')
