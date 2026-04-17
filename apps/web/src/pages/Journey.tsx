import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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

interface JourneySummary {
  totalBooks: number
  completedBooks: number
  inProgressBooks: number
  lockedBooks: number
  overallMasteryPercent: number
  oldTestamentCompleted: number
  newTestamentCompleted: number
  currentBook: string | null
}

interface JourneyData {
  summary: JourneySummary
  books: BookProgress[]
}

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

export default function Journey() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isVi = i18n.language === 'vi'

  const { data, isLoading, error } = useQuery<JourneyData>({
    queryKey: ['journey', i18n.language],
    queryFn: async () => (await api.get(`/api/me/journey?language=${i18n.language}`)).data,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <div className="glass-card p-6 space-y-3">
          <div className="animate-pulse bg-on-surface/5 h-6 w-48 rounded" />
          <div className="animate-pulse bg-on-surface/5 h-4 w-64 rounded" />
          <div className="animate-pulse bg-on-surface/5 h-3 w-full rounded-full" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-on-surface/5 h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">error</span>
        <p className="text-on-surface-variant">{t('common.error')}</p>
      </div>
    )
  }

  const { summary, books } = data
  const pct = summary.totalBooks > 0 ? Math.round((summary.completedBooks / summary.totalBooks) * 100) : 0

  const oldBooks = books.filter(b => b.testament === 'OLD')
  const newBooks = books.filter(b => b.testament === 'NEW')

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full" data-testid="journey-page">
      {/* Summary */}
      <section className="glass-card p-6" data-testid="journey-summary-card">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-secondary text-2xl" style={FILL_1}>map</span>
          <h1 className="text-xl font-bold text-on-surface">{t('journey.title')}</h1>
        </div>
        <p data-testid="journey-mastery-pct" className="text-on-surface-variant text-sm mb-3">
          {t('journey.conquered', { count: summary.completedBooks, total: summary.totalBooks, percent: pct })}
        </p>
        <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-6 mt-3 text-xs text-on-surface-variant">
          <span data-testid="journey-books-completed" className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            {t('journey.completed')}: {summary.completedBooks}
          </span>
          <span data-testid="journey-books-inprogress" className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {t('journey.inProgress')}: {summary.inProgressBooks}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-on-surface-variant/30" />
            {t('journey.locked')}: {summary.lockedBooks}
          </span>
        </div>
      </section>

      {/* Old Testament */}
      <div data-testid="journey-old-testament">
        <BookSection
          title={t('journey.oldTestament')}
          books={oldBooks}
          isVi={isVi}
          onBookClick={(book) => navigate(`/practice?book=${encodeURIComponent(book.book)}`)}
          t={t}
          testId="journey-ot-tab"
        />
      </div>

      {/* New Testament */}
      <div data-testid="journey-new-testament">
        <BookSection
          title={t('journey.newTestament')}
          books={newBooks}
          isVi={isVi}
          onBookClick={(book) => navigate(`/practice?book=${encodeURIComponent(book.book)}`)}
          t={t}
          testId="journey-nt-tab"
        />
      </div>
    </div>
  )
}

function BookSection({
  title, books, isVi, onBookClick, t, testId
}: {
  title: string
  books: BookProgress[]
  isVi: boolean
  onBookClick: (b: BookProgress) => void
  t: (key: string, opts?: Record<string, any>) => string
  testId?: string
}) {
  return (
    <section data-testid={testId}>
      <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 px-1">{title}</h2>
      <div className="space-y-2">
        {books.map((book, idx) => (
          <BookCard key={book.order} book={book} isVi={isVi} onClick={() => onBookClick(book)} t={t} prevBook={idx > 0 ? books[idx - 1] : null} />
        ))}
      </div>
    </section>
  )
}

function BookCard({
  book, isVi, onClick, t, prevBook
}: {
  book: BookProgress
  isVi: boolean
  onClick: () => void
  t: (key: string, opts?: Record<string, any>) => string
  prevBook: BookProgress | null
}) {
  const isCompleted = book.status === 'COMPLETED'
  const isLocked = book.status === 'LOCKED'
  const bookName = isVi && book.bookVi ? book.bookVi : book.book

  return (
    <div data-testid="journey-book-card">
    <div
      data-testid={`journey-book-card-${book.book}`}
      onClick={isLocked ? undefined : onClick}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-secondary/5 border-secondary/30 cursor-pointer hover:border-secondary/50'
          : isLocked
            ? 'bg-surface-container/50 border-outline-variant/10 opacity-50 cursor-not-allowed'
            : 'bg-surface-container border-outline-variant/10 cursor-pointer hover:border-primary/30'
      }`}
    >
      {/* Status icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        isCompleted ? 'bg-secondary/20' : isLocked ? 'bg-on-surface-variant/10' : 'bg-primary/20'
      }`}>
        <span className={`material-symbols-outlined text-lg ${
          isCompleted ? 'text-secondary' : isLocked ? 'text-on-surface-variant/50' : 'text-primary'
        }`} style={isCompleted ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          {isCompleted ? 'check_circle' : isLocked ? 'lock' : 'menu_book'}
        </span>
      </div>

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span data-testid="journey-book-name" className={`font-semibold text-sm ${isLocked ? 'text-on-surface-variant/50' : 'text-on-surface'}`}>
            {bookName}
          </span>
          <span className="text-[10px] text-on-surface-variant">#{book.order}</span>
        </div>
        {isLocked && prevBook ? (
          <p data-testid="journey-book-mastery" className="text-xs text-on-surface-variant/50 truncate">
            {t('journey.completeToUnlock', { book: isVi && prevBook.bookVi ? prevBook.bookVi : prevBook.book })}
          </p>
        ) : book.totalQuestions > 0 ? (
          <p data-testid="journey-book-mastery" className="text-xs text-on-surface-variant">
            {t('journey.questions', { count: book.totalQuestions })} · {book.masteredQuestions}/{book.totalQuestions}
          </p>
        ) : (
          <p data-testid="journey-book-mastery" className="text-xs text-on-surface-variant/50">{t('journey.noQuestions')}</p>
        )}
      </div>

      {/* Progress bar + percentage */}
      {!isLocked && book.totalQuestions > 0 && (
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-20 h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isCompleted ? 'bg-secondary' : 'bg-primary'}`}
              style={{ width: `${Math.min(book.masteryPercent, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-bold w-10 text-right ${isCompleted ? 'text-secondary' : 'text-on-surface-variant'}`}>
            {book.masteryPercent}%
          </span>
        </div>
      )}
    </div>
    </div>
  )
}
