import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

type Lng = 'vi' | 'en'

// Per-language loaders → each JSON becomes its own lazy chunk. Only the active
// language (+ the 'vi' fallback) is fetched on first load; the other loads on
// demand when the user switches. This keeps ~135 kB of the inactive language
// out of the initial payload for the Vietnamese-majority audience.
const loaders: Record<Lng, () => Promise<{ default: Record<string, unknown> }>> = {
  vi: () => import('./vi.json'),
  en: () => import('./en.json'),
}

// Mirror the detector order (localStorage 'quizLanguage' → navigator) so we
// know which chunk to fetch BEFORE init — init needs its resources ready, and
// pre-loading avoids any flash of raw translation keys.
function detectInitial(): Lng {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('quizLanguage') : null
    if (stored === 'vi' || stored === 'en') return stored
  } catch { /* localStorage may be blocked (private mode) */ }
  const nav = typeof navigator !== 'undefined' ? navigator.language : ''
  return nav.toLowerCase().startsWith('en') ? 'en' : 'vi'
}

async function loadBundle(lng: Lng): Promise<void> {
  if (i18n.hasResourceBundle(lng, 'translation')) return
  const res = await loaders[lng]()
  i18n.addResourceBundle(lng, 'translation', res.default, true, true)
}

const initial = detectInitial()

// Which languages to bundle at startup. Tests render synchronously and assert
// on translated text in BOTH languages, so load everything there. The MODE
// check is statically replaced at build time → the test branch (and its eager
// 'en' import) is tree-shaken out of the production bundle.
const startupLangs: Lng[] =
  import.meta.env.MODE === 'test'
    ? ['vi', 'en']
    : Array.from(new Set<Lng>([initial, 'vi'])) // always include the 'vi' fallback

// Keep <html lang> in sync with the active language for SEO + a11y.
// index.html ships a static lang="vi"; English users must get lang="en".
const syncHtmlLang = (lng?: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = (lng || 'vi').split('-')[0]
  }
}

// Init is async (resources are fetched as chunks), so we can't use top-level
// await (the es2020 build target forbids it). Callers that must render with
// translations ready — main.tsx and the test setup — await `i18nReady` first.
export const i18nReady: Promise<typeof i18n> = (async () => {
  const resources: Record<string, { translation: Record<string, unknown> }> = {}
  const loaded = await Promise.all(startupLangs.map(l => loaders[l]()))
  startupLangs.forEach((l, i) => { resources[l] = { translation: loaded[i].default } })

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: initial,
      fallbackLng: 'vi',
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'quizLanguage',
        caches: ['localStorage'],
      },
    })

  // Lazy-load the target bundle before switching, so every existing
  // i18n.changeLanguage(l) call keeps working unchanged (no flash of raw keys).
  // IMPORTANT: when the bundle is already present (always true in tests, and
  // for the active/fallback langs), defer to the native method directly so the
  // switch still applies synchronously — callers and tests rely on that.
  const nativeChangeLanguage = i18n.changeLanguage.bind(i18n)
  i18n.changeLanguage = ((lng?: string, ...rest: unknown[]) => {
    const native = nativeChangeLanguage as (...a: unknown[]) => Promise<unknown>
    if ((lng === 'vi' || lng === 'en') && !i18n.hasResourceBundle(lng, 'translation')) {
      return loadBundle(lng).then(() => native(lng, ...rest))
    }
    return native(lng, ...rest)
  }) as typeof i18n.changeLanguage

  syncHtmlLang(i18n.language)
  i18n.on('languageChanged', syncHtmlLang)

  return i18n
})()

export default i18n
