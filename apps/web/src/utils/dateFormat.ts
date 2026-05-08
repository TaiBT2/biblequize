import i18n from '../i18n'

/**
 * Safe relative-time formatter using the browser-native
 * `Intl.RelativeTimeFormat`. Returns `''` for any input that does
 * not produce a valid `Date` so the caller never renders the
 * "NaN ngày trước" bug seen in the notification panel.
 *
 * Locale tracks the active i18n language: vi → "5 phút trước",
 * en → "5 minutes ago". No date-fns dependency.
 */
export function formatRelativeTime(input: string | number | Date | null | undefined): string {
  if (input == null || input === '') return ''

  const date = input instanceof Date ? input : new Date(input)
  const ms = date.getTime()
  if (Number.isNaN(ms)) return ''

  const locale = i18n.language?.startsWith('en') ? 'en' : 'vi'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  const diffSec = Math.round((ms - Date.now()) / 1000)
  const abs = Math.abs(diffSec)

  if (abs < 60) return rtf.format(diffSec, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 2_592_000) return rtf.format(Math.round(diffSec / 86_400), 'day')
  if (abs < 31_536_000) return rtf.format(Math.round(diffSec / 2_592_000), 'month')
  return rtf.format(Math.round(diffSec / 31_536_000), 'year')
}
