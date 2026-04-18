import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'

type Language = 'vi' | 'en'

interface RenderWithI18nOptions extends Omit<RenderOptions, 'wrapper'> {
  language?: Language
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

/**
 * Render UI wrapped in the same providers used by the app (QueryClient,
 * BrowserRouter, i18n) and force a specific language for the assertion.
 * Default language is 'vi' — matching the app fallback so existing Vietnamese
 * assertions keep working when they don't pass a `language`.
 */
export function renderWithI18n(
  ui: ReactElement,
  { language = 'vi', ...options }: RenderWithI18nOptions = {}
) {
  if (i18n.language !== language) {
    i18n.changeLanguage(language)
  }
  const queryClient = makeQueryClient()
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Look up a translation key against the i18n instance without mounting a
 * component — useful for asserting a specific label in a specific locale.
 */
export function useKey(key: string, language: Language = 'vi', options?: Record<string, unknown>): string {
  const previous = i18n.language
  if (previous !== language) {
    i18n.changeLanguage(language)
  }
  const value = i18n.t(key, options) as string
  if (previous !== language) {
    i18n.changeLanguage(previous)
  }
  return value
}

export * from '@testing-library/react'
