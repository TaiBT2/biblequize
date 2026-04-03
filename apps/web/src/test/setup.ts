import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock react-helmet-async globally so PageMeta works without HelmetProvider in tests
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => children ?? null,
  HelmetProvider: ({ children }: { children?: React.ReactNode }) => children,
}))
