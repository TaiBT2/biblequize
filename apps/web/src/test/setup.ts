import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock react-helmet-async globally so PageMeta works without HelmetProvider in tests
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => children ?? null,
  HelmetProvider: ({ children }: { children?: React.ReactNode }) => children,
}))

// Initialize i18n for tests — use actual translations
import i18n from '../i18n'

// Ensure Vietnamese is active for tests
i18n.changeLanguage('vi')
