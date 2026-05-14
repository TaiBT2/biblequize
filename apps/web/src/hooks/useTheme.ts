import { useCallback, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'bq-theme'

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  // Default = dark (vintage Home default). Match the FOUC-prevention
  // script in index.html which also defaults to dark unless storage
  // explicitly says "light". prefers-color-scheme intentionally NOT
  // consulted — vintage design is dark-first; opt-in to light only
  // via explicit user toggle.
  return 'dark'
}

/**
 * HRV-26 theme hook — flips `html[data-theme]` between "dark" (default)
 * and "light". Drives the vintage CSS-var palette swap defined in
 * `global.css` :root vs html[data-theme="light"]. Independent from
 * Tailwind's `darkMode: "class"` mechanism (which uses `html.dark`) so
 * other parts of the app that rely on `dark:` Tailwind variants stay
 * unaffected — only the vintage tokens (bg-deep / ruby / ivory / etc.)
 * actually swap. localStorage `bq-theme` persists user preference.
 */
export function useTheme(): {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
} {
  const [theme, setThemeState] = useState<Theme>(readInitial)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage unavailable (private mode, etc.) — ignore silently
    }
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const toggle = useCallback(
    () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark')),
    [],
  )

  return { theme, setTheme, toggle }
}
