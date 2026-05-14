import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

interface BookProgress {
  book: string
  bookVi: string
  order: number
  testament: 'OLD' | 'NEW'
  totalQuestions: number
  masteredQuestions: number
  masteryPercent: number
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED'
}

interface JourneyData {
  summary: {
    totalBooks: number
    completedBooks: number
    inProgressBooks: number
    lockedBooks: number
    overallMasteryPercent: number
    oldTestamentCompleted: number
    newTestamentCompleted: number
    currentBook: string | null
  }
  books?: BookProgress[]
}

const VISIBLE_CHIPS = 6

/**
 * Bible Journey card — Modern Spiritual rendering of mockup `.journey`
 * (home_modern.html). Glass card with title + meta + sub line + a
 * horizontal-scroll row of book chips. Current chip uses the gold
 * highlight treatment, locked chips show a lock icon. Overflow chip
 * "+ N sách" represents the remaining books beyond the visible window.
 *
 * The whole card links to /journey for the deeper view.
 */
export default function BibleJourneyCard() {
  const { t, i18n } = useTranslation()

  const { data } = useQuery<JourneyData>({
    queryKey: ['journey-summary', i18n.language],
    queryFn: async () => (await api.get(`/api/me/journey?language=${i18n.language}`)).data,
    staleTime: 60_000,
  })

  if (!data) return null

  const summary = data.summary
  const books = data.books ?? []
  const totalDone = summary.completedBooks
  const total = summary.totalBooks || 66

  const currentBookEntry = books.find(b => b.book === summary.currentBook)
  const isVi = i18n.language !== 'en'
  const localizedBookName = (b: BookProgress | undefined) =>
    !b ? '' : isVi ? b.bookVi || b.book : b.book || b.bookVi
  const currentLabel = localizedBookName(currentBookEntry) || summary.currentBook || ''

  // First N chips by canonical order; final overflow chip wraps the rest.
  const visible = books.slice(0, VISIBLE_CHIPS)
  const remaining = Math.max(0, books.length - VISIBLE_CHIPS)

  return (
    <Link
      to="/journey"
      data-testid="bible-journey-card"
      className="relative block rounded-[18px] border border-[rgba(245,240,230,0.06)] backdrop-blur-[12px] p-5 md:p-6 hover:border-[rgba(232,168,50,0.2)] transition-colors overflow-hidden"
      style={{ background: 'rgba(24,26,36,0.55)' }}
    >
      {/* Top-right gold radial glow */}
      <span
        aria-hidden
        className="absolute -top-1/2 -right-[10%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,168,50,0.07), transparent 65%)' }}
      />

      <div className="relative">
        <div className="flex items-baseline justify-between gap-3 mb-1.5 flex-wrap">
          <h3
            data-testid="bible-journey-title"
            className="flex items-center gap-3 text-[16px] md:text-[18px] font-bold text-ivory tracking-[-0.015em]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e8a832"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M9 5l-6 2v14l6-2 6 2 6-2V5l-6 2-6-2z" />
              <path d="M9 5v14M15 7v14" />
            </svg>
            {t('home.journey.title')}
          </h3>
          <div data-testid="bible-journey-meta" className="text-[13px] text-ivory-dim font-medium">
            <span className="text-secondary font-extrabold text-[16px] tabular-nums">
              {totalDone}
            </span>{' '}
            {t('home.journeyExtra.metaCountSuffix', { total })}
            {currentLabel && (
              <>
                {' · '}
                <em
                  data-testid="bible-journey-current"
                  className="not-italic"
                >{t('home.journeyExtra.metaCurrent', { book: currentLabel })}</em>
              </>
            )}
          </div>
        </div>

        <p
          data-testid="bible-journey-sub"
          className="text-[12px] text-ivory-dim mb-4"
        >
          {t('home.journeyExtra.subUnlock')}
        </p>

        {/* Horizontal-scroll book chips */}
        <div
          data-testid="bible-journey-chips"
          className="flex gap-2.5 overflow-x-auto pb-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-[5px] [&::-webkit-scrollbar-thumb]:bg-[rgba(232,168,50,0.15)] [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {visible.map(b => (
            <BookChip key={b.book} book={b} isVi={isVi} />
          ))}
          {remaining > 0 && (
            <div
              data-testid="bible-journey-overflow"
              className="shrink-0 min-w-[138px] rounded-xl px-3.5 py-3 opacity-45 cursor-not-allowed"
              style={{
                background: 'rgba(245,240,230,0.025)',
                border: '1px solid rgba(245,240,230,0.06)',
              }}
            >
              <div className="text-[9px] uppercase tracking-[0.14em] text-ivory-faint font-bold">
                …
              </div>
              <div className="text-[13px] font-bold text-ivory mt-1 leading-tight tracking-[-0.01em]">
                {t('home.journeyExtra.overflowLabel', { remaining })}
              </div>
              <div className="text-[11px] text-ivory-faint mt-2 font-medium">
                {t('home.journeyExtra.overflowSub')}
              </div>
              <div className="mt-2 h-[3px] rounded-full bg-[rgba(245,240,230,0.05)]" />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function BookChip({ book, isVi }: { book: BookProgress; isVi: boolean }) {
  const { t } = useTranslation()
  const displayName = isVi ? (book.bookVi || book.book) : (book.book || book.bookVi)
  const isCurrent = book.status === 'IN_PROGRESS'
  const isLocked = book.status === 'LOCKED'
  const isDone = book.status === 'COMPLETED'

  const testamentName = t(
    book.testament === 'OLD'
      ? 'home.journeyExtra.testamentOld'
      : 'home.journeyExtra.testamentNew'
  )
  const orderLabel = `${testamentName} · ${String(book.order).padStart(2, '0')}`

  const pct = Math.round(book.masteryPercent)
  const status = isCurrent
    ? (t('home.journeyExtra.statusInProgress', { pct }) as string)
    : isDone
      ? (t('home.journeyExtra.statusDone', { pct }) as string)
      : (t('home.journeyExtra.statusLocked') as string)

  const fillPct = Math.max(0, Math.min(100, book.masteryPercent))

  return (
    <div
      data-testid={`bible-journey-chip-${book.book}`}
      data-status={book.status}
      className={`shrink-0 min-w-[138px] rounded-xl px-3.5 py-3 transition-colors ${
        isLocked ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer hover:bg-[rgba(245,240,230,0.05)]'
      }`}
      style={
        isCurrent
          ? {
              background:
                'radial-gradient(ellipse 200px 80px at 50% 0%, rgba(232,168,50,0.18), transparent 70%), rgba(232,168,50,0.05)',
              border: '1px solid rgba(232,168,50,0.45)',
              boxShadow:
                '0 0 24px rgba(232,168,50,0.18), inset 0 1px 0 rgba(232,168,50,0.2)',
            }
          : {
              background: 'rgba(245,240,230,0.025)',
              border: '1px solid rgba(245,240,230,0.06)',
            }
      }
    >
      <div
        className={`text-[9px] uppercase tracking-[0.14em] font-bold ${
          isCurrent ? 'text-gold-deep' : 'text-ivory-faint'
        }`}
      >
        {isCurrent ? orderLabel : String(book.order).padStart(2, '0')}
      </div>
      <div
        className={`text-[13px] font-bold mt-1 leading-tight tracking-[-0.01em] flex items-center gap-1.5 ${
          isCurrent ? 'text-[#f5e3a8]' : 'text-ivory'
        }`}
      >
        {isLocked ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 018 0v4" />
          </svg>
        ) : isDone ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-sage"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0"
          >
            <path d="M4 5v15a2 2 0 002 2h14V3H6a2 2 0 00-2 2z" />
          </svg>
        )}
        {displayName}
      </div>
      <div
        className={`text-[11px] mt-2 font-medium ${
          isCurrent ? 'text-tertiary' : 'text-ivory-faint'
        }`}
      >
        {status}
      </div>
      <div className="mt-2 h-[3px] rounded-full overflow-hidden bg-[rgba(245,240,230,0.05)]">
        {(isCurrent || isDone) && fillPct > 0 && (
          <div
            data-testid={`bible-journey-chip-fill-${book.book}`}
            className="h-full rounded-full"
            style={{
              width: `${fillPct}%`,
              background: 'linear-gradient(90deg, #c98a1c, #e8a832, #e7c268)',
              boxShadow: '0 0 6px rgba(232,168,50,0.6)',
            }}
          />
        )}
      </div>
    </div>
  )
}
