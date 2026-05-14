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
      className="relative block rounded-[20px] border border-line bg-bg-deep shadow-chunky-soft p-5 md:p-6 transition-transform hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Vintage gold radial glow (bottom-left) — matches vintage
          .journey radial-gradient(ellipse 600px 200px at 20% 100%) */}
      <span
        aria-hidden
        className="absolute -bottom-1/3 -left-[10%] w-[420px] h-[280px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(244,209,120,0.12), transparent 70%)' }}
      />

      <div className="relative">
        <div className="flex items-baseline justify-between gap-3 mb-1.5 flex-wrap">
          <h3
            data-testid="bible-journey-title"
            className="flex items-center gap-3 font-display text-[20px] md:text-[24px] text-ivory tracking-[-0.015em]"
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
          <div data-testid="bible-journey-meta" className="font-numeric text-[12px] md:text-[13px] text-ivory-dim font-medium">
            <span className="text-gold-bright font-bold text-[14px] md:text-[16px] tabular-nums">
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

        {/* HRV-21: vintage horizontal-scroll path with circular seal-disk
            stations. SVG dashed curving path sits BEHIND the row, at the
            vertical center of the disks (top:36px, disks are 72px tall).
            Stations are 140px wide each, centered text below disk. */}
        <div
          data-testid="bible-journey-chips"
          className="relative overflow-x-auto pb-2 pt-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-[5px] [&::-webkit-scrollbar-thumb]:bg-[rgba(232,168,50,0.15)] [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <svg
            aria-hidden
            data-testid="bible-journey-path"
            className="absolute left-0 right-0 top-[40px] w-full h-[40px] pointer-events-none text-line"
            preserveAspectRatio="none"
            viewBox="0 0 1200 80"
          >
            <path
              d="M 40 40 Q 140 0, 240 40 T 440 40 T 640 40 T 840 40 T 1040 40 T 1240 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="2 8"
            />
          </svg>
          <div className="relative flex gap-3.5 md:gap-5 min-w-max px-1">
            {visible.map(b => (
              <BookStation key={b.book} book={b} isVi={isVi} />
            ))}
            {remaining > 0 && (
              <div
                data-testid="bible-journey-overflow"
                className="shrink-0 w-[140px] flex flex-col items-center gap-2 text-center opacity-50 cursor-not-allowed"
              >
                <div className="w-[72px] h-[72px] rounded-full grid place-items-center border-2 border-line bg-[rgba(17,12,24,0.6)] font-display text-[20px] text-ivory-faint">
                  +{remaining}
                </div>
                <div className="text-[10px] tracking-[0.22em] uppercase font-numeric text-ivory-faint">
                  …
                </div>
                <div className="font-display text-[14px] text-ivory-faint leading-tight">
                  {t('home.journeyExtra.overflowLabel', { remaining })}
                </div>
                <div className="text-[11px] text-ivory-faint font-medium">
                  {t('home.journeyExtra.overflowSub')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/**
 * HRV-21 BookStation — vintage circular seal-disk station replacing the
 * rectangular chip. Per vintage Home.html `.station` recipe: 72px gold/
 * emerald/dim seal disk on top, then JetBrains Mono testament+order
 * label, then Yeseva One book name, then status text. SVG dashed path
 * (parent) curves behind the row of disks to suggest a journey route.
 *
 * data-testid `bible-journey-chip-{book}` + `bible-journey-chip-fill-{book}`
 * are preserved for test contract compatibility — the visual layout
 * changed but the structural identifiers haven't.
 */
function BookStation({ book, isVi }: { book: BookProgress; isVi: boolean }) {
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
      className={`shrink-0 w-[140px] flex flex-col items-center gap-2 text-center transition-transform ${
        isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
      }`}
    >
      {/* Seal disk — 72px circular; current state gets the journey-pulse
          gold halo animation. Done = emerald gradient with check. Locked
          = dim with lock icon. Default = dim numbered. */}
      <div
        className={`relative w-[72px] h-[72px] rounded-full grid place-items-center border-2 font-display text-[20px] z-10 ${
          isCurrent ? 'animate-journey-pulse' : ''
        }`}
        style={
          isCurrent
            ? {
                background:
                  'radial-gradient(circle at 30% 30%, #f4d178, #c98a1c 70%, #7a5818)',
                borderColor: '#f4d178',
                color: '#1a1019',
              }
            : isDone
              ? {
                  background: 'linear-gradient(180deg, #4fa876, #2f6e4d)',
                  borderColor: '#4fa876',
                  color: '#fff',
                }
              : {
                  background: 'rgba(17,12,24,0.7)',
                  borderColor: '#2e2238',
                  color: '#4f4658',
                }
        }
      >
        {isLocked ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 018 0v4" />
          </svg>
        ) : isDone ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          String(book.order).padStart(2, '0')
        )}
      </div>
      <div className={`font-numeric text-[10px] tracking-[0.20em] uppercase ${isCurrent ? 'text-gold-bright' : 'text-ivory-faint'}`}>
        {orderLabel}
      </div>
      <div className={`font-display text-[15px] leading-tight ${isLocked ? 'text-ivory-faint' : 'text-ivory'}`}>
        {displayName}
      </div>
      <div className={`text-[11px] font-medium ${isCurrent ? 'text-gold-bright' : 'text-ivory-faint'}`}>
        {status}
      </div>
      {(isCurrent || isDone) && fillPct > 0 && (
        <div
          data-testid={`bible-journey-chip-fill-${book.book}`}
          className="h-[3px] rounded-full"
          style={{
            width: `${fillPct}%`,
            background: 'linear-gradient(90deg, #c98a1c, #e8a832, #e7c268)',
            boxShadow: '0 0 6px rgba(232,168,50,0.6)',
          }}
        />
      )}
    </div>
  )
}
