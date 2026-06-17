import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import vi from './vi.json'
import en from './en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'quizLanguage',
      caches: ['localStorage'],
    },
  })

// Keep <html lang> in sync with the active language for SEO + a11y.
// index.html ships a static lang="vi"; English users must get lang="en".
const syncHtmlLang = (lng?: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = (lng || 'vi').split('-')[0]
  }
}
syncHtmlLang(i18n.language)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
