import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useQuery } from '@tanstack/react-query'
import SearchableSelect from '../components/ui/SearchableSelect'
import QuizLanguageSelect from '../components/QuizLanguageSelect'
import { getQuizLanguage, type QuizLanguage } from '../utils/quizLanguage'
import { getChapterCount, getVerseCount } from '../data/bibleData'
import { useTranslation } from 'react-i18next'

interface Book {
  id: string
  name: string
  nameVi: string
  testament: string
  orderIndex: number
}

const DIFFICULTY_OPTIONS = [
  { key: 'all',    labelKey: 'practice.difficultyAll', icon: 'category',       color: '#c0c4e8' },
  { key: 'easy',   labelKey: 'practice.easy',          icon: 'sentiment_satisfied', color: '#58D68D' },
  { key: 'medium', labelKey: 'practice.medium',        icon: 'speed',          color: '#e8a832' },
  { key: 'hard',   labelKey: 'practice.hard',          icon: 'local_fire_department', color: '#ffb4ab' },
]

const COUNT_OPTIONS = [5, 10, 20, 50]
const MIN_TIME = 5
const MAX_TIME = 120
const DEFAULT_TIME = 30

const MOCK_SESSIONS = [
  { id: 1, date: '28/03/2026', book: 'Ma-thi-ơ', correct: 8, total: 10, accuracy: 80 },
  { id: 2, date: '27/03/2026', book: 'Sáng thế ký', correct: 15, total: 20, accuracy: 75 },
  { id: 3, date: '26/03/2026', book: 'Tất cả', correct: 40, total: 50, accuracy: 80 },
]

const TIP_KEYS = ['practice.tips.tip1', 'practice.tips.tip2', 'practice.tips.tip3']

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

function clampInt(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min
  return Math.max(min, Math.min(max, Math.floor(v)))
}

export default function Practice() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [showExplanation, setShowExplanation] = useState(true)
  const [quizLang, setQuizLang] = useState<QuizLanguage>(getQuizLanguage)
  const [timePerQuestion, setTimePerQuestion] = useState(DEFAULT_TIME)
  const [chapterFrom, setChapterFrom] = useState<number | ''>('')
  const [chapterTo, setChapterTo] = useState<number | ''>('')
  const [verseFrom, setVerseFrom] = useState<number | ''>('')
  const [verseTo, setVerseTo] = useState<number | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const { data: booksData, isLoading: isBooksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const res = await api.get('/api/books')
      return res.data as Book[]
    },
  })

  useEffect(() => {
    if (booksData) setBooks(booksData)
  }, [booksData])

  // Reset chapter/verse when book changes — bounds are book-specific
  useEffect(() => {
    setChapterFrom('')
    setChapterTo('')
    setVerseFrom('')
    setVerseTo('')
  }, [selectedBook])

  // Reset verse when chapters span more than 1 (verse range only valid in single chapter)
  const singleChapterSelected = chapterFrom !== '' && chapterTo !== '' && chapterFrom === chapterTo
  useEffect(() => {
    if (!singleChapterSelected) {
      setVerseFrom('')
      setVerseTo('')
    }
  }, [singleChapterSelected])

  const maxChapter = useMemo(() => selectedBook ? getChapterCount(selectedBook) : 0, [selectedBook])
  const maxVerse = useMemo(
    () => (selectedBook && singleChapterSelected && chapterFrom !== '')
      ? getVerseCount(selectedBook, chapterFrom)
      : 0,
    [selectedBook, singleChapterSelected, chapterFrom]
  )

  // Validation
  const rangeError = useMemo<string | null>(() => {
    if (!selectedBook) return null
    const cf = chapterFrom === '' ? null : chapterFrom
    const ct = chapterTo === '' ? null : chapterTo
    const vf = verseFrom === '' ? null : verseFrom
    const vt = verseTo === '' ? null : verseTo
    if (cf == null && ct == null && vf == null && vt == null) return null
    if (cf != null && (cf < 1 || cf > maxChapter)) return t('practice.rangeError')
    if (ct != null && (ct < 1 || ct > maxChapter)) return t('practice.rangeError')
    if (cf != null && ct != null && cf > ct) return t('practice.rangeError')
    if ((vf != null || vt != null)) {
      if (cf == null || ct == null || cf !== ct) return t('practice.rangeError')
      if (vf != null && (vf < 1 || vf > maxVerse)) return t('practice.rangeError')
      if (vt != null && (vt < 1 || vt > maxVerse)) return t('practice.rangeError')
      if (vf != null && vt != null && vf > vt) return t('practice.rangeError')
    }
    return null
  }, [selectedBook, chapterFrom, chapterTo, verseFrom, verseTo, maxChapter, maxVerse, t])

  const startQuiz = async () => {
    try {
      setIsLoading(true)
      setErrorMsg('')
      const payload: Record<string, unknown> = {
        mode: 'practice',
        book: selectedBook,
        difficulty: selectedDifficulty,
        questionCount,
        showExplanation,
        language: quizLang,
        timePerQuestion,
      }
      if (chapterFrom !== '') payload.chapterFrom = chapterFrom
      if (chapterTo !== '')   payload.chapterTo   = chapterTo
      if (verseFrom !== '')   payload.verseFrom   = verseFrom
      if (verseTo !== '')     payload.verseTo     = verseTo

      const res = await api.post('/api/sessions', payload)
      const { sessionId, questions } = res.data
      navigate('/quiz', {
        state: {
          sessionId,
          questions,
          book: selectedBook,
          difficulty: selectedDifficulty,
          questionCount,
          showExplanation,
          timePerQuestion,
        },
      })
    } catch {
      setErrorMsg(t('practice.errorCreate'))
    } finally {
      setIsLoading(false)
    }
  }

  const estimatedMins = Math.max(1, Math.round((questionCount * timePerQuestion) / 60))
  const bookCount = selectedBook ? 1 : books.length || 66
  const isDisabled = isLoading || isBooksLoading || rangeError != null
  const tipOfTheDay = t(TIP_KEYS[new Date().getDate() % TIP_KEYS.length])

  return (
    <div data-testid="practice-page" className="space-y-8">

      {/* ── Compact Header ─────────────────────────────────── */}
      <section className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-secondary text-xl" style={FILL_1}>menu_book</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary/80 mb-1">
            {t('practice.modeBadge')}
          </p>
          <h1 className="text-2xl font-bold text-on-surface leading-tight mb-1">
            {t('practice.heroTitle')}{t('practice.heroAccent')}
          </h1>
          <p className="text-sm text-on-surface-variant/70">{t('practice.heroDesc')}</p>
        </div>
      </section>

      {/* ── Error ─────────────────────────────────────────── */}
      {errorMsg && (
        <div className="bg-error-container/30 border border-error/20 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-error text-xl">warning</span>
          <span className="text-error text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* ── Filter Card (compact, single panel) ──────────── */}
      <form
        className="bg-surface-container border border-secondary/10 rounded-2xl overflow-hidden"
        onSubmit={e => { e.preventDefault(); if (!isDisabled) startQuiz() }}
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">

            {/* ── Left Column ──────────────────────────── */}
            <div className="space-y-5">
              {/* Quiz Language */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-secondary">translate</span>
                  {t('practice.quizLanguage')}
                </label>
                <QuizLanguageSelect onChange={setQuizLang} />
              </div>

              {/* Book Selector */}
              <div data-testid="practice-book-select">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary">auto_stories</span>
                    {t('practice.selectBook')}
                  </label>
                  <span className="text-[10px] font-bold text-secondary/60 tracking-wider">
                    {t('practice.bookCount', { current: books.length || 66, total: 66 })}
                  </span>
                </div>
                <SearchableSelect
                  options={books.map(b => ({ value: b.name, label: `${b.nameVi} (${b.name})` }))}
                  value={selectedBook}
                  onChange={setSelectedBook}
                  placeholder={t('practice.searchBook')}
                  allLabel={t('practice.allBooks')}
                />
                <p className="text-on-surface-variant/50 text-[11px] mt-1.5">{t('practice.bookHint')}</p>
              </div>

              {/* Question Count */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-secondary">quiz</span>
                  {t('practice.questionCount')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COUNT_OPTIONS.map(num => (
                    <button
                      key={num}
                      data-testid={`practice-count-${num}`}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition-all
                        ${questionCount === num
                          ? 'gold-gradient text-on-secondary shadow-md shadow-secondary/25'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time per Question (slider) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary">timer</span>
                    {t('practice.timePerQuestion')}
                  </label>
                  <span className="text-sm font-bold text-secondary tabular-nums">
                    {t('practice.timePerQuestionValue', { seconds: timePerQuestion })}
                  </span>
                </div>
                <input
                  data-testid="practice-time-slider"
                  type="range"
                  min={MIN_TIME}
                  max={MAX_TIME}
                  step={5}
                  value={timePerQuestion}
                  onChange={e => setTimePerQuestion(Number(e.target.value))}
                  className="w-full accent-secondary"
                  aria-label={t('practice.timePerQuestion')}
                />
                <p className="text-on-surface-variant/50 text-[11px] mt-1">{t('practice.timePerQuestionHint')}</p>
              </div>
            </div>

            {/* ── Right Column ─────────────────────────── */}
            <div className="space-y-5">
              {/* Difficulty */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-secondary">tune</span>
                  {t('practice.difficulty')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTY_OPTIONS.map(d => {
                    const active = selectedDifficulty === d.key
                    return (
                      <button
                        key={d.key}
                        data-testid={`practice-difficulty-${d.key}`}
                        type="button"
                        onClick={() => setSelectedDifficulty(d.key)}
                        className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all
                          ${active
                            ? 'bg-surface-container-highest ring-1 ring-secondary/40 text-on-surface'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                          }`}
                      >
                        <span
                          className="material-symbols-outlined text-lg"
                          style={{ color: d.color, ...(active ? FILL_1 : {}) }}
                        >
                          {d.icon}
                        </span>
                        <span>{t(d.labelKey)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Chapter Range (enabled only when book selected) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary">format_list_numbered</span>
                    {t('practice.chapterRange')}
                  </label>
                  {selectedBook && (
                    <span className="text-[10px] font-bold text-on-surface-variant/50">
                      {t('practice.chapterMaxHint', { max: maxChapter })}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    data-testid="practice-chapter-from"
                    type="number"
                    min={1}
                    max={maxChapter || undefined}
                    placeholder={t('practice.chapterFromLabel')}
                    value={chapterFrom}
                    disabled={!selectedBook}
                    onChange={e => {
                      const v = e.target.value
                      setChapterFrom(v === '' ? '' : clampInt(Number(v), 1, maxChapter))
                    }}
                    className="px-3 py-2.5 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold disabled:opacity-40 placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                  <input
                    data-testid="practice-chapter-to"
                    type="number"
                    min={1}
                    max={maxChapter || undefined}
                    placeholder={t('practice.chapterToLabel')}
                    value={chapterTo}
                    disabled={!selectedBook}
                    onChange={e => {
                      const v = e.target.value
                      setChapterTo(v === '' ? '' : clampInt(Number(v), 1, maxChapter))
                    }}
                    className="px-3 py-2.5 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold disabled:opacity-40 placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>
                <p className="text-on-surface-variant/50 text-[11px] mt-1">
                  {selectedBook ? t('practice.chapterRangeHint') : t('practice.chapterRangeHint')}
                </p>
              </div>

              {/* Verse Range (enabled only when single chapter selected) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary">subject</span>
                    {singleChapterSelected
                      ? t('practice.verseRange', { chapter: chapterFrom })
                      : t('practice.verseRange', { chapter: '—' })}
                  </label>
                  {singleChapterSelected && maxVerse > 0 && (
                    <span className="text-[10px] font-bold text-on-surface-variant/50">
                      {t('practice.verseMaxHint', { max: maxVerse })}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    data-testid="practice-verse-from"
                    type="number"
                    min={1}
                    max={maxVerse || undefined}
                    placeholder={t('practice.verseFromLabel')}
                    value={verseFrom}
                    disabled={!singleChapterSelected}
                    onChange={e => {
                      const v = e.target.value
                      setVerseFrom(v === '' ? '' : clampInt(Number(v), 1, maxVerse))
                    }}
                    className="px-3 py-2.5 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold disabled:opacity-40 placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                  <input
                    data-testid="practice-verse-to"
                    type="number"
                    min={1}
                    max={maxVerse || undefined}
                    placeholder={t('practice.verseToLabel')}
                    value={verseTo}
                    disabled={!singleChapterSelected}
                    onChange={e => {
                      const v = e.target.value
                      setVerseTo(v === '' ? '' : clampInt(Number(v), 1, maxVerse))
                    }}
                    className="px-3 py-2.5 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold disabled:opacity-40 placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>
                <p className="text-on-surface-variant/50 text-[11px] mt-1">{t('practice.verseRangeHint')}</p>
              </div>
            </div>
          </div>

          {/* Range error inline */}
          {rangeError && (
            <div data-testid="practice-range-error" className="bg-error-container/20 border border-error/30 rounded-lg p-3 text-error text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {rangeError}
            </div>
          )}
        </div>

        {/* ── Footer: Show Explanation Toggle + CTA ─────── */}
        <div className="border-t border-outline-variant/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low/40">
          <button
            data-testid="practice-show-explanation-toggle"
            type="button"
            onClick={() => setShowExplanation(p => !p)}
            className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base text-secondary" style={FILL_1}>lightbulb</span>
            <span className="font-semibold">{t('practice.showExplanation')}</span>
            <div
              className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                showExplanation ? 'bg-secondary' : 'bg-surface-container-highest'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  showExplanation ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          <button
            data-testid="practice-start-btn"
            type="submit"
            disabled={isDisabled}
            className={`gold-gradient text-on-secondary font-bold py-3 px-7 rounded-xl text-sm shadow-lg shadow-secondary/25 transition-all
              ${isDisabled
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:scale-[1.02] active:scale-95'
              }`}
          >
            {isLoading || isBooksLoading ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                {t('practice.starting')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" style={FILL_1}>play_arrow</span>
                {t('practice.start')}
              </span>
            )}
          </button>
        </div>

        {/* Mini stats line */}
        <div className="text-center text-[11px] text-on-surface-variant/50 pb-3">
          {questionCount} · ~{estimatedMins} {t('practice.stats.minutes').toLowerCase()} · {bookCount} {t('practice.stats.books').toLowerCase()}
        </div>
      </form>

      {/* ── Retry Last Session ─────────────────────────────── */}
      {MOCK_SESSIONS.length > 0 && MOCK_SESSIONS[0].accuracy < 100 && (
        <div className="bg-gradient-to-r from-[#ff8c42]/10 to-surface-container border border-[#ff8c42]/25 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ff8c42]/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#ff8c42] text-lg" style={FILL_1}>replay</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-surface text-sm">{t('practice.retryWrongTitle')}</p>
            <p className="text-xs text-on-surface-variant/70">{t('practice.retryWrongDesc')}</p>
          </div>
          <button
            onClick={() => {
              api.post('/api/sessions/practice/retry-last')
                .then(res => navigate('/quiz', { state: { sessionId: res.data.sessionId, mode: 'practice' } }))
                .catch(() => {})
            }}
            className="px-4 py-2 rounded-lg bg-[#ff8c42]/15 border border-[#ff8c42]/35 text-[#ff8c42] font-semibold text-xs hover:bg-[#ff8c42]/20 transition-all active:scale-95"
          >
            {t('practice.retryButton')} →
          </button>
        </div>
      )}

      {/* ── Recent Sessions ───────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-secondary text-base" style={FILL_1}>history</span>
          <h2 className="text-sm font-bold text-on-surface">{t('practice.recentSessions')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MOCK_SESSIONS.map(session => (
            <div
              key={session.id}
              className="bg-surface-container border border-outline-variant/10 rounded-xl p-4 hover:border-secondary/25 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-on-surface-variant/50">{session.date}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  session.accuracy >= 80
                    ? 'bg-[#58D68D]/10 text-[#58D68D]'
                    : session.accuracy >= 60
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-error/10 text-error'
                }`}>
                  {session.accuracy}%
                </span>
              </div>
              <p className="text-sm font-semibold text-on-surface mb-2">{session.book}</p>
              <div className="h-1 rounded-full bg-surface-container-highest overflow-hidden mb-1">
                <div className="h-full gold-gradient" style={{ width: `${session.accuracy}%` }} />
              </div>
              <span className="text-[11px] text-on-surface-variant/50">
                {session.correct}/{session.total}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tips Section ──────────────────────────────────── */}
      <div className="bg-[#6AB8E8]/8 border border-[#6AB8E8]/20 rounded-xl p-3 flex items-center gap-3">
        <span className="material-symbols-outlined text-[#6AB8E8] text-lg" style={FILL_1}>tips_and_updates</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6AB8E8] mb-0.5">{t('practice.tipsBadge')}</p>
          <p className="text-xs text-on-surface-variant">{tipOfTheDay}</p>
        </div>
      </div>

      {/* ── Back Link ─────────────────────────────────────── */}
      <div className="pb-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant/50 hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {t('practice.backToHome')}
        </Link>
      </div>
    </div>
  )
}
