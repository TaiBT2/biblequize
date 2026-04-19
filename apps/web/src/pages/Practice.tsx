import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useQuery } from '@tanstack/react-query'
import SearchableSelect from '../components/ui/SearchableSelect'
import QuizLanguageSelect from '../components/QuizLanguageSelect'
import { getQuizLanguage, type QuizLanguage } from '../utils/quizLanguage'
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

const SECS_PER_Q: Record<string, number> = {
  all: 22, easy: 15, medium: 22, hard: 30,
}

const MOCK_SESSIONS = [
  { id: 1, date: '28/03/2026', book: 'Ma-thi-ơ', correct: 8, total: 10, accuracy: 80 },
  { id: 2, date: '27/03/2026', book: 'Sáng thế ký', correct: 15, total: 20, accuracy: 75 },
  { id: 3, date: '26/03/2026', book: 'Tất cả', correct: 40, total: 50, accuracy: 80 },
]

const TIP_KEYS = ['practice.tips.tip1', 'practice.tips.tip2', 'practice.tips.tip3']

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

export default function Practice() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [showExplanation, setShowExplanation] = useState(true)
  const [quizLang, setQuizLang] = useState<QuizLanguage>(getQuizLanguage)
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

  const startQuiz = async () => {
    try {
      setIsLoading(true)
      setErrorMsg('')
      const res = await api.post('/api/sessions', {
        mode: 'practice',
        book: selectedBook,
        difficulty: selectedDifficulty,
        questionCount,
        showExplanation,
        language: quizLang,
      })
      const { sessionId, questions } = res.data
      navigate('/quiz', {
        state: { sessionId, questions, book: selectedBook, difficulty: selectedDifficulty, questionCount, showExplanation },
      })
    } catch {
      setErrorMsg(t('practice.errorCreate'))
    } finally {
      setIsLoading(false)
    }
  }

  const estimatedMins = Math.round((questionCount * SECS_PER_Q[selectedDifficulty]) / 60) || 1
  const bookCount = selectedBook ? 1 : books.length || 66
  const isDisabled = isLoading || isBooksLoading
  const tipOfTheDay = t(TIP_KEYS[new Date().getDate() % TIP_KEYS.length])

  return (
    <div data-testid="practice-page" className="space-y-10">

      {/* ── Header ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-2xl" style={FILL_1}>menu_book</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">{t('practice.modeBadge')}</span>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-on-surface mb-3">
          {t('practice.heroTitle')} <span className="text-secondary">{t('practice.heroAccent')}</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed">
          {t('practice.heroDesc')}
        </p>
      </section>

      {/* ── Error ─────────────────────────────────────────── */}
      {errorMsg && (
        <div className="bg-error-container/30 border border-error/20 rounded-2xl p-5 flex items-center gap-4">
          <span className="material-symbols-outlined text-error text-2xl">warning</span>
          <span className="text-error text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* ── Filter Card ───────────────────────────────────── */}
      <form
        className="bg-surface-container rounded-3xl overflow-hidden border border-outline-variant/15"
        onSubmit={e => { e.preventDefault(); if (!isDisabled) startQuiz() }}
      >
        <div className="p-8 md:p-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* ── Left Column ──────────────────────────── */}
            <div className="space-y-8">

              {/* Quiz Language */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-base text-secondary">translate</span>
                  {t('practice.quizLanguage')}
                </label>
                <QuizLanguageSelect onChange={setQuizLang} />
              </div>

              {/* Book Selector */}
              <div data-testid="practice-book-select">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-secondary">auto_stories</span>
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
                <p className="text-on-surface-variant/50 text-xs mt-2">
                  {t('practice.bookHint')}
                </p>
              </div>

              {/* Question Count */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-base text-secondary">quiz</span>
                  {t('practice.questionCount')}
                </label>
                <div className="flex gap-3">
                  {COUNT_OPTIONS.map(num => (
                    <button
                      key={num}
                      data-testid={`practice-count-${num}`}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200
                        ${questionCount === num
                          ? 'gold-gradient text-on-secondary shadow-lg shadow-secondary/20'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column ─────────────────────────── */}
            <div className="space-y-8">

              {/* Difficulty */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-base text-secondary">tune</span>
                  {t('practice.difficulty')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTY_OPTIONS.map(d => {
                    const active = selectedDifficulty === d.key
                    return (
                      <button
                        key={d.key}
                        data-testid={`practice-difficulty-${d.key}`}
                        type="button"
                        onClick={() => setSelectedDifficulty(d.key)}
                        className={`relative flex items-center gap-3 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200
                          ${active
                            ? 'bg-surface-container-highest ring-1 ring-secondary/40 text-on-surface'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                          }`}
                      >
                        <span
                          className="material-symbols-outlined text-xl"
                          style={{ color: d.color, ...(active ? FILL_1 : {}) }}
                        >
                          {d.icon}
                        </span>
                        <span>{t(d.labelKey)}</span>
                        {active && (
                          <span className="material-symbols-outlined text-secondary text-lg ml-auto" style={FILL_1}>check_circle</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Toggle: Show explanation */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-base text-secondary">lightbulb</span>
                  {t('practice.options')}
                </label>
                <button
                  data-testid="practice-show-explanation-toggle"
                  type="button"
                  onClick={() => setShowExplanation(p => !p)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-surface">{t('practice.showExplanation')}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">{t('practice.showExplanationDesc')}</p>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 ${
                      showExplanation ? 'bg-secondary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        showExplanation ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer: Stats + CTA ─────────────────────────── */}
        <div className="bg-surface-container-low border-t border-outline-variant/10 px-8 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            {[
              { icon: 'help_outline', label: t('practice.stats.questions'), value: questionCount },
              { icon: 'schedule',     label: t('practice.stats.minutes'),   value: `~${estimatedMins}` },
              { icon: 'library_books', label: t('practice.stats.books'),    value: bookCount },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary/60 text-xl">{s.icon}</span>
                <div>
                  <p className="text-lg font-black text-on-surface leading-none">{s.value}</p>
                  <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            data-testid="practice-start-btn"
            type="submit"
            disabled={isDisabled}
            className={`gold-gradient text-on-secondary font-black py-4 px-10 rounded-2xl text-sm uppercase tracking-[0.15em] shadow-xl shadow-secondary/20 transition-all
              ${isDisabled
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:scale-[1.02] hover:shadow-2xl hover:shadow-secondary/30 active:scale-95'
              }`}
          >
            {isDisabled ? (
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                {t('practice.starting')}
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg" style={FILL_1}>play_arrow</span>
                {t('practice.start')}
              </span>
            )}
          </button>
        </div>
      </form>

      {/* ── Retry Last Session ─────────────────────────────── */}
      {MOCK_SESSIONS.length > 0 && MOCK_SESSIONS[0].accuracy < 100 && (
        <div className="glass-card rounded-2xl p-5 border border-secondary/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-2xl" style={FILL_1}>replay</span>
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">{t('practice.retryWrongTitle')}</p>
              <p className="text-xs text-on-surface-variant">{t('practice.retryWrongDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              api.post('/api/sessions/practice/retry-last')
                .then(res => navigate('/quiz', { state: { sessionId: res.data.sessionId, mode: 'practice' } }))
                .catch(() => {})
            }}
            className="px-5 py-2.5 rounded-xl border border-secondary/30 text-secondary font-bold text-sm hover:bg-secondary/10 transition-all active:scale-95"
          >
            {t('practice.retryButton')}
          </button>
        </div>
      )}

      {/* ── Recent Sessions ───────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-secondary text-xl" style={FILL_1}>history</span>
          <h2 className="text-xl font-black text-on-surface tracking-tight">{t('practice.recentSessions')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MOCK_SESSIONS.map(session => (
            <div
              key={session.id}
              className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10 hover:border-secondary/20 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-on-surface-variant/50">{session.date}</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  session.accuracy >= 80
                    ? 'bg-[#58D68D]/10 text-[#58D68D]'
                    : session.accuracy >= 60
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-error/10 text-error'
                }`}>
                  {session.accuracy}%
                </span>
              </div>
              <p className="text-sm font-bold text-on-surface mb-1">{session.book}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full rounded-full gold-gradient transition-all"
                    style={{ width: `${session.accuracy}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-on-surface-variant/60">
                  {session.correct}/{session.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tips Section ──────────────────────────────────── */}
      <section className="glass-card rounded-2xl p-6 border border-secondary/10 flex items-start gap-5">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-secondary text-2xl" style={FILL_1}>tips_and_updates</span>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-2">{t('practice.tipsBadge')}</p>
          <p className="text-on-surface-variant text-sm leading-relaxed">{tipOfTheDay}</p>
        </div>
      </section>

      {/* ── Back Link ─────────────────────────────────────── */}
      <div className="pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant/50 hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('practice.backToHome')}
        </Link>
      </div>
    </div>
  )
}
