// MBV-4 — shared <option> list for the multiplayer book-scope <select>, used by
// both CreateRoom and the Quick Match modal so the choices stay in sync.
// Offers themed groups (sentinel values expanded server-side by BookScopes.java)
// plus every individual book. Book option values are the English canonical name
// (matching Question.book); the label is localized via useBookName.
import { useTranslation } from 'react-i18next'
import { useBookName } from '../../hooks/useBookName'
import { BIBLE_BOOKS_EN } from '../../data/bibleData'

export const BOOK_GROUP_SCOPES = [
  { value: 'ALL',           labelKey: 'createRoom.scope.all' },
  { value: 'OLD_TESTAMENT', labelKey: 'createRoom.scope.oldTestament' },
  { value: 'NEW_TESTAMENT', labelKey: 'createRoom.scope.newTestament' },
  { value: 'PENTATEUCH',    labelKey: 'createRoom.scope.pentateuch' },
  { value: 'HISTORY',       labelKey: 'createRoom.scope.history' },
  { value: 'WISDOM',        labelKey: 'createRoom.scope.wisdom' },
  { value: 'PROPHETS',      labelKey: 'createRoom.scope.prophets' },
  { value: 'GOSPELS',       labelKey: 'createRoom.scope.gospels' },
  { value: 'EPISTLES',      labelKey: 'createRoom.scope.epistles' },
] as const

// Canonical split: first 39 = Old Testament, remaining 27 = New Testament.
const OT_BOOKS = BIBLE_BOOKS_EN.slice(0, 39)
const NT_BOOKS = BIBLE_BOOKS_EN.slice(39)

/**
 * Resolve a bookScope value (group sentinel or English book name) to its display
 * label — for previews/summaries. Group → localized group label; book → localized
 * book name.
 */
export function useBookScopeLabel() {
  const { t, i18n } = useTranslation()
  const getBookName = useBookName()
  const lang = i18n.language === 'en' ? 'en' : 'vi'
  return (value: string): string => {
    const group = BOOK_GROUP_SCOPES.find(g => g.value === value)
    return group ? t(group.labelKey) : getBookName(value, lang)
  }
}

/** Renders <optgroup>s for direct use inside a <select>. */
export default function BookScopeOptions() {
  const { t, i18n } = useTranslation()
  const getBookName = useBookName()
  const lang = i18n.language === 'en' ? 'en' : 'vi'
  return (
    <>
      <optgroup label={t('createRoom.scope.groupHeading')}>
        {BOOK_GROUP_SCOPES.map(g => <option key={g.value} value={g.value}>{t(g.labelKey)}</option>)}
      </optgroup>
      <optgroup label={t('createRoom.scope.otHeading')}>
        {OT_BOOKS.map(b => <option key={b} value={b}>{getBookName(b, lang)}</option>)}
      </optgroup>
      <optgroup label={t('createRoom.scope.ntHeading')}>
        {NT_BOOKS.map(b => <option key={b} value={b}>{getBookName(b, lang)}</option>)}
      </optgroup>
    </>
  )
}
